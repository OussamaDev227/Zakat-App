"""User model."""
import enum
from sqlalchemy import Column, Integer, String, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.db.base import Base


class UserRole(str, enum.Enum):
    """User role enumeration."""
    ACCOUNTANT = "ACCOUNTANT"
    OWNER = "OWNER"
    ADMIN = "ADMIN"


class User(Base):
    """User model for future authentication."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.ACCOUNTANT)
