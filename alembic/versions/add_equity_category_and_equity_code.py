"""add equity category and equity_code

Revision ID: add_equity_cat
Revises: fix_asset_type_null
Create Date: 2026-01-26

Adds EQUITY to ItemCategory, equity_code column, and updates check constraint
so ASSET | LIABILITY | EQUITY are mutually exclusive with correct code requirements.

PostgreSQL requires new enum values to be committed before use. We run ADD VALUE
in a separate autocommit connection so the rest of the migration can use it.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import create_engine, text

from app.core.config import settings


revision: str = "add_equity_cat"
down_revision: Union[str, None] = "fix_asset_type_null"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ensure itemcategory enum exists first (defensive check for fresh databases)
    # Then add EQUITY value. Must run in autocommit so it is committed
    # before we use it in the CHECK constraint (PG: "New enum values must be
    # committed before they can be used").
    engine = create_engine(settings.database_url, isolation_level="AUTOCOMMIT")
    with engine.connect() as ac_conn:
        # Create enum if it doesn't exist (should already exist from 001_initial, but be safe)
        ac_conn.execute(text("""
            DO $$ BEGIN
                CREATE TYPE itemcategory AS ENUM ('ASSET', 'LIABILITY');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """))
        # Now add EQUITY value
        ac_conn.execute(text("ALTER TYPE itemcategory ADD VALUE IF NOT EXISTS 'EQUITY'"))
    engine.dispose()

    # Add equity_code column
    op.add_column("financial_items", sa.Column("equity_code", sa.String(), nullable=True))

    # Drop old check constraint
    op.drop_constraint("check_category_code_consistency", "financial_items", type_="check")

    # Create new three-way check: ASSET | LIABILITY | EQUITY
    op.create_check_constraint(
        "check_category_code_consistency",
        "financial_items",
        "(category = 'ASSET' AND asset_type IS NOT NULL AND liability_code IS NULL AND equity_code IS NULL) OR "
        "(category = 'LIABILITY' AND liability_code IS NOT NULL AND asset_type IS NULL AND equity_code IS NULL) OR "
        "(category = 'EQUITY' AND equity_code IS NOT NULL AND asset_type IS NULL AND liability_code IS NULL)",
    )


def downgrade() -> None:
    op.execute(text("DELETE FROM financial_items WHERE category = 'EQUITY'"))
    op.drop_constraint("check_category_code_consistency", "financial_items", type_="check")
    op.create_check_constraint(
        "check_category_code_consistency",
        "financial_items",
        "(category = 'ASSET' AND asset_type IS NOT NULL AND liability_code IS NULL) OR "
        "(category = 'LIABILITY' AND liability_code IS NOT NULL AND asset_type IS NULL)",
    )
    op.drop_column("financial_items", "equity_code")
    # Note: PostgreSQL does not support removing enum values. EQUITY remains in
    # itemcategory for simplicity.
