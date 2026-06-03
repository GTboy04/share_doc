import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_application_logging
from app.db.setup import prepare_database
from app.models import admin_user, category, resource, user_request  # noqa: F401

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_application_logging()
    settings = get_settings()
    logger.info("loaded settings summary %s", settings.log_safe_dict())
    await prepare_database()
    logger.info("share platform api started")
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="Share Platform API", lifespan=lifespan)
    app.include_router(api_router)
    return app


app = create_app()
