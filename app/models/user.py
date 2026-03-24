"""User model."""
import enum
from sqlalchemy import Boolean, Column, Enum as SQLEnum, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class SystemRole(str, enum.Enum):
    """Global user role for system-wide authority."""

    ADMIN = "ADMIN"
    USER = "USER"


class User(Base):
    """Application user authenticated via email/password."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True)
    system_role = Column(SQLEnum(SystemRole), nullable=False, default=SystemRole.USER, server_default=SystemRole.USER.value)
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")

    memberships = relationship(
        "UserCompany",
        back_populates="user",
        cascade="all, delete-orphan",
    )
