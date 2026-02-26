"""Company schemas."""
from datetime import date
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, model_validator

from app.models.company import LegalType


def _validate_fiscal_year_range(fiscal_year_start: date, fiscal_year_end: date) -> None:
    """Raise ValueError if start >= end (validation must enforce start < end)."""
    if fiscal_year_start >= fiscal_year_end:
        raise ValueError("fiscal_year_start must be before fiscal_year_end (start < end)")


class CompanyCreate(BaseModel):
    """Schema for creating a company."""
    name: str
    legal_type: LegalType
    fiscal_year_start: date
    fiscal_year_end: date
    zakat_nisab_value: Optional[Decimal] = None  # قيمة النصاب — minimum Zakat threshold (company currency)
    password: Optional[str] = None  # Optional; if provided, stored hashed as company_password_hash

    @model_validator(mode="after")
    def fiscal_year_start_before_end(self):
        _validate_fiscal_year_range(self.fiscal_year_start, self.fiscal_year_end)
        return self


class CompanyUpdate(BaseModel):
    """Schema for updating a company."""
    name: str
    legal_type: LegalType
    fiscal_year_start: date
    fiscal_year_end: date
    zakat_nisab_value: Optional[Decimal] = None  # قيمة النصاب — minimum Zakat threshold (company currency)
    password: Optional[str] = None  # Optional; if provided, update company_password_hash

    @model_validator(mode="after")
    def fiscal_year_start_before_end(self):
        _validate_fiscal_year_range(self.fiscal_year_start, self.fiscal_year_end)
        return self


class CompanyResponse(BaseModel):
    """Schema for company response (never includes password hash)."""
    id: int
    name: str
    legal_type: LegalType
    fiscal_year_start: date
    fiscal_year_end: date
    zakat_nisab_value: Optional[Decimal] = None  # قيمة النصاب

    model_config = {"from_attributes": True}


class CompanyMinimalResponse(BaseModel):
    """Minimal company for selection list (id + name only)."""
    id: int
    name: str

    model_config = {"from_attributes": True}


class CompanyListResponse(BaseModel):
    """Schema for list of companies (full)."""
    items: List[CompanyResponse]

    model_config = {"from_attributes": True}


class CompanyMinimalListResponse(BaseModel):
    """Schema for minimal list (e.g. company selection / switch)."""
    items: List[CompanyMinimalResponse]

    model_config = {"from_attributes": True}
