from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.user_request import RequestStatus


class UserRequestCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    contact_email: EmailStr | None = None
    contact_text: str = ""


class UserRequestUpdate(BaseModel):
    status: RequestStatus
    admin_note: str = ""


class UserRequestResponse(BaseModel):
    id: int
    title: str
    description: str
    contact_email: EmailStr | None
    contact_text: str
    status: RequestStatus
    admin_note: str
    notified_at: datetime | None
    created_at: datetime
    updated_at: datetime | None

    model_config = {"from_attributes": True}


class UserRequestListResponse(BaseModel):
    items: list[UserRequestResponse]
    total: int
    page: int
    page_size: int
