"""Add company_password_hash for company-level authentication

Revision ID: add_company_pwd
Revises: add_fiscal_check
Create Date: 2026-02-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "add_company_pwd"
down_revision: Union[str, None] = "add_fiscal_check"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "companies",
        sa.Column("company_password_hash", sa.String(), nullable=True),
    )
    # Backfill: set default password hash for existing companies (temporary; change on first use).
    import bcrypt
    _default_password = "ChangeMe123"
    default_hash = bcrypt.hashpw(_default_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    conn = op.get_bind()
    conn.execute(
        sa.text("UPDATE companies SET company_password_hash = :h WHERE company_password_hash IS NULL"),
        {"h": default_hash},
    )


def downgrade() -> None:
    op.drop_column("companies", "company_password_hash")
