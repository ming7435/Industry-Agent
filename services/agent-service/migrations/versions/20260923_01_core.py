"""Create shared Agent Service persistence tables."""

from alembic import op


revision = "20260923_01_core"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS workorders (
            workorder_id VARCHAR(64) PRIMARY KEY,
            idempotency_key VARCHAR(255) UNIQUE,
            payload JSON NOT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS maintenance_experience (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            device_id VARCHAR(128) NOT NULL DEFAULT '',
            alarm_code VARCHAR(64) NOT NULL DEFAULT '',
            diagnosis TEXT,
            treatment TEXT,
            duration_seconds DOUBLE NOT NULL DEFAULT 0,
            payload JSON NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_experience_device (device_id),
            KEY idx_experience_alarm (alarm_code)
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS quality_checks (
            quality_check_id VARCHAR(64) PRIMARY KEY,
            target_type VARCHAR(64) NOT NULL,
            target_id VARCHAR(128) NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'open',
            payload JSON NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS quality_checks")
    op.execute("DROP TABLE IF EXISTS maintenance_experience")
    op.execute("DROP TABLE IF EXISTS workorders")
