"""Company schemas."""
from datetime import date
from typing import List
from pydantic import BaseModel

from app.models.company import LegalType


class CompanyCreate(BaseModel):
    """Schema for creating a company."""
    name: str
    legal_type: LegalType
    fiscal_year_start: date
    fiscal_year_end: date


class CompanyUpdate(BaseModel):
    """Schema for updating a company."""
    name: str
    legal_type: LegalType
    fiscal_year_start: date
    fiscal_year_end: date


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
