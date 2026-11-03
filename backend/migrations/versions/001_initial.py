"""Initial lab schema."""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("cases", sa.Column("id", sa.String, primary_key=True), sa.Column("data", sa.JSON, nullable=False))
    for name in ("alerts", "logs", "timeline", "attempts"):
        columns = [
            sa.Column("id", sa.String, primary_key=True),
            sa.Column("case_id", sa.String, sa.ForeignKey("cases.id"), nullable=False),
            sa.Column("data", sa.JSON, nullable=False),
        ]
        if name == "alerts":
            columns.append(sa.Column("status", sa.String, nullable=False))
        if name == "timeline":
            columns.append(sa.Column("source", sa.String, nullable=False))
        op.create_table(name, *columns)
    op.create_table("notes",
                    sa.Column("case_id", sa.String, sa.ForeignKey("cases.id"), primary_key=True),
                    sa.Column("text", sa.Text, nullable=False))
    op.create_table("trends", sa.Column("day", sa.String, primary_key=True), sa.Column("data", sa.JSON, nullable=False))


def downgrade():
    for name in ("trends", "notes", "attempts", "timeline", "logs", "alerts", "cases"):
        op.drop_table(name)
