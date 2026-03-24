"""System-admin user management endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.security import hash_password, require_system_admin
from app.db.session import get_db
from app.models.user import User
from app.models.user_company import UserCompany
from app.schemas.user import (
    UserCreateRequest,
    UserListResponse,
    UserResponse,
    UserCompanyMembershipResponse,
    UserStatusUpdateRequest,
)
from app.services.user_management_service import UserManagementService

router = APIRouter()


def _to_user_response(user: User, include_memberships: bool = False) -> UserResponse:
    memberships = None
    if include_memberships:
        memberships = [
            UserCompanyMembershipResponse(company_id=m.company_id, role=m.role)
            for m in user.memberships
        ]
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        system_role=user.system_role,
        is_active=user.is_active,
        memberships=memberships,
    )


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    body: UserCreateRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_system_admin),
):
    """Create a new user (ADMIN only)."""
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists.")

    user = User(
        name=body.name.strip(),
        email=body.email,
        password_hash=hash_password(body.password),
        system_role=body.system_role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _to_user_response(user, include_memberships=True)


@router.get("", response_model=UserListResponse)
async def list_users(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_system_admin),
):
    """List all users with company memberships (ADMIN only)."""
    users = db.query(User).options(joinedload(User.memberships)).order_by(User.id.asc()).all()
    return UserListResponse(items=[_to_user_response(u, include_memberships=True) for u in users])


@router.patch("/{user_id}/deactivate", response_model=UserResponse)
async def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_system_admin),
):
    """Deactivate a user account (ADMIN only)."""
    service = UserManagementService(db)
    target = service.set_user_active_status(
        target_user_id=user_id,
        actor_admin_user_id=admin_user.id,
        is_active=False,
    )
    return _to_user_response(target, include_memberships=True)


@router.patch("/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_system_admin),
):
    """Activate a user account (ADMIN only)."""
    service = UserManagementService(db)
    target = service.set_user_active_status(
        target_user_id=user_id,
        actor_admin_user_id=_admin.id,
        is_active=True,
    )
    return _to_user_response(target, include_memberships=True)


@router.patch("/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    user_id: int,
    body: UserStatusUpdateRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_system_admin),
):
    """Update user status (activate/deactivate) via one lifecycle endpoint."""
    service = UserManagementService(db)
    target = service.set_user_active_status(
        target_user_id=user_id,
        actor_admin_user_id=admin_user.id,
        is_active=body.is_active,
    )
    return _to_user_response(target, include_memberships=True)
