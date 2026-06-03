import asyncio
import os
from collections.abc import AsyncGenerator, Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

SQLALCHEMY_TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_share_platform.db"
os.environ["DATABASE_URL"] = SQLALCHEMY_TEST_DATABASE_URL
os.environ["SMTP_SUPPRESS_SEND"] = "true"

from app.api.dependencies import get_current_admin, get_db
from app.core.security import get_password_hash
from app.db.base import Base
from app.main import create_app
from app.models.admin_user import AdminUser

engine = create_async_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=NullPool,
)
TestingSessionLocal = async_sessionmaker(bind=engine, autocommit=False, autoflush=False, expire_on_commit=False)


def run_async(awaitable):
    return asyncio.run(awaitable)


@pytest.fixture(autouse=True)
def reset_database() -> Generator[None, None, None]:
    async def reset() -> None:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.drop_all)
            await connection.run_sync(Base.metadata.create_all)

    run_async(reset())
    yield


@pytest.fixture()
def db_session() -> Generator[AsyncSession, None, None]:
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        run_async(session.close())


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    app = create_app()

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with TestingSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def admin_user() -> AdminUser:
    async def create_admin() -> AdminUser:
        async with TestingSessionLocal() as session:
            admin = AdminUser(username="admin", password_hash=get_password_hash("password123"))
            session.add(admin)
            await session.commit()
            await session.refresh(admin)
            return admin

    return run_async(create_admin())


@pytest.fixture()
def admin_headers(client: TestClient, admin_user: AdminUser) -> dict[str, str]:
    response = client.post(
        "/api/admin/auth/login",
        json={"username": admin_user.username, "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
