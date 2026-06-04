"""Add copy count to resource links."""

from alembic import op
import sqlalchemy as sa


revision = "20260604_000004"
down_revision = "20260603_000003"
branch_labels = None
depends_on = None


def _has_table(inspector: sa.Inspector, table_name: str) -> bool:
    return table_name in inspector.get_table_names()


def _has_column(inspector: sa.Inspector, table_name: str, column_name: str) -> bool:
    if not _has_table(inspector, table_name):
        return False
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _has_column(inspector, "resource_links", "copy_count"):
        op.add_column(
            "resource_links",
            sa.Column("copy_count", sa.Integer(), nullable=False, server_default="0"),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if _has_column(inspector, "resource_links", "copy_count"):
        op.drop_column("resource_links", "copy_count")
