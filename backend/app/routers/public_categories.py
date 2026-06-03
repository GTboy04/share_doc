from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db
from app.models.category import Category, CategoryStatus
from app.schemas.category import CategoryListResponse, CategoryResponse

router = APIRouter()


@router.get("/categories", response_model=CategoryListResponse)
async def list_public_categories(db: AsyncSession = Depends(get_db)) -> CategoryListResponse:
    items = (
        await db.scalars(
            select(Category)
            .where(Category.status == CategoryStatus.ACTIVE.value)
            .order_by(Category.sort_order.asc(), Category.id.asc())
        )
    ).all()
    return CategoryListResponse(items=[CategoryResponse.model_validate(item) for item in items])
