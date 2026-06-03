import asyncio
from pathlib import Path

from alembic import command
from alembic.config import Config

from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine


async def create_all_tables() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)


def _sqlite_database_needs_bootstrap(database_url: str) -> bool:
    if ":memory:" in database_url:
        return True
    prefix = "sqlite+aiosqlite:///"
    if not database_url.startswith(prefix):
        return False
    database_path = Path(database_url.removeprefix(prefix))
    return not database_path.exists()


def _run_migrations_sync() -> None:
    backend_dir = Path(__file__).resolve().parents[2]
    config = Config(str(backend_dir / "alembic.ini"))
    config.set_main_option("script_location", str(backend_dir / "alembic"))
    config.set_main_option("sqlalchemy.url", get_settings().database_url)
    config.attributes["skip_logging_config"] = True
    command.upgrade(config, "head")


async def run_migrations() -> None:
    await asyncio.to_thread(_run_migrations_sync)


async def prepare_database() -> None:
    database_url = get_settings().database_url
    if database_url.startswith("sqlite"):
        if _sqlite_database_needs_bootstrap(database_url):
            await create_all_tables()
        return
    await run_migrations()
