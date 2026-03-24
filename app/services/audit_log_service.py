"""Audit logging service."""
from decimal import Decimal
from enum import Enum
from typing import Any

from sqlalchemy.orm import Session

from app.models.audit_log import AuditAction, AuditEntityType, AuditLog
from app.models.user import User


class AuditLogService:
    """Create and query audit entries."""

    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _normalize(value: Any) -> Any:
        if isinstance(value, Decimal):
            return float(value)
        if isinstance(value, Enum):
            return value.value
        if hasattr(value, "isoformat"):
            try:
                return value.isoformat()
            except Exception:
                return str(value)
        if isinstance(value, dict):
            return {k: AuditLogService._normalize(v) for k, v in value.items()}
        if isinstance(value, list):
            return [AuditLogService._normalize(v) for v in value]
        return value

    @staticmethod
    def diff(before: dict[str, Any], after: dict[str, Any], fields: list[str]) -> dict[str, Any]:
        """Build before/after snapshot for changed fields only."""
        changes: dict[str, Any] = {}
        for field in fields:
            b = AuditLogService._normalize(before.get(field))
            a = AuditLogService._normalize(after.get(field))
            if b != a:
                changes[field] = {"before": b, "after": a}
        return changes

    def log(
        self,
        *,
        company_id: int,
        actor_user: User | None,
        actor_company_role: str | None,
        entity_type: AuditEntityType,
        entity_id: int | None,
        action: AuditAction,
        summary: str,
        field_changes: dict[str, Any] | None = None,
    ) -> AuditLog:
        entry = AuditLog(
            company_id=company_id,
            actor_user_id=actor_user.id if actor_user else None,
            actor_system_role=(
                getattr(actor_user.system_role, "value", str(actor_user.system_role))
                if actor_user
                else None
            ),
            actor_company_role=actor_company_role,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            summary=summary,
            field_changes=self._normalize(field_changes or {}),
        )
        self.db.add(entry)
        return entry

    def list_company_logs(
        self,
        company_id: int,
        *,
        entity_type: AuditEntityType | None = None,
        action: AuditAction | None = None,
        limit: int = 100,
    ) -> list[AuditLog]:
        query = self.db.query(AuditLog).filter(AuditLog.company_id == company_id)
        if entity_type is not None:
            query = query.filter(AuditLog.entity_type == entity_type)
        if action is not None:
            query = query.filter(AuditLog.action == action)
        return query.order_by(AuditLog.created_at.desc()).limit(limit).all()
