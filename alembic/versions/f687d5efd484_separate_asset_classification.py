"""separate_asset_classification

Revision ID: f687d5efd484
Revises: 5a13e45f32c6
Create Date: 2026-01-26 21:20:39.003659

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'f687d5efd484'
down_revision: Union[str, None] = '5a13e45f32c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Asset type mapping dictionary for migration
ASSET_TYPE_MAPPING = {
    # Zakatable Assets
    "حسابات الغير المدينة": "RECEIVABLE",
    "ذمم العملاء": "RECEIVABLE",
    "حسابات العملاء": "RECEIVABLE",
    "مخزون": "INVENTORY",
    "مخزون بضائع": "INVENTORY",
    "مخزون تجاري": "INVENTORY",
    "الصندوق": "CASH",
    "رصيد الصندوق": "CASH",
    "الحساب البنكي": "CASH",
    "رصيد البنك": "CASH",
    # Non-Zakatable Assets
    "معدات": "FIXED_ASSET",
    "آلات": "FIXED_ASSET",
    "وسائل نقل": "FIXED_ASSET",
    "مباني": "FIXED_ASSET",
    "برمجيات": "INTANGIBLE_ASSET",
    "براءة اختراع": "INTANGIBLE_ASSET",
    "استثمارات طويلة الأجل": "LONG_TERM_INVESTMENT",
    "مساهمات طويلة الأجل": "LONG_TERM_INVESTMENT"
}

VALID_ENUM_VALUES = ['CASH', 'INVENTORY', 'RECEIVABLE', 'FIXED_ASSET', 'INTANGIBLE_ASSET', 'LONG_TERM_INVESTMENT']


def upgrade() -> None:
    """
    Separate asset classification into asset_type (ENUM) and accounting_label (string).
    
    Migration steps:
    1. Create assettype ENUM (if not exists)
    2. Add asset_type and accounting_label columns (nullable initially)
    3. Migrate data from asset_code to both fields
    4. Make asset_type NOT NULL for ASSET category
    5. Update CHECK constraint
    6. Drop asset_code column
    """
    
    # Step 1: Create assettype ENUM type (if not exists)
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
    
    # Step 2: Add new columns (both nullable initially)
    asset_type_enum_col = postgresql.ENUM('CASH', 'INVENTORY', 'RECEIVABLE', 'FIXED_ASSET', 
                                          'INTANGIBLE_ASSET', 'LONG_TERM_INVESTMENT', 
                                          name='assettype', create_type=False)
    op.add_column('financial_items', sa.Column('asset_type', asset_type_enum_col, nullable=True))
    op.add_column('financial_items', sa.Column('accounting_label', sa.String(), nullable=True))
    
    # Step 3: Migrate existing data
    # Use connection to execute migration with proper parameter handling
    connection = op.get_bind()
    
    # Get all ASSET rows
    result = connection.execute(sa.text("""
        SELECT id, asset_code 
        FROM financial_items 
        WHERE category = 'ASSET' AND asset_code IS NOT NULL
    """))
    
    for row in result:
        item_id = row[0]
        original_code = row[1]
        
        # Determine asset_type and accounting_label
        if original_code in VALID_ENUM_VALUES:
            # Direct enum value
            asset_type = original_code
            accounting_label = None
        elif original_code in ASSET_TYPE_MAPPING:
            # Mapped Arabic label
            asset_type = ASSET_TYPE_MAPPING[original_code]
            accounting_label = original_code
        else:
            # Unknown value - default to CASH, preserve original
            asset_type = 'CASH'
            accounting_label = original_code
        
        # Update the row
        # Use string formatting for enum cast since asset_type is validated from our mapping
        connection.execute(sa.text(f"""
            UPDATE financial_items
            SET asset_type = '{asset_type}'::assettype,
                accounting_label = :accounting_label
            WHERE id = :id
        """), {
            'accounting_label': accounting_label,
            'id': item_id
        })
    
    # Commit is handled by Alembic transaction management
    
    # Step 4: Keep asset_type nullable at column level
    # The CHECK constraint will enforce: ASSET must have asset_type NOT NULL, LIABILITY must have asset_type NULL
    # We don't make the column NOT NULL because LIABILITY items require NULL values
    # The CHECK constraint (created in Step 5) will enforce the business rules
    
    # Step 5: Update CHECK constraint
    op.drop_constraint('check_category_code_consistency', 'financial_items', type_='check')
    op.create_check_constraint(
        'check_category_code_consistency',
        'financial_items',
        "(category = 'ASSET' AND asset_type IS NOT NULL AND liability_code IS NULL) OR "
        "(category = 'LIABILITY' AND liability_code IS NOT NULL AND asset_type IS NULL)"
    )
    
    # Step 6: Drop old asset_code column
    op.drop_column('financial_items', 'asset_code')


def downgrade() -> None:
    """
    Rollback: Recreate asset_code column and restore original structure.
    """
    # Recreate asset_code column
    op.add_column('financial_items', sa.Column('asset_code', sa.String(), nullable=True))
    
    # Migrate data back: use asset_type enum value for asset_code
    op.execute("""
        UPDATE financial_items
        SET asset_code = asset_type::text
        WHERE category = 'ASSET' AND asset_type IS NOT NULL;
    """)
    
    # Restore original CHECK constraint
    op.drop_constraint('check_category_code_consistency', 'financial_items', type_='check')
    op.create_check_constraint(
        'check_category_code_consistency',
        'financial_items',
        "(category = 'ASSET' AND asset_code IS NOT NULL AND liability_code IS NULL) OR "
        "(category = 'LIABILITY' AND liability_code IS NOT NULL AND asset_code IS NULL)"
    )
    
    # Make asset_code NOT NULL for ASSET category
    op.alter_column('financial_items', 'asset_code', nullable=False)
    
    # Drop new columns
    op.drop_column('financial_items', 'accounting_label')
    op.drop_column('financial_items', 'asset_type')
    
    # Note: We don't drop the assettype ENUM type as it might be used elsewhere
    # If needed, it can be dropped manually: DROP TYPE IF EXISTS assettype;
