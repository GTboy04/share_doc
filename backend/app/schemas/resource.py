from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl

from app.models.resource import ResourceLinkPlatform, ResourceStatus
from app.schemas.category import CategoryResponse


class ResourceLinkBase(BaseModel):
    id: int | None = None
    platform_type: ResourceLinkPlatform
    custom_title: str = Field(default="", max_length=255)
    url: HttpUrl | None = None
    sort_order: int = Field(default=0, ge=0)


class ResourceLinkCreate(ResourceLinkBase):
    pass


class ResourceLinkResponse(BaseModel):
    id: int
    platform_type: ResourceLinkPlatform
    platform_label: str
    custom_title: str
    url: str | None
    sort_order: int
    copy_count: int


class ResourceBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    category_id: int
    year: int = Field(ge=1000, le=9999)
    description: str = ""
    tags: str = ""
    links: list[ResourceLinkCreate] = Field(default_factory=list)
    status: ResourceStatus = ResourceStatus.ACTIVE


class ResourceCreate(ResourceBase):
    pass


class ResourceUpdate(ResourceBase):
    pass


class ResourceResponse(BaseModel):
    id: int
    title: str
    year: int
    description: str
    tags: str
    links: list[ResourceLinkResponse]
    copy_count_total: int
    status: ResourceStatus
    category: CategoryResponse
    created_at: datetime
    updated_at: datetime | None

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        if hasattr(obj, "links"):
            obj_links = []
            for item in obj.links:
                platform = ResourceLinkPlatform(item.platform_type)
                obj_links.append(
                    ResourceLinkResponse(
                        id=item.id,
                        platform_type=platform,
                        platform_label=platform.label,
                        custom_title=item.custom_title,
                        url=item.url,
                        sort_order=item.sort_order,
                        copy_count=item.copy_count,
                    )
                )
            data = {
                "id": obj.id,
                "title": obj.title,
                "year": obj.year,
                "description": obj.description,
                "tags": obj.tags,
                "links": obj_links,
                "copy_count_total": sum(item.copy_count for item in obj_links),
                "status": obj.status,
                "category": obj.category,
                "created_at": obj.created_at,
                "updated_at": obj.updated_at,
            }
            return super().model_validate(data, *args, **kwargs)
        return super().model_validate(obj, *args, **kwargs)


class ResourceListResponse(BaseModel):
    items: list[ResourceResponse]
    total: int
    page: int
    page_size: int


class ResourceLinkCopyResponse(BaseModel):
    link_id: int
    copy_count: int
