"""Zakat calculation service."""
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.financial_item import FinancialItem
from app.models.zakat_calculation import ZakatCalculation, CalculationStatus
from app.models.zakat_item_result import ZakatItemResult
from app.rules.engine import RuleEngine
from app.schemas.zakat import (
    CalculationResponse,
    ZakatItemResult as ZakatItemResultSchema,
    RuleUsed,
    FinancialItemCreate,
    FinancialItemUpdate,
)


class ZakatService:
    """Service for zakat calculations."""
    
    def __init__(self, db: Session, rule_engine: RuleEngine):
        """Initialize service with database session and rule engine."""
        self.db = db
        self.rule_engine = rule_engine
    
    def start_calculation(self, company_id: int) -> ZakatCalculation:
        """
        Create or resume a draft calculation for a company.
        Automatically links all unlinked financial items for the company.
        
        Args:
            company_id: ID of the company
            
        Returns:
            ZakatCalculation object (DRAFT status)
        """
        # Validate company exists
        company = self.db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise ValueError(f"Company {company_id} not found")
        
        # Check if draft calculation exists
        draft = (
            self.db.query(ZakatCalculation)
            .filter(
                ZakatCalculation.company_id == company_id,
                ZakatCalculation.status == CalculationStatus.DRAFT
            )
            .first()
        )
        
        if draft:
            calculation = draft
        else:
            # Create new draft calculation
            calculation = ZakatCalculation(
                company_id=company_id,
                zakat_base=Decimal("0"),
                zakat_amount=Decimal("0"),
                status=CalculationStatus.DRAFT,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            self.db.add(calculation)
            self.db.flush()
        
        # Auto-link all unlinked financial items for this company
        unlinked_items = (
            self.db.query(FinancialItem)
            .filter(
                FinancialItem.company_id == company_id,
                FinancialItem.calculation_id.is_(None)
            )
            .all()
        )
        
        # Link each unlinked item to this calculation
        for item in unlinked_items:
            item.calculation_id = calculation.id
        
        self.db.flush()
        
        # Recalculate the calculation to process all linked items
        if unlinked_items:
            # Only recalculate if we linked new items
            self.recalculate_calculation(calculation.id)
        
        return calculation
    
    def add_or_update_item(
        self,
        calculation_id: int,
        item_data: Dict[str, Any],
        item_id: Optional[int] = None
    ) -> FinancialItem:
        """
        Add or update a financial item in a draft calculation.
        
        Args:
            calculation_id: ID of the calculation
            item_data: Dictionary with item fields (name, category, asset_type/liability_code, amount, metadata)
            item_id: Optional ID of existing item to update
            
        Returns:
            FinancialItem object
        """
        # Validate calculation exists and is DRAFT
        calculation = self.db.query(ZakatCalculation).filter(ZakatCalculation.id == calculation_id).first()
        if not calculation:
            raise ValueError(f"Calculation {calculation_id} not found")
        
        if calculation.status != CalculationStatus.DRAFT:
            raise ValueError(f"Cannot modify finalized calculation {calculation_id}")
        
        # Validate item data
        category = item_data.get("category")
        if category not in ["ASSET", "LIABILITY", "EQUITY"]:
            raise ValueError(f"Invalid category: {category}")
        
        if category == "ASSET" and not item_data.get("asset_type"):
            raise ValueError("asset_type is required for ASSET category")
        if category == "LIABILITY" and not item_data.get("liability_code"):
            raise ValueError("liability_code is required for LIABILITY category")
        if category == "EQUITY":
            if not item_data.get("equity_code"):
                raise ValueError("equity_code is required for EQUITY category")
            if not self.rule_engine.is_valid_equity_code(item_data["equity_code"]):
                raise ValueError(f"Invalid equity_code: {item_data['equity_code']}")
        
        # Validate metadata
        metadata = item_data.get("metadata", {})
        if "trade_percentage" in metadata:
            tp = metadata["trade_percentage"]
            if not isinstance(tp, (int, float)) or not (0 <= tp <= 1):
                raise ValueError("trade_percentage must be between 0 and 1")
        
        if item_data.get("asset_type") == "RECEIVABLE" and "collectibility" not in metadata:
            raise ValueError(
                "RECEIVABLE items require 'collectibility' in metadata "
                "(must be 'strong_debt' or 'weak_debt')"
            )
        
        # Update existing item or create new
        if item_id:
            item = self.db.query(FinancialItem).filter(FinancialItem.id == item_id).first()
            if not item:
                raise ValueError(f"Financial item {item_id} not found")
            if item.calculation_id != calculation_id:
                raise ValueError(f"Item {item_id} does not belong to calculation {calculation_id}")
            
            # Update fields
            if "name" in item_data:
                item.name = item_data["name"]
            if "amount" in item_data:
                item.amount = item_data["amount"]
            if "asset_type" in item_data:
                item.asset_type = item_data["asset_type"]
            if "accounting_label" in item_data:
                item.accounting_label = item_data["accounting_label"]
            if "metadata" in item_data:
                item.item_metadata = item_data["metadata"]
            if "liability_code" in item_data:
                item.liability_code = item_data["liability_code"]
            if "equity_code" in item_data:
                item.equity_code = item_data["equity_code"]
            if category == "EQUITY":
                item.asset_type = None
                item.liability_code = None
            elif category == "ASSET":
                item.liability_code = None
                item.equity_code = None
            elif category == "LIABILITY":
                item.asset_type = None
                item.equity_code = None
        else:
            # Create new item
            at = item_data.get("asset_type") if category == "ASSET" else None
            lc = item_data.get("liability_code") if category == "LIABILITY" else None
            ec = item_data.get("equity_code") if category == "EQUITY" else None
            item = FinancialItem(
                company_id=calculation.company_id,
                calculation_id=calculation_id,
                name=item_data["name"],
                category=item_data["category"],
                asset_type=at,
                accounting_label=item_data.get("accounting_label"),
                liability_code=lc,
                equity_code=ec,
                amount=item_data["amount"],
                item_metadata=metadata,
            )
            self.db.add(item)
        
        self.db.flush()
        
        # Auto-recalculate
        self.recalculate_calculation(calculation_id)
        
        return item
    
    def recalculate_calculation(self, calculation_id: int) -> Dict[str, Any]:
        """
        Recalculate zakat for a draft calculation.
        
        Args:
            calculation_id: ID of the calculation
            
        Returns:
            Dictionary with calculation data, items, and rules_used
        """
        # Load calculation (must be DRAFT)
        calculation = self.db.query(ZakatCalculation).filter(ZakatCalculation.id == calculation_id).first()
        if not calculation:
            raise ValueError(f"Calculation {calculation_id} not found")
        
        if calculation.status != CalculationStatus.DRAFT:
            raise ValueError(f"Cannot recalculate finalized calculation {calculation_id}")
        
        # Load all financial items for this calculation
        financial_items = (
            self.db.query(FinancialItem)
            .filter(FinancialItem.calculation_id == calculation_id)
            .all()
        )
        
        # Delete old item results
        self.db.query(ZakatItemResult).filter(
            ZakatItemResult.calculation_id == calculation_id
        ).delete()
        
        # Calculate zakat base and item results
        zakat_base = Decimal("0")
        item_results = []
        rule_codes_used = set()
        
        for item in financial_items:
            included, included_amount, explanation_ar, rule_code = self.rule_engine.calculate_item_result(
                category=item.category.value,
                asset_type=item.asset_type,
                liability_code=item.liability_code,
                equity_code=item.equity_code,
                amount=item.amount,
                metadata=item.item_metadata or {},
            )
            
            zakat_base += included_amount
            rule_codes_used.add(rule_code)
            
            # Create item result
            item_result = ZakatItemResult(
                calculation_id=calculation_id,
                financial_item_id=item.id,
                included=included,
                included_amount=included_amount,
                explanation_ar=explanation_ar,
                rule_code=rule_code,
            )
            self.db.add(item_result)
            
            item_results.append(
                ZakatItemResultSchema(
                    item_id=item.id,
                    item_name=item.name,
                    category=item.category.value,
                    original_amount=item.amount,
                    included=included,
                    included_amount=included_amount,
                    explanation_ar=explanation_ar,
                    rule_code=rule_code,
                )
            )
        
        # Calculate zakat amount
        zakat_rate = Decimal(str(self.rule_engine.get_zakat_rate()))
        zakat_amount = zakat_base * zakat_rate
        
        # Update calculation
        calculation.zakat_base = zakat_base
        calculation.zakat_amount = zakat_amount
        calculation.updated_at = datetime.utcnow()
        
        self.db.flush()
        
        # Build rules_used list
        rules_used = []
        for rule_code in sorted(rule_codes_used):
            rule_info = self.rule_engine.get_rule_info(rule_code)
            if rule_info:
                rules_used.append(
                    RuleUsed(
                        rule_code=rule_code,
                        label_ar=rule_info["label_ar"],
                        reason_ar=rule_info["reason_ar"],
                        rule_type=rule_info["rule_type"],
                    )
                )
        
        return {
            "calculation": calculation,
            "items": item_results,
            "rules_used": rules_used,
        }
    
    def finalize_calculation(self, calculation_id: int) -> ZakatCalculation:
        """
        Finalize a draft calculation (makes it read-only).
        
        Args:
            calculation_id: ID of the calculation
            
        Returns:
            Finalized ZakatCalculation object
        """
        # Load calculation (must be DRAFT)
        calculation = self.db.query(ZakatCalculation).filter(ZakatCalculation.id == calculation_id).first()
        if not calculation:
            raise ValueError(f"Calculation {calculation_id} not found")
        
        if calculation.status != CalculationStatus.DRAFT:
            raise ValueError(f"Calculation {calculation_id} is already finalized")
        
        # Check that calculation has at least one item
        item_count = (
            self.db.query(FinancialItem)
            .filter(FinancialItem.calculation_id == calculation_id)
            .count()
        )
        
        if item_count == 0:
            raise ValueError(f"Cannot finalize calculation {calculation_id} with no financial items")
        
        # Finalize
        calculation.status = CalculationStatus.FINALIZED
        calculation.calculation_date = datetime.utcnow()
        calculation.updated_at = datetime.utcnow()
        
        self.db.flush()
        
        return calculation
    
    def get_calculation_with_rules(self, calculation_id: int) -> CalculationResponse:
        """
        Get a calculation with rules and items.
        
        Args:
            calculation_id: ID of the calculation
            
        Returns:
            CalculationResponse with all details
        """
        # Load calculation
        calculation = self.db.query(ZakatCalculation).filter(ZakatCalculation.id == calculation_id).first()
        if not calculation:
            raise ValueError(f"Calculation {calculation_id} not found")
        
        # Load item results
        item_results_db = (
            self.db.query(ZakatItemResult)
            .filter(ZakatItemResult.calculation_id == calculation_id)
            .all()
        )
        
        # Build items list
        items = []
        rule_codes_used = set()
        
        for item_result in item_results_db:
            financial_item = item_result.financial_item
            items.append(
                ZakatItemResultSchema(
                    item_id=financial_item.id,
                    item_name=financial_item.name,
                    category=financial_item.category.value,
                    original_amount=financial_item.amount,
                    included=item_result.included,
                    included_amount=item_result.included_amount,
                    explanation_ar=item_result.explanation_ar,
                    rule_code=item_result.rule_code,
                )
            )
            rule_codes_used.add(item_result.rule_code)
        
        # Build rules_used list
        rules_used = []
        for rule_code in sorted(rule_codes_used):
            rule_info = self.rule_engine.get_rule_info(rule_code)
            if rule_info:
                rules_used.append(
                    RuleUsed(
                        rule_code=rule_code,
                        label_ar=rule_info["label_ar"],
                        reason_ar=rule_info["reason_ar"],
                        rule_type=rule_info["rule_type"],
                    )
                )
        
        # Load company info
        company = calculation.company
        company_name = company.name if company else None
        company_type = company.legal_type.value if company else None
        fiscal_year_start = company.fiscal_year_start if company else None
        fiscal_year_end = company.fiscal_year_end if company else None
        
        return CalculationResponse(
            calculation_id=calculation.id,
            company_id=calculation.company_id,
            company_name=company_name,
            company_type=company_type,
            fiscal_year_start=fiscal_year_start,
            fiscal_year_end=fiscal_year_end,
            status=calculation.status.value,
            zakat_base=calculation.zakat_base,
            zakat_amount=calculation.zakat_amount,
            rules_used=rules_used,
            items=items,
            created_at=calculation.created_at,
            updated_at=calculation.updated_at,
            calculation_date=calculation.calculation_date,
            direction="rtl",
        )
    
    def link_existing_item(
        self,
        calculation_id: int,
        financial_item_id: int,
        amount_override: Optional[Decimal] = None
    ) -> FinancialItem:
        """
        Link an existing financial item to a calculation.
        
        Args:
            calculation_id: ID of the calculation
            financial_item_id: ID of existing financial item
            amount_override: Optional amount override for this calculation
            
        Returns:
            FinancialItem object (linked to calculation)
        """
        # Validate calculation exists and is DRAFT
        calculation = self.db.query(ZakatCalculation).filter(ZakatCalculation.id == calculation_id).first()
        if not calculation:
            raise ValueError(f"Calculation {calculation_id} not found")
        
        if calculation.status != CalculationStatus.DRAFT:
            raise ValueError(f"Cannot modify finalized calculation {calculation_id}")
        
        # Load existing financial item
        financial_item = self.db.query(FinancialItem).filter(FinancialItem.id == financial_item_id).first()
        if not financial_item:
            raise ValueError(f"Financial item {financial_item_id} not found")
        
        # Check if item belongs to same company
        if financial_item.company_id != calculation.company_id:
            raise ValueError(f"Financial item {financial_item_id} does not belong to company {calculation.company_id}")
        
        # Check if item is already linked to this calculation
        if financial_item.calculation_id == calculation_id:
            raise ValueError(f"Financial item {financial_item_id} is already linked to calculation {calculation_id}")
        
        # Create a copy of the item for this calculation (or link if item has no calculation_id)
        # For now, we'll create a new item based on the existing one
        new_item = FinancialItem(
            company_id=calculation.company_id,
            calculation_id=calculation_id,
            name=financial_item.name,
            category=financial_item.category,
            asset_type=financial_item.asset_type,
            accounting_label=financial_item.accounting_label,
            liability_code=financial_item.liability_code,
            equity_code=financial_item.equity_code,
            amount=amount_override if amount_override is not None else financial_item.amount,
            item_metadata=financial_item.item_metadata.copy() if financial_item.item_metadata else {},
        )
        self.db.add(new_item)
        self.db.flush()
        
        # Auto-recalculate
        self.recalculate_calculation(calculation_id)
        
        return new_item
    
    def remove_item_from_calculation(
        self,
        calculation_id: int,
        item_id: int
    ) -> None:
        """
        Remove a financial item from a calculation.
        
        Args:
            calculation_id: ID of the calculation
            item_id: ID of the financial item to remove
        """
        # Validate calculation exists and is DRAFT
        calculation = self.db.query(ZakatCalculation).filter(ZakatCalculation.id == calculation_id).first()
        if not calculation:
            raise ValueError(f"Calculation {calculation_id} not found")
        
        if calculation.status != CalculationStatus.DRAFT:
            raise ValueError(f"Cannot modify finalized calculation {calculation_id}")
        
        # Load item and verify it belongs to this calculation
        item = self.db.query(FinancialItem).filter(FinancialItem.id == item_id).first()
        if not item:
            raise ValueError(f"Financial item {item_id} not found")
        
        if item.calculation_id != calculation_id:
            raise ValueError(f"Financial item {item_id} does not belong to calculation {calculation_id}")
        
        # Delete the item (cascade will delete item_results)
        self.db.delete(item)
        self.db.flush()
        
        # Auto-recalculate
        self.recalculate_calculation(calculation_id)
    
    def create_revision(self, calculation_id: int) -> ZakatCalculation:
        """
        Create a revision (clone) of a finalized calculation.
        
        Args:
            calculation_id: ID of the finalized calculation to clone
            
        Returns:
            New ZakatCalculation object (DRAFT status)
        """
        # Load original calculation
        original = self.db.query(ZakatCalculation).filter(ZakatCalculation.id == calculation_id).first()
        if not original:
            raise ValueError(f"Calculation {calculation_id} not found")
        
        # Create new draft calculation
        new_calculation = ZakatCalculation(
            company_id=original.company_id,
            zakat_base=Decimal("0"),
            zakat_amount=Decimal("0"),
            status=CalculationStatus.DRAFT,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self.db.add(new_calculation)
        self.db.flush()
        
        # Clone all financial items from original calculation
        original_items = (
            self.db.query(FinancialItem)
            .filter(FinancialItem.calculation_id == calculation_id)
            .all()
        )
        
        for original_item in original_items:
            new_item = FinancialItem(
                company_id=original_item.company_id,
                calculation_id=new_calculation.id,
                name=original_item.name,
                category=original_item.category,
                asset_type=original_item.asset_type,
                accounting_label=original_item.accounting_label,
                liability_code=original_item.liability_code,
                equity_code=original_item.equity_code,
                amount=original_item.amount,
                item_metadata=original_item.item_metadata.copy() if original_item.item_metadata else {},
            )
            self.db.add(new_item)
        
        self.db.flush()
        
        # Recalculate the new calculation
        self.recalculate_calculation(new_calculation.id)
        
        return new_calculation
