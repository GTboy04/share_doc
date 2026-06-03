from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_admin, get_db
from app.models.admin_user import AdminUser
from app.models.category import Category
from app.models.resource import Resource
from app.schemas.category import CategoryAdminResponse, CategoryCreate, CategoryListResponse, CategoryUpdate

router = APIRouter()


@router.get("", response_model=CategoryListResponse)
async def list_categories(
    db: AsyncSession = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> CategoryListResponse:
    items = (await db.scalars(select(Category).order_by(Category.sort_order.asc(), Category.id.asc()))).all()
    return CategoryListResponse(items=[CategoryAdminResponse.model_validate(item) for item in items])


@router.post("", response_model=CategoryAdminResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> CategoryAdminResponse:
    category = Category(**payload.model_dump())
    db.add(category)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Category slug already exists") from exc
    await db.refresh(category)
    return CategoryAdminResponse.model_validate(category)


@router.put("/{category_id}", response_model=CategoryAdminResponse)
async def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> CategoryAdminResponse:
    category = await db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    for key, value in payload.model_dump().items():
        setattr(category, key, value)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Category slug already exists") from exc
    await db.refresh(category)
    return CategoryAdminResponse.model_validate(category)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    _: AdminUser = Depends(get_current_admin),
) -> Response:
    category = await db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    resource_count = await db.scalar(select(func.count()).select_from(Resource).where(Resource.category_id == category_id)) or 0
    if resource_count > 0:
        raise HTTPException(status_code=409, detail="Category is still used by resources")
    await db.delete(category)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
