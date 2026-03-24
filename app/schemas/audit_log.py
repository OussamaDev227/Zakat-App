"""Audit log schemas."""
from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.models.audit_log import AuditAction, AuditEntityType


class AuditLogEntryResponse(BaseModel):
    """Single audit log entry response."""

    id: int
    company_id: int
    actor_user_id: int | None
    actor_system_role: str | None
    actor_company_role: str | None
    entity_type: AuditEntityType
    entity_id: int | None
    action: AuditAction
    field_changes: dict[str, Any]
    summary: str
    created_at: datetime


class AuditLogListResponse(BaseModel):
    """Audit log list response."""

    items: list[AuditLogEntryResponse]
