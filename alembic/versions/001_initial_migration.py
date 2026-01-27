"""Initial migration

Revision ID: 001_initial
Revises: 
Create Date: 2026-01-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enums only if they don't exist (using DO block for PostgreSQL)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE userrole AS ENUM ('ACCOUNTANT', 'OWNER', 'ADMIN');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE legaltype AS ENUM ('LLC', 'SOLE_PROPRIETORSHIP');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE itemcategory AS ENUM ('ASSET', 'LIABILITY');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # Create enum objects for table columns (create_type=False since we created them above)
    user_role_enum_col = postgresql.ENUM('ACCOUNTANT', 'OWNER', 'ADMIN', name='userrole', create_type=False)
    legal_type_enum_col = postgresql.ENUM('LLC', 'SOLE_PROPRIETORSHIP', name='legaltype', create_type=False)
    item_category_enum_col = postgresql.ENUM('ASSET', 'LIABILITY', name='itemcategory', create_type=False)
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('role', user_role_enum_col, nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    
    # Create companies table
    op.create_table(
        'companies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('legal_type', legal_type_enum_col, nullable=False),
        sa.Column('fiscal_year_start', sa.Date(), nullable=False),
        sa.Column('fiscal_year_end', sa.Date(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_companies_id'), 'companies', ['id'], unique=False)
    
    # Create financial_items table
    op.create_table(
        'financial_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('category', item_category_enum_col, nullable=False),
        sa.Column('asset_code', sa.String(), nullable=True),
        sa.Column('liability_code', sa.String(), nullable=True),
        sa.Column('amount', sa.Numeric(18, 2), nullable=False),
        sa.Column('item_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint(
            "(category = 'ASSET' AND asset_code IS NOT NULL AND liability_code IS NULL) OR "
            "(category = 'LIABILITY' AND liability_code IS NOT NULL AND asset_code IS NULL)",
            name='check_category_code_consistency'
        )
    )
    op.create_index(op.f('ix_financial_items_id'), 'financial_items', ['id'], unique=False)
    op.create_index(op.f('ix_financial_items_company_id'), 'financial_items', ['company_id'], unique=False)
    
    # Create zakat_calculations table
    op.create_table(
        'zakat_calculations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('zakat_base', sa.Numeric(18, 2), nullable=False),
        sa.Column('zakat_amount', sa.Numeric(18, 2), nullable=False),
        sa.Column('calculation_date', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_zakat_calculations_id'), 'zakat_calculations', ['id'], unique=False)
    op.create_index(op.f('ix_zakat_calculations_company_id'), 'zakat_calculations', ['company_id'], unique=False)
    
    # Create zakat_item_results table
    op.create_table(
        'zakat_item_results',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('calculation_id', sa.Integer(), nullable=False),
        sa.Column('financial_item_id', sa.Integer(), nullable=False),
        sa.Column('included', sa.Boolean(), nullable=False),
        sa.Column('included_amount', sa.Numeric(18, 2), nullable=False),
        sa.Column('explanation_ar', sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(['calculation_id'], ['zakat_calculations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['financial_item_id'], ['financial_items.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_zakat_item_results_id'), 'zakat_item_results', ['id'], unique=False)
    op.create_index(op.f('ix_zakat_item_results_calculation_id'), 'zakat_item_results', ['calculation_id'], unique=False)
    op.create_index(op.f('ix_zakat_item_results_financial_item_id'), 'zakat_item_results', ['financial_item_id'], unique=False)


def downgrade() -> None:
    # Drop tables
    op.drop_index(op.f('ix_zakat_item_results_financial_item_id'), table_name='zakat_item_results')
    op.drop_index(op.f('ix_zakat_item_results_calculation_id'), table_name='zakat_item_results')
    op.drop_index(op.f('ix_zakat_item_results_id'), table_name='zakat_item_results')
    op.drop_table('zakat_item_results')
    
    op.drop_index(op.f('ix_zakat_calculations_company_id'), table_name='zakat_calculations')
    op.drop_index(op.f('ix_zakat_calculations_id'), table_name='zakat_calculations')
    op.drop_table('zakat_calculations')
    
    op.drop_index(op.f('ix_financial_items_company_id'), table_name='financial_items')
    op.drop_index(op.f('ix_financial_items_id'), table_name='financial_items')
    op.drop_table('financial_items')
    
    op.drop_index(op.f('ix_companies_id'), table_name='companies')
    op.drop_table('companies')
    
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')
    
    # Drop enums
    op.execute("DROP TYPE IF EXISTS itemcategory")
    op.execute("DROP TYPE IF EXISTS legaltype")
    op.execute("DROP TYPE IF EXISTS userrole")
