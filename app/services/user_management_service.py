"""User management service helpers for business constraints."""
from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.user import SystemRole, User
from app.models.user_company import CompanyRole, UserCompany


class UserManagementService:
    """Encapsulates user lifecycle and membership validation rules."""

    def __init__(self, db: Session):
        self.db = db

    def get_user_or_404(self, user_id: int) -> User:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
        return user

    def set_user_active_status(self, target_user_id: int, actor_admin_user_id: int, is_active: bool) -> User:
        target = self.get_user_or_404(target_user_id)

        if not is_active:
            if target.id == actor_admin_user_id:
                raise HTTPException(status_code=400, detail="You cannot deactivate your own account.")
            if target.system_role == SystemRole.ADMIN:
                active_admin_count = (
                    self.db.query(func.count(User.id))
                    .filter(User.system_role == SystemRole.ADMIN, User.is_active.is_(True))
                    .scalar()
                )
                if active_admin_count <= 1:
                    raise HTTPException(
                        status_code=400,
                        detail="At least one active admin must remain in the system.",
                    )

        target.is_active = is_active
        self.db.commit()
        self.db.refresh(target)
        return target

    def remove_company_membership(self, company_id: int, user_id: int) -> None:
        membership = (
            self.db.query(UserCompany)
            .filter(UserCompany.user_id == user_id, UserCompany.company_id == company_id)
            .first()
        )
        if not membership:
            raise HTTPException(status_code=404, detail="Company membership not found")

        if membership.role == CompanyRole.OWNER:
            owner_count = (
                self.db.query(UserCompany)
                .filter(
                    UserCompany.company_id == company_id,
                    UserCompany.role == CompanyRole.OWNER,
                )
                .count()
            )
            if owner_count <= 1:
                raise HTTPException(status_code=400, detail="A company must have at least one owner")

        self.db.delete(membership)
        self.db.commit()
