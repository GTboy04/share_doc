from datetime import datetime

from pydantic import BaseModel, Field

from app.models.category import CategoryStatus


class CategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    slug: str = Field(min_length=1, max_length=120)
    sort_order: int = 0
    status: CategoryStatus = CategoryStatus.ACTIVE


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: int

    model_config = {"from_attributes": True}


class CategoryAdminResponse(CategoryResponse):
    created_at: datetime
    updated_at: datetime | None


class CategoryListResponse(BaseModel):
    items: list[CategoryResponse]
