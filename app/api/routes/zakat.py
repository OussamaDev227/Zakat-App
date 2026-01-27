"""Zakat calculation endpoints."""
import json
import time
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.zakat import (
    CalculationResponse,
    CalculationListResponse,
    CalculationListItem,
    FinancialItemCreate,
    FinancialItemUpdate,
)
from app.models.zakat_calculation import ZakatCalculation
from app.models.company import Company
from app.services.zakat_service import ZakatService
from app.rules.engine import RuleEngine

router = APIRouter()

def _log_backend(location, message, data, hypothesis_id="H2"):
    """Helper to log backend events."""
    try:
        log_entry = {
            "location": location,
            "message": message,
            "data": data,
            "timestamp": int(time.time() * 1000),
            "sessionId": "debug-session",
            "runId": "run1",
            "hypothesisId": hypothesis_id
        }
        with open(r"c:\Users\user\OneDrive\Desktop\Zakat App\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception:
        pass


def get_rule_engine(request: Request) -> RuleEngine:
    """Dependency to get rule engine from app state."""
    return request.app.state.rule_engine


@router.post("/calculation/start/{company_id}", response_model=CalculationResponse)
async def start_calculation(
    company_id: int,
    db: Session = Depends(get_db),
    rule_engine: RuleEngine = Depends(get_rule_engine),
):
    """Create or resume a draft calculation for a company."""
    # #region agent log
    _log_backend("zakat.py:start_calculation:entry", "start_calculation endpoint called", {"company_id": company_id, "company_id_type": type(company_id).__name__}, "H2")
    # #endregion
    try:
        # #region agent log
        _log_backend("zakat.py:start_calculation:before_service", "About to create service", {}, "H2")
        # #endregion
        service = ZakatService(db, rule_engine)
        # #region agent log
        _log_backend("zakat.py:start_calculation:before_call", "About to call start_calculation service", {}, "H2")
        # #endregion
        calculation = service.start_calculation(company_id)
        # #region agent log
        _log_backend("zakat.py:start_calculation:after_call", "Service call completed", {"calculation_id": calculation.id if calculation else None}, "H2")
        # #endregion
        db.commit()
        
        # #region agent log
        _log_backend("zakat.py:start_calculation:before_response", "About to create response", {"calculation_id": calculation.id, "status": calculation.status.value}, "H2")
        # #endregion
        
        # Return calculation with existing items and rules (if any)
        response = service.get_calculation_with_rules(calculation.id)
        # #region agent log
        _log_backend("zakat.py:start_calculation:success", "start_calculation service succeeded", {"calculation_id": calculation.id, "status": calculation.status.value, "items_count": len(response.items)}, "H2")
        # #endregion
        return response
    except ValueError as e:
        # #region agent log
        _log_backend("zakat.py:start_calculation:error", "start_calculation ValueError", {"error": str(e), "error_type": type(e).__name__}, "H2")
        # #endregion
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        # #region agent log
        import traceback
        _log_backend("zakat.py:start_calculation:exception", "start_calculation unhandled exception", {"error": str(e), "error_type": type(e).__name__, "traceback": traceback.format_exc()}, "H2")
        # #endregion
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/calculation/{calculation_id}/item", response_model=CalculationResponse)
async def add_or_update_item(
    calculation_id: int,
    item: FinancialItemCreate,
    item_id: Optional[int] = Query(None, description="ID of existing item to update"),
    db: Session = Depends(get_db),
    rule_engine: RuleEngine = Depends(get_rule_engine),
):
    """Add or update a financial item in a draft calculation."""
    try:
        service = ZakatService(db, rule_engine)
        
        # Convert Pydantic model to dict
        item_data = item.model_dump()
        
        # Add or update item (auto-recalculates)
        service.add_or_update_item(calculation_id, item_data, item_id)
        db.commit()
        
        # Get updated calculation with rules
        return service.get_calculation_with_rules(calculation_id)
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/calculation/{calculation_id}/recalculate", response_model=CalculationResponse)
async def recalculate(
    calculation_id: int,
    db: Session = Depends(get_db),
    rule_engine: RuleEngine = Depends(get_rule_engine),
):
    """Recalculate zakat for a draft calculation."""
    try:
        service = ZakatService(db, rule_engine)
        result = service.recalculate_calculation(calculation_id)
        db.commit()
        
        # Build response
        calculation = result["calculation"]
        return CalculationResponse(
            calculation_id=calculation.id,
            company_id=calculation.company_id,
            status=calculation.status.value,
            zakat_base=calculation.zakat_base,
            zakat_amount=calculation.zakat_amount,
            rules_used=result["rules_used"],
            items=result["items"],
            created_at=calculation.created_at,
            updated_at=calculation.updated_at,
            calculation_date=calculation.calculation_date,
            direction="rtl",
        )
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/calculation/{calculation_id}/finalize", response_model=CalculationResponse)
async def finalize(
    calculation_id: int,
    db: Session = Depends(get_db),
    rule_engine: RuleEngine = Depends(get_rule_engine),
):
    """Finalize a draft calculation (makes it read-only)."""
    try:
        service = ZakatService(db, rule_engine)
        service.finalize_calculation(calculation_id)
        db.commit()
        
        # Return finalized calculation with rules
        return service.get_calculation_with_rules(calculation_id)
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))


@router.get("/calculations", response_model=CalculationListResponse)
async def list_calculations(
    company_id: int = Query(..., description="Company ID (required)"),
    db: Session = Depends(get_db),
):
    """List all zakat calculations for a company (drafts + finalized)."""
    # #region agent log
    _log_backend("zakat.py:list_calculations:entry", "list_calculations endpoint called", {"company_id": company_id}, "H2")
    # #endregion
    try:
        # Validate company exists
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            # #region agent log
            _log_backend("zakat.py:list_calculations:error", "Company not found", {"company_id": company_id}, "H2")
            # #endregion
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Get all calculations for the company
        calculations = (
            db.query(ZakatCalculation)
            .filter(ZakatCalculation.company_id == company_id)
            .order_by(ZakatCalculation.created_at.desc())
            .all()
        )
        
        # #region agent log
        _log_backend("zakat.py:list_calculations:before_convert", "About to convert calculations", {"count": len(calculations)}, "H2")
        # #endregion
        
        # Convert to response format
        items = [
            CalculationListItem(
                calculation_id=calc.id,
                company_id=calc.company_id,
                status=calc.status.value,
                zakat_base=calc.zakat_base,
                zakat_amount=calc.zakat_amount,
                created_at=calc.created_at,
                updated_at=calc.updated_at,
                calculation_date=calc.calculation_date,
            )
            for calc in calculations
        ]
        
        # #region agent log
        _log_backend("zakat.py:list_calculations:success", "list_calculations succeeded", {"items_count": len(items)}, "H2")
        # #endregion
        
        return CalculationListResponse(items=items, direction="rtl")
    except HTTPException:
        raise
    except Exception as e:
        # #region agent log
        import traceback
        _log_backend("zakat.py:list_calculations:exception", "list_calculations unhandled exception", {"error": str(e), "error_type": type(e).__name__, "traceback": traceback.format_exc()}, "H2")
        # #endregion
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/calculation/{calculation_id}", response_model=CalculationResponse)
async def get_calculation(
    calculation_id: int,
    db: Session = Depends(get_db),
    rule_engine: RuleEngine = Depends(get_rule_engine),
):
    """Get a calculation with rules and items."""
    try:
        service = ZakatService(db, rule_engine)
        return service.get_calculation_with_rules(calculation_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/calculation/{calculation_id}/link-item/{financial_item_id}", response_model=CalculationResponse)
async def link_item_to_calculation(
    calculation_id: int,
    financial_item_id: int,
    amount: Optional[Decimal] = Query(None, description="Override amount (optional)"),
    db: Session = Depends(get_db),
    rule_engine: RuleEngine = Depends(get_rule_engine),
):
    """Link an existing financial item to a calculation."""
    try:
        service = ZakatService(db, rule_engine)
        service.link_existing_item(calculation_id, financial_item_id, amount)
        db.commit()
        return service.get_calculation_with_rules(calculation_id)
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))


@router.delete("/calculation/{calculation_id}/item/{item_id}", response_model=CalculationResponse)
async def remove_item_from_calculation(
    calculation_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    rule_engine: RuleEngine = Depends(get_rule_engine),
):
    """Remove a financial item from a calculation."""
    try:
        service = ZakatService(db, rule_engine)
        service.remove_item_from_calculation(calculation_id, item_id)
        db.commit()
        return service.get_calculation_with_rules(calculation_id)
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/calculation/{calculation_id}/create-revision", response_model=CalculationResponse)
async def create_revision(
    calculation_id: int,
    db: Session = Depends(get_db),
    rule_engine: RuleEngine = Depends(get_rule_engine),
):
    """Create a revision (clone) of a finalized calculation."""
    try:
        service = ZakatService(db, rule_engine)
        new_calculation = service.create_revision(calculation_id)
        db.commit()
        return service.get_calculation_with_rules(new_calculation.id)
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))
