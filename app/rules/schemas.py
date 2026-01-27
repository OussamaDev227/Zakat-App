"""Pydantic schemas for zakat rules JSON."""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


class RuleMetadata(BaseModel):
    """Rules metadata."""
    version: str
    source: str
    scope: str
    notes: str


class TimeCondition(BaseModel):
    """Time condition for zakat calculation."""
    fiscal_year_required: bool
    reason: str
    reason_ar: str  # Arabic explanation required


class ValuationRules(BaseModel):
    """Valuation rules."""
    cash: str
    inventory: str
    receivables: str


class AssetRule(BaseModel):
    """Asset rule definition."""
    code: str
    label: str
    label_ar: Optional[str] = None  # Optional Arabic label
    examples: List[str]
    zakatable: bool
    included_in_base: bool
    conditions: List[str]
    reason: str  # English (for reference)
    reason_ar: str  # Arabic explanation (required)


class LiabilityRule(BaseModel):
    """Liability rule definition."""
    code: str
    label: str
    label_ar: Optional[str] = None  # Optional Arabic label
    examples: List[str]
    deductible: bool
    reason: str  # English (for reference)
    reason_ar: str  # Arabic explanation (required)


class EquityRule(BaseModel):
    """
    Equity rule definition.
    Equity represents ownership claims on net assets, not zakatable wealth.
    Excluded from the zakat base by design; neither added nor deducted.
    """
    code: str
    label: str
    label_ar: Optional[str] = None
    examples: List[str]
    zakatable: bool  # Always false; explicit for auditability
    included_in_base: bool  # Always false; explicit for auditability
    reason: str
    reason_ar: str


class MixedAssetsRule(BaseModel):
    """Mixed assets rule."""
    rule: str
    requires_user_input: List[str]
    reason: str
    reason_ar: str  # Arabic explanation (required)


class ReceivableStrengthRule(BaseModel):
    """Receivable strength rule (strong or weak debt)."""
    included: bool
    postpone_until_collected: Optional[bool] = None
    reason: str
    reason_ar: str  # Arabic explanation (required)


class ReceivableStrengthRules(BaseModel):
    """Receivable strength rules container."""
    strong_debt: ReceivableStrengthRule
    weak_debt: ReceivableStrengthRule


class OwnershipSeparationRule(BaseModel):
    """Ownership separation rule."""
    exclude_personal_funds: bool
    reason: str
    reason_ar: str  # Arabic explanation (required)


class OwnershipSeparationRules(BaseModel):
    """Ownership separation rules container."""
    sole_proprietorship: OwnershipSeparationRule


class IntentionOverrideRule(BaseModel):
    """Intention override rule."""
    override_to: str
    reason: str
    reason_ar: str  # Arabic explanation (required)


class IntentionOverrideRules(BaseModel):
    """Intention override rules container."""
    fixed_asset_for_trade: IntentionOverrideRule
    investment_for_trading: IntentionOverrideRule


class ExtendedRules(BaseModel):
    """Extended rules container."""
    mixed_assets: MixedAssetsRule
    receivable_strength: ReceivableStrengthRules
    ownership_separation: OwnershipSeparationRules
    intention_override: IntentionOverrideRules


class ZakatRules(BaseModel):
    """Complete zakat rules schema."""
    metadata: RuleMetadata
    zakat_rate: float = Field(ge=0, le=1)
    time_condition: TimeCondition
    valuation_rules: ValuationRules
    assets: List[AssetRule]
    liabilities: List[LiabilityRule]
    equity: List[EquityRule]
    extended_rules: ExtendedRules
