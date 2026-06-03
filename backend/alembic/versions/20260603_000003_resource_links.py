"""Replace single resource link with resource links table."""

from alembic import op
import sqlalchemy as sa


revision = "20260603_000003"
down_revision = "20260602_000002"
branch_labels = None
depends_on = None


def _has_table(inspector: sa.Inspector, table_name: str) -> bool:
    return table_name in inspector.get_table_names()


def _has_column(inspector: sa.Inspector, table_name: str, column_name: str) -> bool:
    if not _has_table(inspector, table_name):
        return False
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def _has_index(inspector: sa.Inspector, table_name: str, index_name: str) -> bool:
    if not _has_table(inspector, table_name):
        return False
    return any(index["name"] == index_name for index in inspector.get_indexes(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _has_table(inspector, "resource_links"):
        op.create_table(
            "resource_links",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("resource_id", sa.Integer(), sa.ForeignKey("resources.id", ondelete="CASCADE"), nullable=False),
            sa.Column("platform_type", sa.String(length=20), nullable=False, server_default="custom"),
            sa.Column("custom_title", sa.String(length=255), nullable=False, server_default=""),
            sa.Column("url", sa.Text(), nullable=True),
            sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        inspector = sa.inspect(bind)

    if not _has_index(inspector, "resource_links", "ix_resource_links_resource_id"):
        op.create_index("ix_resource_links_resource_id", "resource_links", ["resource_id"], unique=False)

    if _has_column(inspector, "resources", "link"):
        op.execute(
            """
            INSERT INTO resource_links (resource_id, platform_type, custom_title, url, sort_order)
            SELECT r.id, 'custom', '', r.link, 0
            FROM resources AS r
            WHERE r.link IS NOT NULL
              AND r.link <> ''
              AND NOT EXISTS (
                  SELECT 1
                  FROM resource_links AS rl
                  WHERE rl.resource_id = r.id
                    AND rl.sort_order = 0
              )
            """
        )
        op.drop_column("resources", "link")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not _has_column(inspector, "resources", "link"):
        op.add_column("resources", sa.Column("link", sa.Text(), nullable=True))
        inspector = sa.inspect(bind)

    if _has_table(inspector, "resource_links"):
        op.execute(
            """
            UPDATE resources AS r
            SET link = rl.url
            FROM (
                SELECT resource_id, url
                FROM resource_links
                WHERE sort_order = 0
            ) AS rl
            WHERE r.id = rl.resource_id
            """
        )

    op.alter_column("resources", "link", nullable=False)

    if _has_index(inspector, "resource_links", "ix_resource_links_resource_id"):
        op.drop_index("ix_resource_links_resource_id", table_name="resource_links")
        inspector = sa.inspect(bind)
    if _has_table(inspector, "resource_links"):
        op.drop_table("resource_links")
