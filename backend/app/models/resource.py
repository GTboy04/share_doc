from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ResourceStatus(StrEnum):
    ACTIVE = "active"
    HIDDEN = "hidden"
    EXPIRED = "expired"


class ResourceLinkPlatform(StrEnum):
    QUARK = "quark"
    BAIDU = "baidu"
    XUNLEI = "xunlei"
    CUSTOM = "custom"

    @property
    def label(self) -> str:
        return {
            ResourceLinkPlatform.QUARK: "夸克网盘",
            ResourceLinkPlatform.BAIDU: "百度网盘",
            ResourceLinkPlatform.XUNLEI: "迅雷网盘",
            ResourceLinkPlatform.CUSTOM: "自定义链接",
        }[self]


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    tags: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default=ResourceStatus.ACTIVE.value)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    category = relationship("Category", back_populates="resources")
    links = relationship(
        "ResourceLink",
        back_populates="resource",
        cascade="all, delete-orphan",
        order_by="ResourceLink.sort_order",
    )


class ResourceLink(Base):
    __tablename__ = "resource_links"

    id: Mapped[int] = mapped_column(primary_key=True)
    resource_id: Mapped[int] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), nullable=False, index=True)
    platform_type: Mapped[str] = mapped_column(String(20), nullable=False, default=ResourceLinkPlatform.CUSTOM.value)
    custom_title: Mapped[str] = mapped_column(String(255), default="")
    url: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    copy_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    resource = relationship("Resource", back_populates="links")
