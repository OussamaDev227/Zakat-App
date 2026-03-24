"""Security utilities: user JWT authentication and company role authorization."""
import time
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.company import Company
from app.models.user import SystemRole, User
from app.models.user_company import CompanyRole, UserCompany

# Bearer token scheme for user session
_http_bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash a password with bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a plain password against stored hash."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


def hash_company_password(password: str) -> str:
    """Hash company password with bcrypt."""
    return hash_password(password)


def verify_company_password(password: str, password_hash: str) -> bool:
    """Verify company password hash."""
    return verify_password(password, password_hash)


def create_user_token(user_id: int, active_company_id: Optional[int] = None) -> str:
    """Create a JWT containing user identity and optional active company context."""
    payload = {
        "sub": str(user_id),
        "type": "user",
        "exp": int(time.time()) + settings.jwt_expire_minutes * 60,
        "iat": int(time.time()),
    }
    if active_company_id is not None:
        payload["active_company_id"] = active_company_id
    return jwt.encode(
        payload,
        settings.secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_user_token(token: str) -> Optional[dict]:
    """Decode JWT and return user payload dict if valid."""
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        if payload.get("type") != "user":
            return None
        return payload
    except Exception:
        return None


def is_system_admin(user: User) -> bool:
    return (user.system_role or SystemRole.USER.value) == SystemRole.ADMIN.value


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_http_bearer),
    db: Session = Depends(get_db),
) -> User:
    """Require valid user JWT and return active user."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_user_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_active_company_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_http_bearer),
) -> int:
    """
    Return active company from user token.
    This is set after successful company selection.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_user_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    company_id = payload.get("active_company_id")
    if not company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No active company selected.",
        )
    return company_id


def require_company_roles(*allowed_roles: CompanyRole):
    """Dependency factory: require one of the allowed company roles in active company."""

    async def _dependency(
        current_user: User = Depends(get_current_user),
        company_id: int = Depends(get_active_company_id),
        db: Session = Depends(get_db),
    ) -> UserCompany:
        membership = (
            None
            if is_system_admin(current_user)
            else (
                db.query(UserCompany)
                .filter(
                    UserCompany.user_id == current_user.id,
                    UserCompany.company_id == company_id,
                )
                .first()
            )
        )
        if not membership and not is_system_admin(current_user):
            raise HTTPException(status_code=403, detail="No access to the selected company.")
        if not is_system_admin(current_user) and allowed_roles and membership.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient role permissions.")
        return membership

    return _dependency


def require_company_access():
    """Dependency factory: require membership in active company."""

    async def _dependency(
        current_user: User = Depends(get_current_user),
        company_id: int = Depends(get_active_company_id),
        db: Session = Depends(get_db),
    ) -> UserCompany:
        membership = (
            None
            if is_system_admin(current_user)
            else (
                db.query(UserCompany)
                .filter(
                    UserCompany.user_id == current_user.id,
                    UserCompany.company_id == company_id,
                )
                .first()
            )
        )
        if not membership and not is_system_admin(current_user):
            raise HTTPException(status_code=403, detail="No access to the selected company.")
        return membership

    return _dependency


async def require_system_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency requiring global system admin role."""
    if not is_system_admin(current_user):
        raise HTTPException(status_code=403, detail="System admin role required.")
    return current_user


def ensure_company_exists(db: Session, company_id: int) -> Company:
    """Utility helper to validate company existence."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company
