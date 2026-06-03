from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.api.dependencies import get_db
from app.models.category import Category
from app.models.resource import Resource, ResourceStatus
from app.schemas.resource import ResourceListResponse, ResourceResponse

router = APIRouter()


@router.get("/resources", response_model=ResourceListResponse)
async def list_public_resources(
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    keyword: str | None = None,
    category_slug: str | None = None,
    year: int | None = Query(None, ge=1000, le=9999),
) -> ResourceListResponse:
    query = (
        select(Resource)
        .options(joinedload(Resource.category), joinedload(Resource.links))
        .join(Category)
        .where(Resource.status == ResourceStatus.ACTIVE.value)
    )
    if keyword:
        pattern = f"%{keyword}%"
        query = query.where(
            or_(
                Resource.title.ilike(pattern),
                Resource.description.ilike(pattern),
                Resource.tags.ilike(pattern),
            )
        )
    if category_slug:
        query = query.where(Category.slug == category_slug)
    if year is not None:
        query = query.where(Resource.year == year)

    total = await db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = (
        await db.scalars(
            query.order_by(Resource.year.desc(), Resource.updated_at.desc(), Resource.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    ).unique().all()
    return ResourceListResponse(
        items=[ResourceResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/resources/{resource_id}", response_model=ResourceResponse)
async def get_public_resource(resource_id: int, db: AsyncSession = Depends(get_db)) -> ResourceResponse:
    resource = await db.scalar(
        select(Resource)
        .options(joinedload(Resource.category), joinedload(Resource.links))
        .where(Resource.id == resource_id, Resource.status == ResourceStatus.ACTIVE.value)
    )
    if resource is None:
        raise HTTPException(status_code=404, detail="Resource not found")
    return ResourceResponse.model_validate(resource)
