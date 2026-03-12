"""Add company.language for UI language preference (ar, fr, en)

Revision ID: add_company_lang
Revises: add_nisab_hawl
Create Date: 2026-03-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "add_company_lang"
down_revision: Union[str, None] = "add_nisab_hawl"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "companies",
        sa.Column("language", sa.String(10), nullable=False, server_default="ar"),
    )
    # Ensure existing rows have 'ar'
    conn = op.get_bind()
    conn.execute(sa.text("UPDATE companies SET language = 'ar' WHERE language IS NULL OR language = ''"))


def downgrade() -> None:
    op.drop_column("companies", "language")
