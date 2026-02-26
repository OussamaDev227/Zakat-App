"""Add Nisab and Hawl (acquisition_date, hawl_passed)

Revision ID: add_nisab_hawl
Revises: split_inv_tg_pi
Create Date: 2026-02-26

- companies.zakat_nisab_value: minimum Zakat threshold (company currency)
- financial_items.acquisition_date: ownership date for Hawl (1 lunar year)
- zakat_item_results.hawl_passed: whether item passed Hawl for this calculation
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "add_nisab_hawl"
down_revision: Union[str, None] = "split_inv_tg_pi"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# One lunar year in days (approximate)
HAWL_DAYS = 354


def upgrade() -> None:
    # Company: Nisab value (same currency as company)
    op.add_column(
        "companies",
        sa.Column("zakat_nisab_value", sa.Numeric(18, 2), nullable=True),
    )

    # Financial item: acquisition/ownership date for Hawl
    op.add_column(
        "financial_items",
        sa.Column("acquisition_date", sa.Date(), nullable=True),
    )
    # Backfill: set acquisition_date to today so existing items are treated as hawl passed
    conn = op.get_bind()
    conn.execute(
        sa.text("""
            UPDATE financial_items
            SET acquisition_date = CURRENT_DATE
            WHERE acquisition_date IS NULL
        """)
    )

    # Zakat item result: persist hawl_passed for display and report
    op.add_column(
        "zakat_item_results",
        sa.Column("hawl_passed", sa.Boolean(), nullable=True),
    )
    # Backfill: assume existing results passed hawl
    conn.execute(
        sa.text("UPDATE zakat_item_results SET hawl_passed = true WHERE hawl_passed IS NULL")
    )


def downgrade() -> None:
    op.drop_column("zakat_item_results", "hawl_passed")
    op.drop_column("financial_items", "acquisition_date")
    op.drop_column("companies", "zakat_nisab_value")
