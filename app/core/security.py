"""Security utilities: JWT and password hashing for company isolation."""
import time
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

# Bearer token scheme for company session
_http_bearer = HTTPBearer(auto_error=False)


def hash_company_password(password: str) -> str:
    """Hash a company password with bcrypt. Store result in company_password_hash."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_company_password(password: str, password_hash: str) -> bool:
    """Verify a plain password against stored hash."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


def create_company_token(company_id: int) -> str:
    """Create a JWT containing company_id. Used after successful company password verification."""
    payload = {
        "sub": "company",
        "company_id": company_id,
        "exp": int(time.time()) + settings.jwt_expire_minutes * 60,
        "iat": int(time.time()),
    }
    return jwt.encode(
        payload,
        settings.secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_company_token(token: str) -> Optional[int]:
    """Decode JWT and return company_id if valid. Returns None if invalid or expired."""
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        if payload.get("sub") != "company":
            return None
        return payload.get("company_id")
    except Exception:
        return None


async def get_current_company_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_http_bearer),
) -> int:
    """
    Dependency: require valid company JWT and return company_id.
    Use on all routes that must be scoped to a company.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Company session required. Select a company and enter its password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    company_id = decode_company_token(credentials.credentials)
    if company_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired company session. Please select the company again and enter its password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return company_id


async def get_current_company_id_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_http_bearer),
) -> Optional[int]:
    """
    Dependency: return company_id from JWT if present and valid, else None.
    Use for routes that behave differently with/without company session (e.g. list companies).
    """
    if not credentials or not credentials.credentials:
        return None
    return decode_company_token(credentials.credentials)
