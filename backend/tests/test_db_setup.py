import asyncio
from types import SimpleNamespace

import pytest

from app.db import setup


@pytest.fixture(autouse=True)
def reset_database():
    yield


def test_prepare_database_runs_create_all_for_new_sqlite_db(monkeypatch):
    calls: list[str] = []

    async def fake_create_all_tables() -> None:
        calls.append("create_all")

    async def fake_run_migrations() -> None:
        calls.append("migrate")

    monkeypatch.setattr(
        setup,
        "get_settings",
        lambda: SimpleNamespace(database_url="sqlite+aiosqlite:///./missing-test-share-platform.db"),
    )
    monkeypatch.setattr(setup, "create_all_tables", fake_create_all_tables)
    monkeypatch.setattr(setup, "run_migrations", fake_run_migrations)

    asyncio.run(setup.prepare_database())

    assert calls == ["create_all"]


def test_prepare_database_skips_existing_sqlite_db(monkeypatch):
    calls: list[str] = []

    async def fake_create_all_tables() -> None:
        calls.append("create_all")

    async def fake_run_migrations() -> None:
        calls.append("migrate")

    monkeypatch.setattr(
        setup,
        "get_settings",
        lambda: SimpleNamespace(database_url="sqlite+aiosqlite:///./test_share_platform.db"),
    )
    monkeypatch.setattr(setup, "create_all_tables", fake_create_all_tables)
    monkeypatch.setattr(setup, "run_migrations", fake_run_migrations)

    asyncio.run(setup.prepare_database())

    assert calls == []


def test_prepare_database_runs_migrations_for_postgres(monkeypatch):
    calls: list[str] = []

    async def fake_create_all_tables() -> None:
        calls.append("create_all")

    async def fake_run_migrations() -> None:
        calls.append("migrate")

    monkeypatch.setattr(
        setup,
        "get_settings",
        lambda: SimpleNamespace(database_url="postgresql+asyncpg://postgres:password@127.0.0.1:5432/share_platform"),
    )
    monkeypatch.setattr(setup, "create_all_tables", fake_create_all_tables)
    monkeypatch.setattr(setup, "run_migrations", fake_run_migrations)

    asyncio.run(setup.prepare_database())

    assert calls == ["migrate"]


def test_run_migrations_sync_marks_alembic_config_to_skip_logging_override(monkeypatch):
    captured: dict[str, object] = {}

    class FakeConfig:
        def __init__(self, path: str) -> None:
            self.path = path
            self.options: dict[str, str] = {}
            self.attributes: dict[str, object] = {}

        def set_main_option(self, key: str, value: str) -> None:
            self.options[key] = value

    def fake_upgrade(config, revision: str) -> None:
        captured["config"] = config
        captured["revision"] = revision

    monkeypatch.setattr(
        setup,
        "get_settings",
        lambda: SimpleNamespace(database_url="postgresql+asyncpg://postgres:password@127.0.0.1:5432/share_platform"),
    )
    monkeypatch.setattr(setup, "Config", FakeConfig)
    monkeypatch.setattr(setup.command, "upgrade", fake_upgrade)

    setup._run_migrations_sync()

    config = captured["config"]
    assert captured["revision"] == "head"
    assert config.attributes["skip_logging_config"] is True
