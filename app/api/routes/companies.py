"""Company management endpoints with user auth and RBAC."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.company import (
    CompanyCreate,
    CompanyUpdate,
    CompanyResponse,
    CompanyListResponse,
    CompanyMinimalResponse,
    CompanyMinimalListResponse,
    CompanyLanguageUpdate,
)
from app.models.company import Company
from app.models.user import User
from app.models.user_company import CompanyRole, UserCompany
from app.core.security import (
    ensure_company_exists,
    get_active_company_id,
    get_current_user,
    hash_company_password,
    require_company_roles,
    require_system_admin,
)

router = APIRouter()


@router.post("", response_model=CompanyResponse, status_code=201)
async def create_company(
    company_data: CompanyCreate,
    db: Session = Depends(get_db),
    _current_admin: User = Depends(require_system_admin),
):
    """
    Create a new company.
    Fiscal year validation: start < end is enforced by CompanyCreate schema and DB constraint.
    If password is provided, it is hashed and stored as company_password_hash.
    """
    data = company_data.model_dump()
    password = data.pop("password", None)
    language = data.pop("language", None)
    company = Company(**data)
    if password:
        company.company_password_hash = hash_company_password(password)
    if language and language in ("ar", "fr", "en"):
        company.language = language
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.get("", response_model=CompanyListResponse)
async def list_companies(
    db: Session = Depends(get_db),
    company_id: int = Depends(get_active_company_id),
    current_user: User = Depends(get_current_user),
):
    """Return current company details for authenticated user active company."""
    membership = (
        db.query(UserCompany)
        .filter(UserCompany.user_id == current_user.id, UserCompany.company_id == company_id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="No access to this company.")
    company = ensure_company_exists(db, company_id)
    return CompanyListResponse(items=[CompanyResponse.model_validate(company)])


@router.get("/minimal", response_model=CompanyMinimalListResponse)
async def list_companies_minimal(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return companies the authenticated user belongs to."""
    is_admin = getattr(current_user.system_role, "value", current_user.system_role) == "ADMIN"
    companies = (
        db.query(Company).all()
        if is_admin
        else (
            db.query(Company)
            .join(UserCompany, UserCompany.company_id == Company.id)
            .filter(UserCompany.user_id == current_user.id)
            .all()
        )
    )
    return CompanyMinimalListResponse(
        items=[
            CompanyMinimalResponse(
                id=c.id,
                name=c.name,
                role=(
                    (
                        db.query(UserCompany)
                        .filter(UserCompany.user_id == current_user.id, UserCompany.company_id == c.id)
                        .first()
                    ).role.value
                    if not is_admin
                    else None
                ),
            )
            for c in companies
        ]
    )


@router.get("/current", response_model=CompanyResponse)
async def get_current_company(
    company_id: int = Depends(get_active_company_id),
    db: Session = Depends(get_db),
    membership: UserCompany = Depends(require_company_roles(
        CompanyRole.ACCOUNTANT,
        CompanyRole.OWNER,
        CompanyRole.SHARIA_AUDITOR,
    )),
):
    """Get current company (from session). Requires company session."""
    company = ensure_company_exists(db, company_id)
    return CompanyResponse.model_validate(company)


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    session_company_id: int = Depends(get_active_company_id),
    membership: UserCompany = Depends(require_company_roles(
        CompanyRole.ACCOUNTANT,
        CompanyRole.OWNER,
        CompanyRole.SHARIA_AUDITOR,
    )),
):
    """Get a company by ID. Only allowed for the company in the current session."""
    if company_id != session_company_id:
        if membership is None:
            company = ensure_company_exists(db, company_id)
            return CompanyResponse.model_validate(company)
        raise HTTPException(status_code=403, detail="Access denied to this company")
    company = ensure_company_exists(db, company_id)
    return CompanyResponse.model_validate(company)


@router.patch("/{company_id}/language", response_model=CompanyResponse)
async def update_company_language(
    company_id: int,
    body: CompanyLanguageUpdate,
    db: Session = Depends(get_db),
    session_company_id: int = Depends(get_active_company_id),
    _current_admin: User = Depends(require_system_admin),
):
    """Update only the company UI language. Allowed for the company in the current session."""
    if company_id != session_company_id:
        raise HTTPException(status_code=403, detail="Access denied to this company")
    company = ensure_company_exists(db, company_id)
    if body.language not in ("ar", "fr", "en"):
        raise HTTPException(status_code=400, detail="language must be one of: ar, fr, en")
    company.language = body.language
    db.commit()
    db.refresh(company)
    return CompanyResponse.model_validate(company)


@router.put("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: int,
    company_data: CompanyUpdate,
    db: Session = Depends(get_db),
    session_company_id: int = Depends(get_active_company_id),
    _current_admin: User = Depends(require_system_admin),
):
    """Update a company. Only allowed for the company in the current session."""
    if company_id != session_company_id:
        raise HTTPException(status_code=403, detail="Access denied to this company")
    company = ensure_company_exists(db, company_id)
    data = company_data.model_dump(exclude_unset=True)
    password = data.pop("password", None)
    for field, value in data.items():
        setattr(company, field, value)
    if password is not None:
        company.company_password_hash = hash_company_password(password)
    db.commit()
    db.refresh(company)
    return CompanyResponse.model_validate(company)


@router.delete("/{company_id}", status_code=204)
async def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
    session_company_id: int = Depends(get_active_company_id),
    _current_admin: User = Depends(require_system_admin),
):
    """Delete a company (cascades to financial items and calculations). Only own company."""
    if company_id != session_company_id:
        raise HTTPException(status_code=403, detail="Access denied to this company")
    company = ensure_company_exists(db, company_id)
    db.delete(company)
    db.commit()
    return None
