"""Deterministic zakat rule engine."""
import json
from pathlib import Path
from typing import Dict, Optional, Any
from decimal import Decimal

from app.rules.schemas import ZakatRules, AssetRule, LiabilityRule, EquityRule
from app.models.financial_item import AssetType


class RuleEngine:
    """Rule engine that applies pre-defined zakat rules deterministically."""
    
    def __init__(self):
        """Initialize rule engine."""
        self.rules: Optional[ZakatRules] = None
        self.assets_by_code: Dict[str, AssetRule] = {}
        self.liabilities_by_code: Dict[str, LiabilityRule] = {}
        self.equities_by_code: Dict[str, EquityRule] = {}
    
    def load_rules(self, rules_path: Path) -> None:
        """Load and validate rules from JSON file."""
        if not rules_path.exists():
            raise FileNotFoundError(f"Rules file not found: {rules_path}")
        
        with open(rules_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        # Parse and validate rules
        self.rules = ZakatRules(**data)
        
        # Build lookup dictionaries
        self.assets_by_code = {asset.code: asset for asset in self.rules.assets}
        self.liabilities_by_code = {liab.code: liab for liab in self.rules.liabilities}
        self.equities_by_code = {eq.code: eq for eq in self.rules.equity}
        
        # Validate that all required Arabic fields exist
        self._validate_arabic_fields()
    
    def _validate_arabic_fields(self) -> None:
        """
        Validate that all required Arabic explanation fields exist and are non-empty.
        
        Note: Pydantic will also validate required fields, but this provides
        clearer error messages and ensures fields are not empty strings.
        """
        missing_ar = []
        
        # Check assets
        for asset in self.rules.assets:
            if not asset.reason_ar or not asset.reason_ar.strip():
                missing_ar.append(f"Asset {asset.code}: missing or empty reason_ar")
        
        # Check liabilities
        for liab in self.rules.liabilities:
            if not liab.reason_ar or not liab.reason_ar.strip():
                missing_ar.append(f"Liability {liab.code}: missing or empty reason_ar")
        
        # Check equity
        for eq in self.rules.equity:
            if not eq.reason_ar or not eq.reason_ar.strip():
                missing_ar.append(f"Equity {eq.code}: missing or empty reason_ar")
        
        # Check extended rules
        if not self.rules.extended_rules.mixed_assets.reason_ar or not self.rules.extended_rules.mixed_assets.reason_ar.strip():
            missing_ar.append("Extended rule mixed_assets: missing or empty reason_ar")
        
        if not self.rules.extended_rules.receivable_strength.strong_debt.reason_ar or not self.rules.extended_rules.receivable_strength.strong_debt.reason_ar.strip():
            missing_ar.append("Extended rule receivable_strength.strong_debt: missing or empty reason_ar")
        
        if not self.rules.extended_rules.receivable_strength.weak_debt.reason_ar or not self.rules.extended_rules.receivable_strength.weak_debt.reason_ar.strip():
            missing_ar.append("Extended rule receivable_strength.weak_debt: missing or empty reason_ar")
        
        if not self.rules.extended_rules.ownership_separation.sole_proprietorship.reason_ar or not self.rules.extended_rules.ownership_separation.sole_proprietorship.reason_ar.strip():
            missing_ar.append("Extended rule ownership_separation.sole_proprietorship: missing or empty reason_ar")
        
        if not self.rules.extended_rules.intention_override.fixed_asset_for_trade.reason_ar or not self.rules.extended_rules.intention_override.fixed_asset_for_trade.reason_ar.strip():
            missing_ar.append("Extended rule intention_override.fixed_asset_for_trade: missing or empty reason_ar")
        
        if not self.rules.extended_rules.intention_override.investment_for_trading.reason_ar or not self.rules.extended_rules.intention_override.investment_for_trading.reason_ar.strip():
            missing_ar.append("Extended rule intention_override.investment_for_trading: missing or empty reason_ar")
        
        if missing_ar:
            raise ValueError(
                "Rules validation failed: Missing or empty Arabic explanations (reason_ar):\n" +
                "\n".join(f"  - {msg}" for msg in missing_ar) +
                "\n\nAll rule explanations must be provided in Arabic. Please update zakat_rules_full_v1.json with reason_ar fields."
            )
    
    def is_valid_asset_type(self, asset_type: AssetType) -> bool:
        """Check if asset type exists in rules."""
        return asset_type.value in self.assets_by_code
    
    def is_valid_asset_code(self, code: str) -> bool:
        """Check if asset code exists in rules (deprecated - use is_valid_asset_type)."""
        return code in self.assets_by_code
    
    def is_valid_liability_code(self, code: str) -> bool:
        """Check if liability code exists in rules."""
        return code in self.liabilities_by_code
    
    def is_valid_equity_code(self, code: str) -> bool:
        """Check if equity code exists in rules."""
        return code in self.equities_by_code
    
    def calculate_item_result(
        self,
        category: str,
        asset_type: Optional[AssetType],
        liability_code: Optional[str],
        equity_code: Optional[str],
        amount: Decimal,
        metadata: Dict[str, Any],
    ) -> tuple[bool, Decimal, str, str]:
        """
        Calculate zakat result for a single financial item.
        
        Returns:
            (included: bool, included_amount: Decimal, explanation_ar: str, rule_code: str)
        """
        if category == "ASSET":
            if asset_type is None:
                raise ValueError("asset_type is required for ASSET category")
            return self._calculate_asset_result(asset_type, amount, metadata)
        elif category == "LIABILITY":
            return self._calculate_liability_result(liability_code, amount)
        elif category == "EQUITY":
            # Fiqqh-accounting rationale: equity is ownership claims, not zakatable wealth;
            # never in base, never deducted. Excluded from all zakat computations.
            return self._calculate_equity_result(equity_code)
        else:
            raise ValueError(f"Invalid category: {category}")
    
    def _calculate_asset_result(
        self,
        asset_type: AssetType,
        amount: Decimal,
        metadata: Dict[str, Any],
    ) -> tuple[bool, Decimal, str, str]:
        """Calculate result for an asset."""
        asset_code = asset_type.value
        if asset_code not in self.assets_by_code:
            raise ValueError(f"Invalid asset_type: {asset_type}")
        
        asset_rule = self.assets_by_code[asset_code]
        explanations = []
        
        # Check intention override first
        effective_code = asset_code
        rule_code = asset_code
        intent = metadata.get("intent")
        if intent and intent in self.rules.extended_rules.intention_override.model_dump():
            override_rule = getattr(
                self.rules.extended_rules.intention_override,
                intent
            )
            effective_code = override_rule.override_to
            rule_code = effective_code  # Use override code
            explanations.append(override_rule.reason_ar)
            # Get the effective asset rule
            if effective_code in self.assets_by_code:
                asset_rule = self.assets_by_code[effective_code]
        
        # Base rule: check if zakatable and included
        if not asset_rule.zakatable or not asset_rule.included_in_base:
            return (False, Decimal("0"), asset_rule.reason_ar, rule_code)
        
        included_amount = amount
        
        # Apply receivable strength logic if applicable
        if effective_code == "RECEIVABLE":
            collectibility = metadata.get("collectibility")
            if collectibility:
                if collectibility == "strong_debt":
                    rule_code = "RECEIVABLE_STRONG"
                    # Already included, use strong_debt explanation
                    explanations.append(
                        self.rules.extended_rules.receivable_strength.strong_debt.reason_ar
                    )
                elif collectibility == "weak_debt":
                    rule_code = "RECEIVABLE_WEAK"
                    # Not included
                    return (
                        False,
                        Decimal("0"),
                        self.rules.extended_rules.receivable_strength.weak_debt.reason_ar,
                        rule_code
                    )
        
        # Apply mixed assets logic (trade percentage)
        trade_percentage = metadata.get("trade_percentage")
        if trade_percentage is not None:
            if not isinstance(trade_percentage, (int, float)) or not (0 <= trade_percentage <= 1):
                raise ValueError("trade_percentage must be between 0 and 1")
            included_amount = included_amount * Decimal(str(trade_percentage))
            explanations.append(self.rules.extended_rules.mixed_assets.reason_ar)
            # Append MIXED suffix to rule code if trade percentage applied
            if rule_code != "RECEIVABLE_STRONG" and rule_code != "RECEIVABLE_WEAK":
                rule_code = f"{rule_code}_MIXED"
        
        # Combine explanations: base reason + any additional rules
        if explanations:
            explanation_ar = " | ".join([asset_rule.reason_ar] + explanations)
        else:
            explanation_ar = asset_rule.reason_ar
        
        return (True, included_amount, explanation_ar, rule_code)
    
    def _calculate_liability_result(
        self,
        liability_code: str,
        amount: Decimal,
    ) -> tuple[bool, Decimal, str, str]:
        """Calculate result for a liability."""
        if liability_code not in self.liabilities_by_code:
            raise ValueError(f"Invalid liability_code: {liability_code}")
        
        liability_rule = self.liabilities_by_code[liability_code]
        rule_code = liability_code
        
        if liability_rule.deductible:
            # Deductible liabilities reduce the base (return negative amount)
            return (True, -amount, liability_rule.reason_ar, rule_code)
        else:
            return (False, Decimal("0"), liability_rule.reason_ar, rule_code)
    
    def _calculate_equity_result(self, equity_code: Optional[str]) -> tuple[bool, Decimal, str, str]:
        """
        Result for equity items. Equity represents ownership claims, not zakatable wealth.
        Excluded from the zakat base by design; neither added nor deducted.
        """
        if not equity_code or equity_code not in self.equities_by_code:
            raise ValueError(f"Invalid or missing equity_code: {equity_code}")
        eq = self.equities_by_code[equity_code]
        return (False, Decimal("0"), eq.reason_ar, eq.code)
    
    def get_zakat_rate(self) -> float:
        """Get zakat rate from rules."""
        return self.rules.zakat_rate
    
    def get_active_rules(self) -> list[Dict[str, Any]]:
        """
        Get all active rules currently used by the system.
        
        Returns:
            List of rule dictionaries with code, label_ar, reason_ar, rule_type, conditions
        """
        if not self.rules:
            return []
        
        rules = []
        
        # Add asset rules
        for asset in self.rules.assets:
            rules.append({
                "rule_code": asset.code,
                "label_ar": asset.label_ar or asset.label,
                "reason_ar": asset.reason_ar,
                "rule_type": "ASSET",
                "conditions": asset.conditions if asset.conditions else None,
            })
        
        # Add liability rules
        for liab in self.rules.liabilities:
            rules.append({
                "rule_code": liab.code,
                "label_ar": liab.label_ar or liab.label,
                "reason_ar": liab.reason_ar,
                "rule_type": "LIABILITY",
                "conditions": None,
            })
        
        # Add equity rules (excluded from base; for balance-sheet completeness)
        for eq in self.rules.equity:
            rules.append({
                "rule_code": eq.code,
                "label_ar": eq.label_ar or eq.label,
                "reason_ar": eq.reason_ar,
                "rule_type": "EQUITY",
                "conditions": None,
            })
        
        # Add extended rules as special rule codes
        # Mixed assets
        rules.append({
            "rule_code": "MIXED_ASSETS",
            "label_ar": "الأصول المختلطة",
            "reason_ar": self.rules.extended_rules.mixed_assets.reason_ar,
            "rule_type": "EXTENDED",
            "conditions": self.rules.extended_rules.mixed_assets.requires_user_input,
        })
        
        # Receivable strength rules
        rules.append({
            "rule_code": "RECEIVABLE_STRONG",
            "label_ar": "الذمم المدينة القوية",
            "reason_ar": self.rules.extended_rules.receivable_strength.strong_debt.reason_ar,
            "rule_type": "EXTENDED",
            "conditions": None,
        })
        
        rules.append({
            "rule_code": "RECEIVABLE_WEAK",
            "label_ar": "الذمم المدينة الضعيفة",
            "reason_ar": self.rules.extended_rules.receivable_strength.weak_debt.reason_ar,
            "rule_type": "EXTENDED",
            "conditions": None,
        })
        
        # Intention override rules
        rules.append({
            "rule_code": "INTENTION_OVERRIDE_FIXED_ASSET",
            "label_ar": "تجاوز النية - أصل ثابت للتجارة",
            "reason_ar": self.rules.extended_rules.intention_override.fixed_asset_for_trade.reason_ar,
            "rule_type": "EXTENDED",
            "conditions": None,
        })
        
        rules.append({
            "rule_code": "INTENTION_OVERRIDE_INVESTMENT",
            "label_ar": "تجاوز النية - استثمار للتجارة",
            "reason_ar": self.rules.extended_rules.intention_override.investment_for_trading.reason_ar,
            "rule_type": "EXTENDED",
            "conditions": None,
        })
        
        return rules
    
    def get_rule_info(self, rule_code: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a specific rule by code.
        
        Returns:
            Dictionary with label_ar, reason_ar, rule_type, or None if not found
        """
        # Check assets
        if rule_code in self.assets_by_code:
            asset = self.assets_by_code[rule_code]
            return {
                "label_ar": asset.label_ar or asset.label,
                "reason_ar": asset.reason_ar,
                "rule_type": "ASSET",
            }
        
        # Check liabilities
        if rule_code in self.liabilities_by_code:
            liab = self.liabilities_by_code[rule_code]
            return {
                "label_ar": liab.label_ar or liab.label,
                "reason_ar": liab.reason_ar,
                "rule_type": "LIABILITY",
            }
        
        # Check equity
        if rule_code in self.equities_by_code:
            eq = self.equities_by_code[rule_code]
            return {
                "label_ar": eq.label_ar or eq.label,
                "reason_ar": eq.reason_ar,
                "rule_type": "EQUITY",
            }
        
        # Check extended rules
        if rule_code == "MIXED_ASSETS":
            return {
                "label_ar": "الأصول المختلطة",
                "reason_ar": self.rules.extended_rules.mixed_assets.reason_ar,
                "rule_type": "EXTENDED",
            }
        
        if rule_code == "RECEIVABLE_STRONG":
            return {
                "label_ar": "الذمم المدينة القوية",
                "reason_ar": self.rules.extended_rules.receivable_strength.strong_debt.reason_ar,
                "rule_type": "EXTENDED",
            }
        
        if rule_code == "RECEIVABLE_WEAK":
            return {
                "label_ar": "الذمم المدينة الضعيفة",
                "reason_ar": self.rules.extended_rules.receivable_strength.weak_debt.reason_ar,
                "rule_type": "EXTENDED",
            }
        
        # Handle mixed asset codes (e.g., "CASH_MIXED")
        if rule_code.endswith("_MIXED"):
            base_code = rule_code[:-6]  # Remove "_MIXED" suffix
            if base_code in self.assets_by_code:
                asset = self.assets_by_code[base_code]
                return {
                    "label_ar": f"{asset.label_ar or asset.label} (مختلط)",
                    "reason_ar": f"{asset.reason_ar} | {self.rules.extended_rules.mixed_assets.reason_ar}",
                    "rule_type": "ASSET",
                }
        
        return None
