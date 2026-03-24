"""Authentication and company session endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.company import Company
from app.models.user import User
from app.models.user_company import UserCompany
from app.core.security import (
    create_user_token,
    ensure_company_exists,
    get_active_company_id,
    get_current_user,
    verify_company_password,
    verify_password,
)
from app.schemas.company import CompanyMinimalResponse, CompanyResponse

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthUserResponse(BaseModel):
    id: int
    name: str
    email: str
    system_role: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserResponse


class CompanySelectRequest(BaseModel):
    company_id: int
    password: str | None = None


class CompanySelectResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    company: CompanyMinimalResponse


@router.post("/login", response_model=LoginResponse)
async def login(
    body: LoginRequest,
    db: Session = Depends(get_db),
):
    """Authenticate user by email/password and return user JWT."""
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )
    token = create_user_token(user.id)
    return LoginResponse(
        access_token=token,
        user=AuthUserResponse(id=user.id, name=user.name, email=user.email, system_role=user.system_role),
    )


@router.get("/me", response_model=AuthUserResponse)
async def me(current_user: User = Depends(get_current_user)):
    """Return authenticated user profile."""
    return AuthUserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        system_role=current_user.system_role,
    )


@router.post("/company/select", response_model=CompanySelectResponse)
async def select_company(
    body: CompanySelectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Set active company on token after membership check and optional company password check."""
    company = ensure_company_exists(db, body.company_id)

    membership = (
        db.query(UserCompany)
        .filter(
            UserCompany.user_id == current_user.id,
            UserCompany.company_id == company.id,
        )
        .first()
    )
    is_admin = getattr(current_user.system_role, "value", current_user.system_role) == "ADMIN"
    if not membership and not is_admin:
        raise HTTPException(status_code=403, detail="No access to this company.")

    # Optional second-factor check: if company has password configured, require it.
    if company.company_password_hash:
        if not body.password:
            raise HTTPException(status_code=401, detail="Company password is required.")
        if not verify_company_password(body.password, company.company_password_hash):
            raise HTTPException(status_code=401, detail="Invalid company password.")

    token = create_user_token(current_user.id, active_company_id=company.id)
    return CompanySelectResponse(
        access_token=token,
        company=CompanyMinimalResponse(
            id=company.id,
            name=company.name,
            role=membership.role.value if membership else None,
        ),
    )


@router.get("/company/current", response_model=CompanyResponse)
async def get_current_company(
    company_id: int = Depends(get_active_company_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return current company from active company in user token."""
    company = ensure_company_exists(db, company_id)
    membership = (
        db.query(UserCompany)
        .filter(
            UserCompany.user_id == current_user.id,
            UserCompany.company_id == company.id,
        )
        .first()
    )
    is_admin = getattr(current_user.system_role, "value", current_user.system_role) == "ADMIN"
    if not membership and not is_admin:
        raise HTTPException(status_code=403, detail="No access to this company.")
    return CompanyResponse.model_validate(company)
