"""User-company membership model and role enum."""
import enum

from sqlalchemy import Column, Enum as SQLEnum, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.base import Base


class CompanyRole(str, enum.Enum):
    """Role of a user inside a specific company."""

    ACCOUNTANT = "ACCOUNTANT"
    OWNER = "OWNER"
    SHARIA_AUDITOR = "SHARIA_AUDITOR"


class UserCompany(Base):
    """Many-to-many association with per-company role."""

    __tablename__ = "user_companies"
    __table_args__ = (
        UniqueConstraint("user_id", "company_id", name="uq_user_companies_user_company"),
    )

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), primary_key=True)
    role = Column(SQLEnum(CompanyRole), nullable=False)

    user = relationship("User", back_populates="memberships")
    company = relationship("Company", back_populates="memberships")
