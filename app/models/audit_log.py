"""Audit log model."""
import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum as SQLEnum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base import Base


class AuditEntityType(str, enum.Enum):
    """Supported entity types for audit tracking."""

    FINANCIAL_ITEM = "FINANCIAL_ITEM"
    ZAKAT_CALCULATION = "ZAKAT_CALCULATION"
    COMPANY = "COMPANY"


class AuditAction(str, enum.Enum):
    """Supported action types for audit tracking."""

    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    START = "START"
    RECALCULATE = "RECALCULATE"
    FINALIZE = "FINALIZE"
    CREATE_REVISION = "CREATE_REVISION"
    UPDATE_LANGUAGE = "UPDATE_LANGUAGE"


class AuditLog(Base):
    """Immutable audit trail entry."""

    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    actor_system_role = Column(String(32), nullable=True)
    actor_company_role = Column(String(32), nullable=True)
    entity_type = Column(SQLEnum(AuditEntityType), nullable=False)
    entity_id = Column(Integer, nullable=True, index=True)
    action = Column(SQLEnum(AuditAction), nullable=False)
    field_changes = Column(JSONB, nullable=False, default=dict)
    summary = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
