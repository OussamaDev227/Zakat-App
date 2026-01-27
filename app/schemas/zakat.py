"""Zakat calculation schemas."""
from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


class ZakatItemResult(BaseModel):
    """Schema for zakat item result."""
    item_id: Optional[int] = None  # Financial item ID
    item_name: str
    category: Optional[str] = None  # "ASSET", "LIABILITY", or "EQUITY"
    original_amount: Optional[Decimal] = None  # Original amount from financial item
    included: bool
    included_amount: Decimal
    explanation_ar: str
    rule_code: str


class RuleUsed(BaseModel):
    """Schema for a rule used in calculation."""
    rule_code: str
    label_ar: str
    reason_ar: str
    rule_type: str  # "ASSET", "LIABILITY", "EXTENDED"


class CalculationResponse(BaseModel):
    """Schema for calculation response with rules."""
    calculation_id: int
    company_id: int
    company_name: Optional[str] = None
    company_type: Optional[str] = None  # "LLC" or "SOLE_PROPRIETORSHIP"
    fiscal_year_start: Optional[date] = None
    fiscal_year_end: Optional[date] = None
    status: str  # "DRAFT" or "FINALIZED"
    zakat_base: Decimal
    zakat_amount: Decimal
    rules_used: list[RuleUsed]
    items: list[ZakatItemResult]
    created_at: datetime
    updated_at: datetime
    calculation_date: Optional[datetime] = None
    direction: str = "rtl"


class FinancialItemCreate(BaseModel):
    """Schema for creating a financial item in a calculation."""
    name: str
    category: str  # "ASSET", "LIABILITY", or "EQUITY"
    asset_type: Optional[str] = None  # AssetType enum value
    accounting_label: Optional[str] = None
    liability_code: Optional[str] = None
    equity_code: Optional[str] = None  # Required for EQUITY category
    amount: Decimal
    metadata: dict = {}


class FinancialItemUpdate(BaseModel):
    """Schema for updating a financial item."""
    name: Optional[str] = None
    amount: Optional[Decimal] = None
    metadata: Optional[dict] = None


class CalculationListItem(BaseModel):
    """Schema for calculation in list view."""
    calculation_id: int
    company_id: int
    status: str  # "DRAFT" or "FINALIZED"
    zakat_base: Decimal
    zakat_amount: Decimal
    created_at: datetime
    updated_at: datetime
    calculation_date: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class CalculationListResponse(BaseModel):
    """Schema for list of calculations."""
    items: list[CalculationListItem]
    direction: str = "rtl"


# Legacy schema for backward compatibility (deprecated)
class ZakatCalculationResponse(BaseModel):
    """Schema for zakat calculation response (deprecated - use CalculationResponse)."""
    zakat_base: Decimal
    zakat_amount: Decimal
    items: list[ZakatItemResult]
    direction: str = "rtl"  # RTL readiness metadata
