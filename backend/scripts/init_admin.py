import asyncio
import sys
from pathlib import Path

from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.security import get_password_hash
from app.db.setup import prepare_database
from app.db.session import SessionLocal, engine
from app.models.admin_user import AdminUser


async def init_admin(username: str, password: str) -> None:
    await prepare_database()

    async with SessionLocal() as session:
        existing = await session.scalar(select(AdminUser).where(AdminUser.username == username))
        if existing:
            print(f"Admin '{username}' already exists.")
            return
        session.add(AdminUser(username=username, password_hash=get_password_hash(password)))
        await session.commit()
        print(f"Admin '{username}' created successfully.")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Initialize the first admin user.")
    parser.add_argument("--username", required=True)
    parser.add_argument("--password", required=True)
    args = parser.parse_args()
    asyncio.run(init_admin(args.username, args.password))
