"""Add system_role and remove ADMIN from company role enum.

Revision ID: add_system_role_companyrole_v2
Revises: add_user_companies_rbac
Create Date: 2026-03-24
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "add_system_role_companyrole_v2"
down_revision: Union[str, None] = "add_user_companies_rbac"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        DO $$ BEGIN
            CREATE TYPE systemrole AS ENUM ('ADMIN', 'USER');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        """
    )

    op.add_column(
        "users",
        sa.Column("system_role", sa.Enum("ADMIN", "USER", name="systemrole"), nullable=False, server_default="USER"),
    )

    # If old data used ADMIN as company role, remap it before narrowing enum values.
    op.execute("UPDATE user_companies SET role = 'ACCOUNTANT' WHERE role::text = 'ADMIN'")

    op.execute(
        """
        DO $$ BEGIN
            CREATE TYPE companyrole_new AS ENUM ('ACCOUNTANT', 'OWNER', 'SHARIA_AUDITOR');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        """
    )
    op.execute(
        "ALTER TABLE user_companies ALTER COLUMN role TYPE companyrole_new USING role::text::companyrole_new"
    )
    op.execute("DROP TYPE companyrole")
    op.execute("ALTER TYPE companyrole_new RENAME TO companyrole")


def downgrade() -> None:
    op.execute(
        """
        DO $$ BEGIN
            CREATE TYPE companyrole_old AS ENUM ('ADMIN', 'ACCOUNTANT', 'OWNER', 'SHARIA_AUDITOR');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        """
    )
    op.execute(
        "ALTER TABLE user_companies ALTER COLUMN role TYPE companyrole_old USING role::text::companyrole_old"
    )
    op.execute("DROP TYPE companyrole")
    op.execute("ALTER TYPE companyrole_old RENAME TO companyrole")

    op.drop_column("users", "system_role")
    op.execute("DROP TYPE IF EXISTS systemrole")
