"""Split INVENTORY into TRADING_GOODS and PRODUCTION_INVENTORY

Revision ID: split_inv_tg_pi
Revises: add_company_pwd
Create Date: 2026-02-26

Domain correction per Zakat accounting standards and doctoral framework:
- Trading goods (merchandise) and production inventory are distinct.
- Existing INVENTORY records are migrated to TRADING_GOODS (conservative default).
- INVENTORY remains in the PostgreSQL enum for legacy compatibility but is no longer used by the application.
"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy import text, create_engine

from app.core.config import settings


revision: str = "split_inv_tg_pi"
down_revision: Union[str, None] = "add_company_pwd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add new enum values in autocommit (PostgreSQL: ADD VALUE cannot run inside a transaction block)
    engine = create_engine(settings.database_url, isolation_level="AUTOCOMMIT")
    with engine.connect() as ac_conn:
        ac_conn.execute(text("ALTER TYPE assettype ADD VALUE IF NOT EXISTS 'TRADING_GOODS'"))
        ac_conn.execute(text("ALTER TYPE assettype ADD VALUE IF NOT EXISTS 'PRODUCTION_INVENTORY'"))
    engine.dispose()

    # 2. Migrate existing INVENTORY rows to TRADING_GOODS (conservative default; allow manual correction later)
    connection = op.get_bind()
    connection.execute(text("""
        UPDATE financial_items
        SET asset_type = 'TRADING_GOODS'::assettype
        WHERE category = 'ASSET' AND asset_type::text = 'INVENTORY'
    """))


def downgrade() -> None:
    # Migrate TRADING_GOODS and PRODUCTION_INVENTORY back to INVENTORY (lossy: we cannot distinguish which was which)
    connection = op.get_bind()
    connection.execute(text("""
        UPDATE financial_items
        SET asset_type = 'INVENTORY'::assettype
        WHERE category = 'ASSET' AND asset_type::text IN ('TRADING_GOODS', 'PRODUCTION_INVENTORY')
    """))
    # Note: PostgreSQL does not support removing enum values. TRADING_GOODS and PRODUCTION_INVENTORY
    # remain in the assettype enum after downgrade.
