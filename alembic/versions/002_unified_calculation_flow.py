"""Unified calculation flow migration

Revision ID: 002_unified_calculation_flow
Revises: 001_initial
Create Date: 2026-01-25

"""
from typing import Sequence, Union
from datetime import datetime

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002_unified_calculation_flow'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create calculationstatus enum type
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE calculationstatus AS ENUM ('DRAFT', 'FINALIZED');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Create enum object for table column (create_type=False since we created it above)
    calculation_status_enum_col = postgresql.ENUM('DRAFT', 'FINALIZED', name='calculationstatus', create_type=False)
    
    # Alter zakat_calculations table: add status, created_at, updated_at
    op.add_column('zakat_calculations', sa.Column('status', calculation_status_enum_col, nullable=False, server_default='DRAFT'))
    op.add_column('zakat_calculations', sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')))
    op.add_column('zakat_calculations', sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')))
    
    # Make calculation_date nullable (it will be set on finalize)
    op.alter_column('zakat_calculations', 'calculation_date', nullable=True)
    
    # Update existing records: set status = FINALIZED, created_at = calculation_date
    op.execute("""
        UPDATE zakat_calculations
        SET status = 'FINALIZED',
            created_at = COALESCE(calculation_date, CURRENT_TIMESTAMP),
            updated_at = COALESCE(calculation_date, CURRENT_TIMESTAMP)
        WHERE calculation_date IS NOT NULL;
    """)
    
    # For records without calculation_date, set created_at and updated_at to now
    op.execute("""
        UPDATE zakat_calculations
        SET created_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE created_at IS NULL;
    """)
    
    # Alter financial_items table: add calculation_id
    op.add_column('financial_items', sa.Column('calculation_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_financial_items_calculation_id',
        'financial_items',
        'zakat_calculations',
        ['calculation_id'],
        ['id'],
        ondelete='CASCADE'
    )
    op.create_index(op.f('ix_financial_items_calculation_id'), 'financial_items', ['calculation_id'], unique=False)
    
    # Alter zakat_item_results table: add rule_code
    op.add_column('zakat_item_results', sa.Column('rule_code', sa.String(), nullable=True))
    
    # Backfill rule_code for existing records based on financial_item codes
    op.execute("""
        UPDATE zakat_item_results zir
        SET rule_code = COALESCE(
            fi.asset_code,
            fi.liability_code,
            'UNKNOWN'
        )
        FROM financial_items fi
        WHERE zir.financial_item_id = fi.id
        AND zir.rule_code IS NULL;
    """)
    
    # Make rule_code NOT NULL after backfill
    op.alter_column('zakat_item_results', 'rule_code', nullable=False)


def downgrade() -> None:
    # Remove rule_code from zakat_item_results
    op.drop_column('zakat_item_results', 'rule_code')
    
    # Remove calculation_id from financial_items
    op.drop_index(op.f('ix_financial_items_calculation_id'), table_name='financial_items')
    op.drop_constraint('fk_financial_items_calculation_id', 'financial_items', type_='foreignkey')
    op.drop_column('financial_items', 'calculation_id')
    
    # Remove status, created_at, updated_at from zakat_calculations
    op.alter_column('zakat_calculations', 'calculation_date', nullable=False)
    op.drop_column('zakat_calculations', 'updated_at')
    op.drop_column('zakat_calculations', 'created_at')
    op.drop_column('zakat_calculations', 'status')
    
    # Drop calculationstatus enum type
    op.execute("DROP TYPE IF EXISTS calculationstatus;")
