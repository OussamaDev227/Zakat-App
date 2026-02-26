"""Zakat item result model."""
from sqlalchemy import Column, Integer, Boolean, Numeric, Text, String, ForeignKey  # noqa: F401 Boolean used
from sqlalchemy.orm import relationship

from app.db.base import Base


class ZakatItemResult(Base):
    """Zakat calculation result per financial item."""
    __tablename__ = "zakat_item_results"

    id = Column(Integer, primary_key=True, index=True)
    calculation_id = Column(Integer, ForeignKey("zakat_calculations.id", ondelete="CASCADE"), nullable=False, index=True)
    financial_item_id = Column(Integer, ForeignKey("financial_items.id", ondelete="CASCADE"), nullable=False, index=True)
    included = Column(Boolean, nullable=False)
    included_amount = Column(Numeric(18, 2), nullable=False)
    explanation_ar = Column(Text, nullable=False)  # Arabic justification from rules
    rule_code = Column(String, nullable=False)  # Code of the rule applied
    hawl_passed = Column(Boolean, nullable=True)  # True if 1 lunar year passed since acquisition_date

    # Relationships
    calculation = relationship("ZakatCalculation", back_populates="item_results")
    financial_item = relationship("FinancialItem", back_populates="zakat_item_results")
