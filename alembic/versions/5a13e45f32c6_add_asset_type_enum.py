"""add_asset_type_enum

Revision ID: 5a13e45f32c6
Revises: 002_unified_calculation_flow
Create Date: 2026-01-26 20:45:05.150116

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '5a13e45f32c6'
down_revision: Union[str, None] = '002_unified_calculation_flow'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Create AssetType ENUM for strict zakat jurisprudence asset classification.
    
    Note: asset_code column remains String type for backward compatibility,
    but is strictly validated against this ENUM at the application level.
    Asset classification is a jurisprudential constraint, not a user preference.
    """
    # Create assettype enum type
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE assettype AS ENUM (
                'CASH',
                'INVENTORY',
                'RECEIVABLE',
                'FIXED_ASSET',
                'INTANGIBLE_ASSET',
                'LONG_TERM_INVESTMENT'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Add CHECK constraint to validate asset_code against ENUM values
    # This provides database-level enforcement while keeping String type
    op.execute("""
        ALTER TABLE financial_items
        ADD CONSTRAINT check_asset_code_valid
        CHECK (
            asset_code IS NULL OR
            asset_code IN ('CASH', 'INVENTORY', 'RECEIVABLE', 'FIXED_ASSET', 'INTANGIBLE_ASSET', 'LONG_TERM_INVESTMENT')
        );
    """)


def downgrade() -> None:
    # Remove CHECK constraint
    op.drop_constraint('check_asset_code_valid', 'financial_items', type_='check')
    
    # Drop assettype enum type
    op.execute("DROP TYPE IF EXISTS assettype;")
