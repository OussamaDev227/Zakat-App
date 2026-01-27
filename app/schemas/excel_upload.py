"""Schemas for Excel upload responses."""
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel

from app.schemas.zakat import CalculationResponse


class ExcelRowError(BaseModel):
    """Error details for a problematic Excel row."""
    row_number: int
    item_name: str
    errors: List[str]


class ExcludedItem(BaseModel):
    """Details about an excluded item (equity, fixed assets, etc.)."""
    item_name: str
    category: Optional[str]
    amount: Decimal
    rule_code: str
    explanation_ar: str


class ExcelUploadResponse(BaseModel):
    """Response schema for Excel upload endpoint."""
    calculation_id: int
    total_rows: int
    imported_rows: int
    errors: List[ExcelRowError]
    total_zakatable_assets: Decimal
    total_deductible_liabilities: Decimal
    zakat_base: Decimal
    zakat_due: Decimal
    excluded_items: List[ExcludedItem]
    calculation_response: CalculationResponse
