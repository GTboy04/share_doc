import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db
from app.core.config import get_settings
from app.models.user_request import RequestStatus, UserRequest
from app.schemas.user_request import UserRequestCreate, UserRequestResponse
from app.services.mail import mail_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/requests", response_model=UserRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_request(payload: UserRequestCreate, db: AsyncSession = Depends(get_db)) -> UserRequestResponse:
    logger.info(
        "received public request submission title=%s has_email=%s has_contact_text=%s",
        payload.title,
        bool(payload.contact_email),
        bool(payload.contact_text),
    )
    request = UserRequest(
        title=payload.title,
        description=payload.description,
        contact_email=payload.contact_email,
        contact_text=payload.contact_text,
        status=RequestStatus.PENDING.value,
    )
    db.add(request)
    await db.commit()
    await db.refresh(request)
    logger.info(
        "persisted public request request_id=%s title=%s has_email=%s",
        request.id,
        request.title,
        bool(request.contact_email),
    )

    settings = get_settings()
    logger.info(
        "sending admin request notification request_id=%s recipient=%s smtp_suppress_send=%s",
        request.id,
        settings.admin_email,
        settings.smtp_suppress_send,
    )
    try:
        mail_service.send_mail(
            settings.admin_email,
            f"新需求通知：{request.title}",
            f"标题：{request.title}\n描述：{request.description}\n联系方式：{request.contact_text}\n邮箱：{request.contact_email or '未填写'}",
        )
    except Exception as exc:  # pragma: no cover - exercised in integration
        logger.exception(
            "failed to send admin request notification request_id=%s recipient=%s",
            request.id,
            settings.admin_email,
        )
        raise HTTPException(status_code=502, detail=f"Failed to notify admin: {exc}") from exc

    logger.info("sent admin request notification request_id=%s recipient=%s", request.id, settings.admin_email)

    return UserRequestResponse.model_validate(request)
