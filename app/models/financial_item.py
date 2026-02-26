"""Financial item model."""
import enum
from sqlalchemy import Column, Integer, String, Numeric, Date, Enum as SQLEnum, ForeignKey, CheckConstraint  # pyright: ignore[reportMissingImports]
from sqlalchemy.dialects.postgresql import JSONB  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import relationship  # pyright: ignore[reportMissingImports]

from app.db.base import Base


class ItemCategory(str, enum.Enum):
    """Financial item category enumeration."""
    ASSET = "ASSET"
    LIABILITY = "LIABILITY"
    EQUITY = "EQUITY"


class AssetType(str, enum.Enum):
    """
    Asset type enumeration - strict zakat jurisprudence classification.
    
    These are FINAL and must not be editable by users.
    Asset classification is a jurisprudential constraint, not a user preference.
    
    Inventories and trading goods are distinct per Zakat accounting standards:
    - TRADING_GOODS: goods held for resale (merchandise) → zakatable.
    - PRODUCTION_INVENTORY: raw materials, WIP, manufacturing stock → classified per framework.
    """
    CASH = "CASH"  # النقدية وما في حكمها
    TRADING_GOODS = "TRADING_GOODS"  # عروض التجارة / البضاعة المعدة للبيع
    PRODUCTION_INVENTORY = "PRODUCTION_INVENTORY"  # مخزون إنتاجي (مواد أولية، تحت التصنيع)
    RECEIVABLE = "RECEIVABLE"  # الذمم المدينة
    FIXED_ASSET = "FIXED_ASSET"  # الأصول الثابتة العينية
    INTANGIBLE_ASSET = "INTANGIBLE_ASSET"  # الأصول المعنوية
    LONG_TERM_INVESTMENT = "LONG_TERM_INVESTMENT"  # الاستثمارات طويلة الأجل


class FinancialItem(Base):
    """Financial item model."""
    __tablename__ = "financial_items"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)  # Unicode/Arabic supported
    category = Column(SQLEnum(ItemCategory), nullable=False)
    asset_type = Column(SQLEnum(AssetType), nullable=True)  # Zakat jurisprudence classification (required for ASSET)
    accounting_label = Column(String, nullable=True)  # Optional accounting description
    liability_code = Column(String, nullable=True)  # From rules JSON
    equity_code = Column(String, nullable=True)  # From rules JSON (required for EQUITY)
    amount = Column(Numeric(18, 2), nullable=False)
    acquisition_date = Column(Date, nullable=True)  # تاريخ التملك — for Hawl (1 lunar year)
    item_metadata = Column(JSONB, nullable=False, default=dict)  # JSONB in Postgres: intent, trade_percentage, collectibility

    calculation_id = Column(Integer, ForeignKey("zakat_calculations.id", ondelete="CASCADE"), nullable=True, index=True)

    # Relationships
    company = relationship("Company", back_populates="financial_items")
    calculation = relationship("ZakatCalculation", back_populates="financial_items")
    zakat_item_results = relationship("ZakatItemResult", back_populates="financial_item", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "(category = 'ASSET' AND asset_type IS NOT NULL AND liability_code IS NULL AND equity_code IS NULL) OR "
            "(category = 'LIABILITY' AND liability_code IS NOT NULL AND asset_type IS NULL AND equity_code IS NULL) OR "
            "(category = 'EQUITY' AND equity_code IS NOT NULL AND asset_type IS NULL AND liability_code IS NULL)",
            name="check_category_code_consistency"
        ),
    )
