"""Audit log read endpoints."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import get_active_company_id, get_current_user, require_company_roles
from app.db.session import get_db
from app.models.audit_log import AuditAction, AuditEntityType
from app.models.user import User
from app.models.user_company import CompanyRole, UserCompany
from app.schemas.audit_log import AuditLogEntryResponse, AuditLogListResponse
from app.services.audit_log_service import AuditLogService

router = APIRouter()


@router.get("/company", response_model=AuditLogListResponse)
async def list_company_audit_logs(
    entity_type: AuditEntityType | None = Query(None),
    action: AuditAction | None = Query(None),
    limit: int = Query(100, ge=1, le=300),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
    _membership: UserCompany = Depends(require_company_roles(CompanyRole.OWNER)),
    company_id: int = Depends(get_active_company_id),
):
    """List audit logs for current company (OWNER and ADMIN)."""
    service = AuditLogService(db)
    items = service.list_company_logs(
        company_id,
        entity_type=entity_type,
        action=action,
        limit=limit,
    )
    return AuditLogListResponse(
        items=[
            AuditLogEntryResponse(
                id=item.id,
                company_id=item.company_id,
                actor_user_id=item.actor_user_id,
                actor_system_role=item.actor_system_role,
                actor_company_role=item.actor_company_role,
                entity_type=item.entity_type,
                entity_id=item.entity_id,
                action=item.action,
                field_changes=item.field_changes or {},
                summary=item.summary,
                created_at=item.created_at,
            )
            for item in items
        ]
    )
