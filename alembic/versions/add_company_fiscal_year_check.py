"""add company fiscal year check constraint

Revision ID: add_fiscal_check
Revises: add_equity_cat
Create Date: 2026-02-01

"""
from typing import Sequence, Union

from alembic import op


revision: str = "add_fiscal_check"
down_revision: Union[str, None] = "add_equity_cat"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE companies ADD CONSTRAINT check_fiscal_year_start_before_end "
        "CHECK (fiscal_year_start < fiscal_year_end)"
    )


def downgrade() -> None:
    op.drop_constraint("check_fiscal_year_start_before_end", "companies", type_="check")
