"""Excel ingestion service for financial statement data."""
from decimal import Decimal
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.services.excel_parser import parse_excel_file, validate_excel_structure
from app.services.category_mapper import map_category_to_zakat_code
from app.services.zakat_service import ZakatService
from app.rules.engine import RuleEngine
from app.schemas.zakat import CalculationResponse
from app.validators.financial_item_validators import find_duplicate_financial_items


class ExcelIngestionService:
    """Service for ingesting Excel files and creating zakat calculations."""
    
    def __init__(self, db: Session, rule_engine: RuleEngine):
        """Initialize service with database session and rule engine."""
        self.db = db
        self.rule_engine = rule_engine
        self.zakat_service = ZakatService(db, rule_engine)
    
    def ingest_excel_file(
        self,
        company_id: int,
        file_path: str
    ) -> Dict[str, Any]:
        """
        Ingest Excel file, create financial items, and calculate zakat.
        
        Args:
            company_id: ID of the company
            file_path: Path to Excel file
            
        Returns:
            Dictionary with:
            - calculation_id: int
            - total_rows: int
            - imported_rows: int
            - errors: List[Dict] with row_number and error message
            - total_zakatable_assets: Decimal
            - total_deductible_liabilities: Decimal
            - zakat_base: Decimal
            - zakat_due: Decimal
            - excluded_items: List[Dict] with item details
            - calculation_response: CalculationResponse
        """
        # Parse Excel file
        rows = parse_excel_file(file_path)
        
        # Validate structure
        is_valid, structure_errors = validate_excel_structure(rows)
        if not is_valid:
            raise ValueError(f"Invalid Excel structure: {', '.join(structure_errors)}")
        
        # Auto-create or get existing DRAFT calculation
        calculation = self.zakat_service.start_calculation(company_id)
        calculation_id = calculation.id
        
        # Process each row
        imported_count = 0
        errors = []
        skipped_duplicates = []
        excluded_items = []

        for row in rows:
            row_number = row.get('row_number', 0)
            item_name = row.get('item_name', '').strip()
            category_str = row.get('category', '').strip()
            amount = row.get('amount')
            notes = row.get('notes', '').strip()
            
            # Validate required fields
            row_errors = []
            
            if not item_name:
                row_errors.append("Missing item_name")
            
            if not category_str:
                row_errors.append("Missing category")
            
            if amount is None:
                row_errors.append("Missing or invalid amount")
            elif amount < 0:
                row_errors.append("Amount cannot be negative")
            
            # Map category to zakat code
            mapping = map_category_to_zakat_code(category_str)
            
            if mapping.get('error'):
                row_errors.append(mapping['error'])
            
            # If there are errors, flag them but continue
            if row_errors:
                errors.append({
                    "row_number": row_number,
                    "item_name": item_name or "(empty)",
                    "errors": row_errors
                })
                # Still try to create item with error flags in metadata
                item_metadata = {
                    "excel_import_errors": row_errors,
                    "excel_row_number": row_number
                }
                if notes:
                    item_metadata["notes"] = notes
            else:
                item_metadata = {}
                if notes:
                    item_metadata["notes"] = notes
                item_metadata["excel_row_number"] = row_number
            
            # Only create item if we have minimum required data
            if item_name and mapping.get('category') and amount is not None and amount >= 0:
                try:
                    # Prepare item data
                    item_data = {
                        "name": item_name,
                        "category": mapping['category'],
                        "amount": amount,
                        "accounting_label": notes if notes else None,
                        "metadata": item_metadata
                    }
                    
                    # Add category-specific fields
                    if mapping['category'] == 'ASSET':
                        if not mapping.get('asset_type'):
                            row_errors.append("Missing asset_type in mapping")
                            errors.append({
                                "row_number": row_number,
                                "item_name": item_name,
                                "errors": row_errors
                            })
                            continue
                        item_data['asset_type'] = mapping['asset_type'].value
                        # Merge metadata (e.g., collectibility for receivables)
                        if mapping.get('metadata'):
                            item_data['metadata'].update(mapping['metadata'])
                    elif mapping['category'] == 'LIABILITY':
                        if not mapping.get('liability_code'):
                            row_errors.append("Missing liability_code in mapping")
                            errors.append({
                                "row_number": row_number,
                                "item_name": item_name,
                                "errors": row_errors
                            })
                            continue
                        item_data['liability_code'] = mapping['liability_code']
                    elif mapping['category'] == 'EQUITY':
                        if not mapping.get('equity_code'):
                            row_errors.append("Missing equity_code in mapping")
                            errors.append({
                                "row_number": row_number,
                                "item_name": item_name,
                                "errors": row_errors
                            })
                            continue
                        item_data['equity_code'] = mapping['equity_code']
                    
                    # Validate with rule engine
                    if mapping['category'] == 'ASSET':
                        if not self.rule_engine.is_valid_asset_type(mapping['asset_type']):
                            row_errors.append(f"Invalid asset_type: {mapping['asset_type']}")
                            errors.append({
                                "row_number": row_number,
                                "item_name": item_name,
                                "errors": row_errors
                            })
                            continue
                    elif mapping['category'] == 'LIABILITY':
                        if not self.rule_engine.is_valid_liability_code(mapping['liability_code']):
                            row_errors.append(f"Invalid liability_code: {mapping['liability_code']}")
                            errors.append({
                                "row_number": row_number,
                                "item_name": item_name,
                                "errors": row_errors
                            })
                            continue
                    elif mapping['category'] == 'EQUITY':
                        if not self.rule_engine.is_valid_equity_code(mapping['equity_code']):
                            row_errors.append(f"Invalid equity_code: {mapping['equity_code']}")
                            errors.append({
                                "row_number": row_number,
                                "item_name": item_name,
                                "errors": row_errors
                            })
                            continue

                    # Duplicate detection: skip row if exact/normalized/similar name exists
                    dup = find_duplicate_financial_items(
                        self.db, company_id, item_name, exclude_item_id=None, use_fuzzy=True
                    )
                    if dup.is_duplicate:
                        skipped_duplicates.append({
                            "row_number": row_number,
                            "item_name": item_name,
                            "message": dup.message or "Duplicate or similar item already exists",
                            "exact_match_id": dup.exact_match_id,
                            "normalized_match_id": dup.normalized_match_id,
                            "similar_match_ids": dup.similar_match_ids,
                        })
                        errors.append({
                            "row_number": row_number,
                            "item_name": item_name,
                            "errors": [dup.message or "Duplicate or similar financial item; skipped. Consider merging."]
                        })
                        continue

                    # Create financial item
                    self.zakat_service.add_or_update_item(calculation_id, item_data)
                    imported_count += 1
                    
                except Exception as e:
                    errors.append({
                        "row_number": row_number,
                        "item_name": item_name or "(empty)",
                        "errors": [f"Failed to create item: {str(e)}"]
                    })
        
        # Recalculate calculation to get final results
        self.db.flush()
        result = self.zakat_service.recalculate_calculation(calculation_id)
        self.db.flush()
        
        # Get calculation response
        calculation_response = self.zakat_service.get_calculation_with_rules(calculation_id)
        
        # Calculate summary statistics
        total_zakatable_assets = Decimal("0")
        total_deductible_liabilities = Decimal("0")
        
        for item_result in calculation_response.items:
            if item_result.included:
                if item_result.included_amount > 0:
                    # Asset
                    total_zakatable_assets += item_result.included_amount
                else:
                    # Deductible liability (negative amount)
                    total_deductible_liabilities += abs(item_result.included_amount)
            else:
                # Excluded item (equity, fixed assets, etc.)
                excluded_items.append({
                    "item_name": item_result.item_name,
                    "category": item_result.category,
                    "amount": item_result.original_amount,
                    "rule_code": item_result.rule_code,
                    "explanation_ar": item_result.explanation_ar
                })
        
        zakat_base = calculation_response.zakat_base
        zakat_due = calculation_response.zakat_amount
        
        return {
            "calculation_id": calculation_id,
            "total_rows": len(rows),
            "imported_rows": imported_count,
            "errors": errors,
            "skipped_duplicates": skipped_duplicates,
            "total_zakatable_assets": total_zakatable_assets,
            "total_deductible_liabilities": total_deductible_liabilities,
            "zakat_base": zakat_base,
            "zakat_due": zakat_due,
            "excluded_items": excluded_items,
            "calculation_response": calculation_response
        }
