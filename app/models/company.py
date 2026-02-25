"""Company model."""
import enum
from datetime import date
from sqlalchemy import Column, Integer, String, Date, Enum as SQLEnum, CheckConstraint
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
    company_password_hash = Column(String, nullable=True)  # bcrypt hash; required for company login

    # Relationships
    financial_items = relationship("FinancialItem", back_populates="company", cascade="all, delete-orphan")
    zakat_calculations = relationship("ZakatCalculation", back_populates="company", cascade="all, delete-orphan")

    # Business rule: fiscal year start must be before end
    __table_args__ = (
        CheckConstraint("fiscal_year_start < fiscal_year_end", name="check_fiscal_year_start_before_end"),
    )
