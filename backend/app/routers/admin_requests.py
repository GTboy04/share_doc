import logging
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_admin, get_db
from app.models.admin_user import AdminUser
from app.models.user_request import RequestStatus, UserRequest
from app.schemas.user_request import UserRequestListResponse, UserRequestResponse, UserRequestUpdate
from app.services.mail import mail_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("", response_model=UserRequestListResponse)
async def list_requests(
    db: AsyncSession = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    keyword: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
) -> UserRequestListResponse:
    query = select(UserRequest)
    if keyword:
        pattern = f"%{keyword}%"
        query = query.where(
            or_(
                UserRequest.title.ilike(pattern),
                UserRequest.description.ilike(pattern),
                UserRequest.contact_text.ilike(pattern),
            )
        )
    if status_filter:
        query = query.where(UserRequest.status == status_filter)
    total = await db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = (
        await db.scalars(
            query.order_by(UserRequest.created_at.desc(), UserRequest.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).all()
    return UserRequestListResponse(
        items=[UserRequestResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.put("/{request_id}", response_model=UserRequestResponse)
async def update_request(
    request_id: int,
    payload: UserRequestUpdate,
    db: AsyncSession = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> UserRequestResponse:
    logger.info(
        "received admin request update request_id=%s next_status=%s has_admin_note=%s",
        request_id,
        payload.status.value,
        bool(payload.admin_note),
    )
    request = await db.get(UserRequest, request_id)
    if request is None:
        raise HTTPException(status_code=404, detail="Request not found")
    previous_status = request.status
    request.status = payload.status.value
    request.admin_note = payload.admin_note
    await db.commit()
    await db.refresh(request)
    logger.info(
        "updated admin request request_id=%s from_status=%s to_status=%s",
        request.id,
        previous_status,
        request.status,
    )
    return UserRequestResponse.model_validate(request)


@router.post("/{request_id}/notify", response_model=UserRequestResponse)
async def notify_request_completion(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> UserRequestResponse:
    logger.info("received request completion notification trigger request_id=%s", request_id)
    request = await db.get(UserRequest, request_id)
    if request is None:
        raise HTTPException(status_code=404, detail="Request not found")
    if request.status != RequestStatus.DONE.value:
        logger.info(
            "rejected request notification request_id=%s status=%s",
            request_id,
            request.status,
        )
        raise HTTPException(status_code=400, detail="Only completed requests can be notified")
    if not request.contact_email:
        logger.info("rejected request notification request_id=%s reason=missing_email", request_id)
        raise HTTPException(status_code=400, detail="Request does not have a contact email")

    logger.info(
        "sending completion notification request_id=%s recipient=%s admin_note_present=%s",
        request.id,
        request.contact_email,
        bool(request.admin_note),
    )
    try:
        mail_service.send_mail(
            request.contact_email,
            f"需求已处理完成：{request.title}",
            f"您的需求“{request.title}”已处理完成。\n备注：{request.admin_note or '请返回平台查看'}",
        )
    except Exception as exc:  # pragma: no cover - exercised in integration
        logger.exception(
            "failed to send request completion notification request_id=%s recipient=%s",
            request.id,
            request.contact_email,
        )
        raise HTTPException(status_code=502, detail=f"Failed to send notification: {exc}") from exc

    request.notified_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(request)
    logger.info(
        "sent request completion notification request_id=%s recipient=%s",
        request.id,
        request.contact_email,
    )
    return UserRequestResponse.model_validate(request)
