"""Financial item schemas."""
from decimal import Decimal
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

from app.models.financial_item import ItemCategory, AssetType


class FinancialItemCreate(BaseModel):
    """Schema for creating a financial item."""
    company_id: int
    name: str
    category: ItemCategory
    asset_type: Optional[AssetType] = None  # Required for ASSET category
    accounting_label: Optional[str] = None  # Optional accounting description
    liability_code: Optional[str] = None
    equity_code: Optional[str] = None  # Required for EQUITY category
    amount: Decimal = Field(ge=0, decimal_places=2)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class FinancialItemUpdate(BaseModel):
    """Schema for updating a financial item."""
    name: str
    category: ItemCategory
    asset_type: Optional[AssetType] = None  # Required for ASSET category
    accounting_label: Optional[str] = None  # Optional accounting description
    liability_code: Optional[str] = None
    equity_code: Optional[str] = None  # Required for EQUITY category
    amount: Decimal = Field(ge=0, decimal_places=2)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class FinancialItemResponse(BaseModel):
    """Schema for financial item response."""
    id: int
    company_id: int
    name: str
    category: ItemCategory
    asset_type: Optional[AssetType]
    accounting_label: Optional[str]
    liability_code: Optional[str]
    equity_code: Optional[str]
    amount: Decimal
    metadata: Dict[str, Any]
    
    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm_with_metadata(cls, obj):
        """Create response from ORM object, mapping item_metadata to metadata."""
        data = {
            'id': obj.id,
            'company_id': obj.company_id,
            'name': obj.name,
            'category': obj.category,
            'asset_type': obj.asset_type,
            'accounting_label': obj.accounting_label,
            'liability_code': obj.liability_code,
            'equity_code': getattr(obj, 'equity_code', None),
            'amount': obj.amount,
            'metadata': obj.item_metadata,
        }
        return cls(**data)


class FinancialItemListResponse(BaseModel):
    """Schema for list of financial items."""
    items: List[FinancialItemResponse]
    
    class Config:
        from_attributes = True
