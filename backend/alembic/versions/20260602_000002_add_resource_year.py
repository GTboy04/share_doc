"""Add resource year column."""

from alembic import op
import sqlalchemy as sa


revision = "20260602_000002"
down_revision = "20260602_000001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("resources", sa.Column("year", sa.Integer(), nullable=True))
    op.execute("UPDATE resources SET year = EXTRACT(YEAR FROM CURRENT_DATE)::int WHERE year IS NULL")
    op.alter_column("resources", "year", nullable=False)
    op.create_index("ix_resources_year", "resources", ["year"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_resources_year", table_name="resources")
    op.drop_column("resources", "year")
