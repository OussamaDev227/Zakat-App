"""Company schemas."""
from datetime import date
from typing import List
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

    @model_validator(mode="after")
    def fiscal_year_start_before_end(self):
        _validate_fiscal_year_range(self.fiscal_year_start, self.fiscal_year_end)
        return self


class CompanyResponse(BaseModel):
    """Schema for company response."""
    id: int
    name: str
    legal_type: LegalType
    fiscal_year_start: date
    fiscal_year_end: date
    
    class Config:
        from_attributes = True


class CompanyListResponse(BaseModel):
    """Schema for list of companies."""
    items: List[CompanyResponse]
    
    class Config:
        from_attributes = True
