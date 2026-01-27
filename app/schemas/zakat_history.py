"""Zakat calculation history schemas."""
from datetime import datetime
from decimal import Decimal
from typing import List
from pydantic import BaseModel

from app.schemas.zakat import ZakatItemResult


class ZakatCalculationListItem(BaseModel):
    """Schema for zakat calculation in list view."""
    id: int
    company_id: int
    zakat_base: Decimal
    zakat_amount: Decimal
    calculation_date: datetime
    
    class Config:
        from_attributes = True


class ZakatCalculationListResponse(BaseModel):
    """Schema for list of zakat calculations."""
    items: List[ZakatCalculationListItem]
    
    class Config:
        from_attributes = True


class ZakatCalculationDetail(BaseModel):
    """Schema for detailed zakat calculation with item results."""
    id: int
    company_id: int
    zakat_base: Decimal
    zakat_amount: Decimal
    calculation_date: datetime
    items: List[ZakatItemResult]
    direction: str = "rtl"
    
    class Config:
        from_attributes = True
