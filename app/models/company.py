"""Company model."""
import enum
from datetime import date
from sqlalchemy import Column, Integer, String, Date, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.db.base import Base


class LegalType(str, enum.Enum):
    """Company legal type enumeration."""
    LLC = "LLC"
    SOLE_PROPRIETORSHIP = "SOLE_PROPRIETORSHIP"


class Company(Base):
    """Company model."""
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    legal_type = Column(SQLEnum(LegalType), nullable=False)
    fiscal_year_start = Column(Date, nullable=False)
    fiscal_year_end = Column(Date, nullable=False)

    # Relationships
    financial_items = relationship("FinancialItem", back_populates="company", cascade="all, delete-orphan")
    zakat_calculations = relationship("ZakatCalculation", back_populates="company", cascade="all, delete-orphan")
