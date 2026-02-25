"""Company session auth: select company with password, get current company."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.company import Company
from app.core.security import (
    verify_company_password,
    create_company_token,
    get_current_company_id,
)
from app.schemas.company import CompanyResponse

router = APIRouter()


class CompanySelectRequest(BaseModel):
    """Request body for selecting a company (with password)."""
    company_id: int
    password: str


class CompanySelectResponse(BaseModel):
    """Response after successful company selection."""
    access_token: str
    token_type: str = "bearer"
    company: CompanyResponse


@router.post("/company/select", response_model=CompanySelectResponse)
async def select_company(
    body: CompanySelectRequest,
    db: Session = Depends(get_db),
):
    """
    Verify company password and issue a company-scoped JWT.
    Call this when user selects a company and enters its password.
    All subsequent requests must send Authorization: Bearer <access_token>.
    """
    company = db.query(Company).filter(Company.id == body.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if not company.company_password_hash:
        raise HTTPException(
            status_code=403,
            detail="Company has no password set. Contact administrator.",
        )
    if not verify_company_password(body.password, company.company_password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid company password.",
        )
    token = create_company_token(company.id)
    return CompanySelectResponse(
        access_token=token,
        company=CompanyResponse.model_validate(company),
    )


@router.get("/company/current", response_model=CompanyResponse)
async def get_current_company(
    company_id: int = Depends(get_current_company_id),
    db: Session = Depends(get_db),
):
    """Return the current company (from JWT). Used by frontend to show company name."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return CompanyResponse.model_validate(company)
