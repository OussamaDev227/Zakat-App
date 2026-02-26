"""Lookups API endpoints for dropdowns and UI metadata."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from app.schemas.lookups import AssetTypesResponse, AssetTypeLookup
from app.rules.engine import RuleEngine
from app.models.financial_item import AssetType

router = APIRouter()


def get_rule_engine(request: Request) -> RuleEngine:
    """Dependency to get rule engine from app state."""
    return request.app.state.rule_engine


@router.get("/asset-types", response_model=List[AssetTypeLookup])
async def get_asset_types(
    rule_engine: RuleEngine = Depends(get_rule_engine),
):
    """
    Get asset types for dropdown selection.
    
    Returns strict zakat jurisprudence asset classifications.
    These are FINAL and must not be editable by users.
    Asset classification is a jurisprudential constraint, not a user preference.
    """
    if not rule_engine.rules:
        raise HTTPException(status_code=500, detail="Rules not loaded")
    
    # Build response from rules, ensuring all enum values are present
    asset_types = []
    default_labels = {
        AssetType.CASH: "النقدية وما في حكمها",
        AssetType.TRADING_GOODS: "عروض التجارة / البضاعة المعدة للبيع",
        AssetType.PRODUCTION_INVENTORY: "المخزون الإنتاجي",
        AssetType.RECEIVABLE: "الذمم المدينة",
        AssetType.FIXED_ASSET: "الأصول الثابتة العينية",
        AssetType.INTANGIBLE_ASSET: "الأصول المعنوية",
        AssetType.LONG_TERM_INVESTMENT: "الاستثمارات طويلة الأجل",
    }
    default_zakatable = {
        AssetType.CASH: True,
        AssetType.TRADING_GOODS: True,
        AssetType.PRODUCTION_INVENTORY: False,
        AssetType.RECEIVABLE: True,
        AssetType.FIXED_ASSET: False,
        AssetType.INTANGIBLE_ASSET: False,
        AssetType.LONG_TERM_INVESTMENT: False,
    }
    for asset_type_enum in AssetType:
        code = asset_type_enum.value
        asset_rule = rule_engine.assets_by_code.get(code)
        if asset_rule:
            asset_types.append(
                AssetTypeLookup(
                    code=code,
                    label_ar=asset_rule.label_ar,
                    zakatable_default=asset_rule.zakatable,
                )
            )
        else:
            asset_types.append(
                AssetTypeLookup(
                    code=code,
                    label_ar=default_labels.get(asset_type_enum, code),
                    zakatable_default=default_zakatable.get(asset_type_enum, False),
                )
            )
    
    return asset_types
