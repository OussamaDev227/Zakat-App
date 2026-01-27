"""fix_asset_type_nullable

Revision ID: fix_asset_type_null
Revises: f687d5efd484
Create Date: 2026-01-26 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'fix_asset_type_null'
down_revision: Union[str, None] = 'f687d5efd484'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Fix asset_type column to be nullable.
    
    The previous migration incorrectly made asset_type NOT NULL for all rows,
    but LIABILITY items require asset_type to be NULL per the CHECK constraint.
    This migration makes asset_type nullable at the column level, allowing
    the CHECK constraint to properly enforce the business rules.
    """
    asset_type_enum_col = postgresql.ENUM('CASH', 'INVENTORY', 'RECEIVABLE', 'FIXED_ASSET', 
                                          'INTANGIBLE_ASSET', 'LONG_TERM_INVESTMENT', 
                                          name='assettype', create_type=False)
    
    # Make asset_type nullable - this allows LIABILITY items to have NULL asset_type
    # The CHECK constraint will still enforce: ASSET must have asset_type NOT NULL
    op.alter_column('financial_items', 'asset_type', 
                    type_=asset_type_enum_col,
                    nullable=True,
                    postgresql_using='asset_type::assettype')


def downgrade() -> None:
    """
    Rollback: Make asset_type NOT NULL again (but this will break LIABILITY items).
    """
    asset_type_enum_col = postgresql.ENUM('CASH', 'INVENTORY', 'RECEIVABLE', 'FIXED_ASSET', 
                                          'INTANGIBLE_ASSET', 'LONG_TERM_INVESTMENT', 
                                          name='assettype', create_type=False)
    
    # First, set asset_type to a default value for LIABILITY items (this will violate CHECK constraint)
    # Then make column NOT NULL
    op.execute("""
        UPDATE financial_items
        SET asset_type = 'CASH'::assettype
        WHERE category = 'LIABILITY' AND asset_type IS NULL;
    """)
    
    op.alter_column('financial_items', 'asset_type', 
                    type_=asset_type_enum_col,
                    nullable=False,
                    postgresql_using='asset_type::assettype')
