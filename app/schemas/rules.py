"""Rules API response schemas."""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class AssetRuleResponse(BaseModel):
    """Asset rule for frontend dropdowns."""
    code: str
    label: str
    label_ar: str
    reason_ar: str
    zakatable: bool
    included_in_base: bool


class LiabilityRuleResponse(BaseModel):
    """Liability rule for frontend dropdowns."""
    code: str
    label: str
    label_ar: str
    reason_ar: str
    deductible: bool


class EquityRuleResponse(BaseModel):
    """Equity rule for frontend dropdowns. Equity excluded from zakat base."""
    code: str
    label: str
    label_ar: str
    reason_ar: str
    zakatable: bool  # Always false
    included_in_base: bool  # Always false


class ExtendedRulesResponse(BaseModel):
    """Extended rules metadata for UI hints."""
    mixed_assets: Dict[str, Any]
    receivable_strength: Dict[str, Any]
    intention_override: Dict[str, Any]
    
    class Config:
        from_attributes = True


class RulesResponse(BaseModel):
    """Complete rules response for frontend."""
    zakat_rate: float
    assets: List[AssetRuleResponse]
    liabilities: List[LiabilityRuleResponse]
    equity: List[EquityRuleResponse]
    extended_rules: ExtendedRulesResponse
    direction: str = "rtl"


class ActiveRuleResponse(BaseModel):
    """Schema for an active rule (read-only)."""
    rule_code: str
    label_ar: str
    rule_type: str  # "ASSET", "LIABILITY", "EQUITY", "EXTENDED"
    reason_ar: str
    conditions: Optional[List[str]] = None


class ActiveRulesResponse(BaseModel):
    """Response for GET /rules/active endpoint."""
    rules: List[ActiveRuleResponse]
    direction: str = "rtl"
