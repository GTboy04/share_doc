from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.api.dependencies import get_current_admin, get_db
from app.models.admin_user import AdminUser
from app.models.category import Category
from app.models.resource import Resource, ResourceLink
from app.schemas.resource import ResourceCreate, ResourceListResponse, ResourceResponse, ResourceUpdate

router = APIRouter()


@router.get("", response_model=ResourceListResponse)
async def list_resources(
    db: AsyncSession = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    keyword: str | None = None,
    category_id: int | None = None,
    year: int | None = Query(None, ge=1000, le=9999),
    status_filter: str | None = Query(None, alias="status"),
) -> ResourceListResponse:
    query = select(Resource).options(joinedload(Resource.category), joinedload(Resource.links)).join(Category)
    if keyword:
        pattern = f"%{keyword}%"
        query = query.where(
            or_(
                Resource.title.ilike(pattern),
                Resource.description.ilike(pattern),
                Resource.tags.ilike(pattern),
            )
        )
    if category_id:
        query = query.where(Resource.category_id == category_id)
    if year is not None:
        query = query.where(Resource.year == year)
    if status_filter:
        query = query.where(Resource.status == status_filter)
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


@router.post("", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
async def create_resource(
    payload: ResourceCreate,
    db: AsyncSession = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> ResourceResponse:
    category = await db.get(Category, payload.category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    payload_data = payload.model_dump(exclude={"links"})
    resource = Resource(**payload_data)
    for index, link in enumerate(payload.links):
        resource.links.append(
            ResourceLink(
                platform_type=link.platform_type.value,
                custom_title=link.custom_title,
                url=str(link.url) if link.url is not None else None,
                sort_order=link.sort_order if link.sort_order is not None else index,
            )
        )
    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    resource = await db.scalar(
        select(Resource).options(joinedload(Resource.category), joinedload(Resource.links)).where(Resource.id == resource.id)
    )
    return ResourceResponse.model_validate(resource)


@router.put("/{resource_id}", response_model=ResourceResponse)
async def update_resource(
    resource_id: int,
    payload: ResourceUpdate,
    db: AsyncSession = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> ResourceResponse:
    resource = await db.scalar(select(Resource).options(joinedload(Resource.links)).where(Resource.id == resource_id))
    if resource is None:
        raise HTTPException(status_code=404, detail="Resource not found")
    category = await db.get(Category, payload.category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    payload_data = payload.model_dump(exclude={"links"})
    for key, value in payload_data.items():
        setattr(resource, key, value)

    existing_links = {link.id: link for link in resource.links}
    next_links: list[ResourceLink] = []
    for index, link in enumerate(payload.links):
        persisted_link = existing_links.get(link.id) if link.id is not None else None
        if persisted_link is None:
            persisted_link = ResourceLink()
        persisted_link.platform_type = link.platform_type.value
        persisted_link.custom_title = link.custom_title
        persisted_link.url = str(link.url) if link.url is not None else None
        persisted_link.sort_order = link.sort_order if link.sort_order is not None else index
        next_links.append(persisted_link)

    resource.links = next_links
    await db.commit()
    await db.refresh(resource)
    resource = await db.scalar(
        select(Resource).options(joinedload(Resource.category), joinedload(Resource.links)).where(Resource.id == resource.id)
    )
    return ResourceResponse.model_validate(resource)


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    resource_id: int,
    db: AsyncSession = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> Response:
    resource = await db.get(Resource, resource_id)
    if resource is None:
        raise HTTPException(status_code=404, detail="Resource not found")
    await db.delete(resource)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
