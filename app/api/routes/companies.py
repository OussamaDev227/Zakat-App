"""Company management endpoints. All access scoped by company session (JWT) where required."""
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
from app.core.security import get_current_company_id, hash_company_password

router = APIRouter()


@router.post("", response_model=CompanyResponse, status_code=201)
async def create_company(
    company_data: CompanyCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new company. Allowed without company session (e.g. first-time setup).
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
    company_id: int = Depends(get_current_company_id),
):
    """Return the current company only (full details). Requires company session. No list of other companies."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return CompanyListResponse(items=[CompanyResponse.model_validate(company)])


@router.get("/minimal", response_model=CompanyMinimalListResponse)
async def list_companies_minimal(
    db: Session = Depends(get_db),
):
    """Return only id and name for all companies. Use for company selection / switch dropdown. No auth required."""
    companies = db.query(Company).all()
    return CompanyMinimalListResponse(
        items=[CompanyMinimalResponse(id=c.id, name=c.name) for c in companies]
    )


@router.get("/current", response_model=CompanyResponse)
async def get_current_company(
    company_id: int = Depends(get_current_company_id),
    db: Session = Depends(get_db),
):
    """Get current company (from session). Requires company session."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return CompanyResponse.model_validate(company)


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    session_company_id: int = Depends(get_current_company_id),
):
    """Get a company by ID. Only allowed for the company in the current session."""
    if company_id != session_company_id:
        raise HTTPException(status_code=403, detail="Access denied to this company")
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return CompanyResponse.model_validate(company)


@router.patch("/{company_id}/language", response_model=CompanyResponse)
async def update_company_language(
    company_id: int,
    body: CompanyLanguageUpdate,
    db: Session = Depends(get_db),
    session_company_id: int = Depends(get_current_company_id),
):
    """Update only the company UI language. Allowed for the company in the current session."""
    if company_id != session_company_id:
        raise HTTPException(status_code=403, detail="Access denied to this company")
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
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
    session_company_id: int = Depends(get_current_company_id),
):
    """Update a company. Only allowed for the company in the current session."""
    if company_id != session_company_id:
        raise HTTPException(status_code=403, detail="Access denied to this company")
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
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
    session_company_id: int = Depends(get_current_company_id),
):
    """Delete a company (cascades to financial items and calculations). Only own company."""
    if company_id != session_company_id:
        raise HTTPException(status_code=403, detail="Access denied to this company")
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    db.delete(company)
    db.commit()
    return None
