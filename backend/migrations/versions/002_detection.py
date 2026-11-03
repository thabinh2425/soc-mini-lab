"""Persist evidence relationships and detection run history."""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("alert_evidence",
        sa.Column("alert_id", sa.String, sa.ForeignKey("alerts.id"), primary_key=True),
        sa.Column("log_id", sa.String, sa.ForeignKey("logs.id"), primary_key=True))
    op.create_table("detection_runs", sa.Column("id", sa.String, primary_key=True),
        sa.Column("data", sa.JSON, nullable=False))


def downgrade():
    op.drop_table("detection_runs")
    op.drop_table("alert_evidence")
