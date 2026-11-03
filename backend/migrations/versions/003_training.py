"""Resumable training sessions; preserve historical attempts."""
from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("training_sessions",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column("case_id", sa.String, sa.ForeignKey("cases.id"), nullable=False),
        sa.Column("data", sa.JSON, nullable=False))
    op.create_index("ix_training_sessions_case_id", "training_sessions", ["case_id"])


def downgrade():
    op.drop_table("training_sessions")
