"""Zakat calculation model."""
import enum
from datetime import datetime
from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.db.base import Base


class CalculationStatus(str, enum.Enum):
    """Calculation status enumeration."""
    DRAFT = "DRAFT"
    FINALIZED = "FINALIZED"


class ZakatCalculation(Base):
    """Zakat calculation result model."""
    __tablename__ = "zakat_calculations"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    zakat_base = Column(Numeric(18, 2), nullable=False)
    zakat_amount = Column(Numeric(18, 2), nullable=False)
    status = Column(SQLEnum(CalculationStatus), nullable=False, default=CalculationStatus.DRAFT)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    calculation_date = Column(DateTime, nullable=True)  # Set when finalized

    # Relationships
    company = relationship("Company", back_populates="zakat_calculations")
    item_results = relationship("ZakatItemResult", back_populates="calculation", cascade="all, delete-orphan")
    financial_items = relationship("FinancialItem", back_populates="calculation")
