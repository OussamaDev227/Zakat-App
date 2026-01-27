"""Rules API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Request
from app.schemas.rules import (
    RulesResponse,
    AssetRuleResponse,
    LiabilityRuleResponse,
    EquityRuleResponse,
    ExtendedRulesResponse,
    ActiveRulesResponse,
    ActiveRuleResponse,
)
from app.rules.engine import RuleEngine


router = APIRouter()


def get_rule_engine(request: Request) -> RuleEngine:
    """Dependency to get rule engine from app state."""
    return request.app.state.rule_engine


@router.get("", response_model=RulesResponse)
async def get_rules(
    rule_engine: RuleEngine = Depends(get_rule_engine),
):
    """Get zakat rules for frontend dropdowns and UI hints."""
    if not rule_engine.rules:
        raise HTTPException(status_code=500, detail="Rules not loaded")
    
    # Build asset rules response
    assets = [
        AssetRuleResponse(
            code=asset.code,
            label=asset.label,
            label_ar=asset.label_ar or asset.label,
            reason_ar=asset.reason_ar,
            zakatable=asset.zakatable,
            included_in_base=asset.included_in_base,
        )
        for asset in rule_engine.rules.assets
    ]
    
    # Build liability rules response
    liabilities = [
        LiabilityRuleResponse(
            code=liab.code,
            label=liab.label,
            label_ar=liab.label_ar or liab.label,
            reason_ar=liab.reason_ar,
            deductible=liab.deductible,
        )
        for liab in rule_engine.rules.liabilities
    ]
    
    # Build equity rules response (excluded from zakat base; for balance-sheet completeness)
    equity = [
        EquityRuleResponse(
            code=eq.code,
            label=eq.label,
            label_ar=eq.label_ar or eq.label,
            reason_ar=eq.reason_ar,
            zakatable=eq.zakatable,
            included_in_base=eq.included_in_base,
        )
        for eq in rule_engine.rules.equity
    ]
    
    # Build extended rules response (for UI hints)
    extended_rules = ExtendedRulesResponse(
        mixed_assets={
            "requires_user_input": rule_engine.rules.extended_rules.mixed_assets.requires_user_input,
            "reason_ar": rule_engine.rules.extended_rules.mixed_assets.reason_ar,
        },
        receivable_strength={
            "strong_debt": {
                "included": rule_engine.rules.extended_rules.receivable_strength.strong_debt.included,
                "reason_ar": rule_engine.rules.extended_rules.receivable_strength.strong_debt.reason_ar,
            },
            "weak_debt": {
                "included": rule_engine.rules.extended_rules.receivable_strength.weak_debt.included,
                "reason_ar": rule_engine.rules.extended_rules.receivable_strength.weak_debt.reason_ar,
            },
        },
        intention_override={
            "fixed_asset_for_trade": {
                "override_to": rule_engine.rules.extended_rules.intention_override.fixed_asset_for_trade.override_to,
                "reason_ar": rule_engine.rules.extended_rules.intention_override.fixed_asset_for_trade.reason_ar,
            },
            "investment_for_trading": {
                "override_to": rule_engine.rules.extended_rules.intention_override.investment_for_trading.override_to,
                "reason_ar": rule_engine.rules.extended_rules.intention_override.investment_for_trading.reason_ar,
            },
        },
    )
    
    return RulesResponse(
        zakat_rate=rule_engine.rules.zakat_rate,
        assets=assets,
        liabilities=liabilities,
        equity=equity,
        extended_rules=extended_rules,
        direction="rtl",
    )


@router.get("/active", response_model=ActiveRulesResponse)
async def get_active_rules(
    rule_engine: RuleEngine = Depends(get_rule_engine),
):
    """Get all active rules currently used by the system (read-only)."""
    if not rule_engine.rules:
        raise HTTPException(status_code=500, detail="Rules not loaded")
    
    # Get active rules from engine
    rules_data = rule_engine.get_active_rules()
    
    # Convert to response format
    rules = [
        ActiveRuleResponse(
            rule_code=rule["rule_code"],
            label_ar=rule["label_ar"],
            rule_type=rule["rule_type"],
            reason_ar=rule["reason_ar"],
            conditions=rule.get("conditions"),
        )
        for rule in rules_data
    ]
    
    return ActiveRulesResponse(
        rules=rules,
        direction="rtl",
    )
