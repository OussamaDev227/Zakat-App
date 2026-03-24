"""Add user companies RBAC tables/columns.

Revision ID: add_user_companies_rbac
Revises: add_company_lang
Create Date: 2026-03-24
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "add_user_companies_rbac"
down_revision: Union[str, None] = "add_company_lang"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum only if it does not exist.
    op.execute(
        """
        DO $$ BEGIN
            CREATE TYPE companyrole AS ENUM ('ADMIN', 'ACCOUNTANT', 'OWNER', 'SHARIA_AUDITOR');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        """
    )

    op.add_column("users", sa.Column("password_hash", sa.String(), nullable=True))
    op.add_column(
        "users",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )

    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("role")

    company_role_enum = postgresql.ENUM(
        "ADMIN",
        "ACCOUNTANT",
        "OWNER",
        "SHARIA_AUDITOR",
        name="companyrole",
        create_type=False,
    )

    op.create_table(
        "user_companies",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("role", company_role_enum, nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "company_id"),
        sa.UniqueConstraint("user_id", "company_id", name="uq_user_companies_user_company"),
    )
    op.create_index("ix_user_companies_company_id", "user_companies", ["company_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_user_companies_company_id", table_name="user_companies")
    op.drop_table("user_companies")

    op.add_column(
        "users",
        sa.Column(
            "role",
            postgresql.ENUM("ACCOUNTANT", "OWNER", "ADMIN", name="userrole"),
            nullable=False,
            server_default="ACCOUNTANT",
        ),
    )
    op.drop_column("users", "is_active")
    op.drop_column("users", "password_hash")

    op.execute("DROP TYPE IF EXISTS companyrole")
