"""Dashboard endpoints for role-based views."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_active_company_id, require_company_roles, require_system_admin
from app.db.session import get_db
from app.models.user import User
from app.models.user_company import CompanyRole
from app.schemas.dashboard import AdminDashboardResponse, OwnerDashboardResponse
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("/admin", response_model=AdminDashboardResponse)
async def get_admin_dashboard(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_system_admin),
):
    """Return platform-wide dashboard metrics for admins."""
    service = DashboardService(db)
    return service.get_admin_dashboard()


@router.get("/company", response_model=OwnerDashboardResponse)
async def get_owner_dashboard(
    db: Session = Depends(get_db),
    _membership=Depends(require_company_roles(CompanyRole.OWNER)),
    company_id: int = Depends(get_active_company_id),
):
    """Return company dashboard metrics for owner role in selected company."""
    service = DashboardService(db)
    try:
        return service.get_owner_dashboard(company_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
