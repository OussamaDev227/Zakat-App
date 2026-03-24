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
from app.core.security import get_active_company_id, require_company_roles
from app.models.user_company import CompanyRole

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


@router.post("/calculation/start", response_model=CalculationResponse)
async def start_calculation(
    db: Session = Depends(get_db),
    rule_engine: RuleEngine = Depends(get_rule_engine),
    membership=Depends(require_company_roles(CompanyRole.ACCOUNTANT)),
    company_id: int = Depends(get_active_company_id),
):
    """Create or resume a draft calculation for the current company (from session)."""
    try:
        service = ZakatService(db, rule_engine)
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


def _ensure_calculation_belongs_to_company(db: Session, calculation_id: int, company_id: int) -> ZakatCalculation:
    calc = db.query(ZakatCalculation).filter(ZakatCalculation.id == calculation_id).first()
    if not calc:
        raise HTTPException(status_code=404, detail="Calculation not found")
    if calc.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied to this calculation")
    return calc


@router.post("/calculation/{calculation_id}/item", response_model=CalculationResponse)
async def add_or_update_item(
    calculation_id: int,
    item: FinancialItemCreate,
    item_id: Optional[int] = Query(None, description="ID of existing item to update"),
    db: Session = Depends(get_db),
    rule_engine: RuleEngine = Depends(get_rule_engine),
    membership=Depends(require_company_roles(CompanyRole.ACCOUNTANT)),
    company_id: int = Depends(get_active_company_id),
):
    """Add or update a financial item in a draft calculation. Calculation must belong to current company."""
    _ensure_calculation_belongs_to_company(db, calculation_id, company_id)
    try:
        service = ZakatService(db, rule_engine)
        item_data = item.model_dump()
        service.add_or_update_item(calculation_id, item_data, item_id)
        db.commit()
        return service.get_calculation_with_rules(calculation_id)
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/calculation/{calculation_id}/recalculate", response_model=CalculationResponse)
async def recalculate(
    calculation_id: int,
    db: Session = Depends(get_db),
    rule_engine: RuleEngine = Depends(get_rule_engine),
    membership=Depends(require_company_roles(CompanyRole.ACCOUNTANT)),
    company_id: int = Depends(get_active_company_id),
):
    """Recalculate zakat for a draft calculation. Calculation must belong to current company."""
    _ensure_calculation_belongs_to_company(db, calculation_id, company_id)
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
    membership=Depends(require_company_roles(CompanyRole.ACCOUNTANT)),
    company_id: int = Depends(get_active_company_id),
):
    """Finalize a draft calculation (makes it read-only). Calculation must belong to current company."""
    _ensure_calculation_belongs_to_company(db, calculation_id, company_id)
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
    db: Session = Depends(get_db),
    membership=Depends(require_company_roles(
        CompanyRole.ACCOUNTANT,
        CompanyRole.OWNER,
        CompanyRole.SHARIA_AUDITOR,
    )),
    company_id: int = Depends(get_active_company_id),
):
    """List all zakat calculations for the current company (drafts + finalized)."""
    try:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        calculations = (
            db.query(ZakatCalculation)
            .filter(ZakatCalculation.company_id == company_id)
            .order_by(ZakatCalculation.created_at.desc())
            .all()
        )
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
        return CalculationListResponse(items=items, direction="rtl")
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/calculation/{calculation_id}", response_model=CalculationResponse)
async def get_calculation(
    calculation_id: int,
    db: Session = Depends(get_db),
    rule_engine: RuleEngine = Depends(get_rule_engine),
    membership=Depends(require_company_roles(
        CompanyRole.ACCOUNTANT,
        CompanyRole.OWNER,
        CompanyRole.SHARIA_AUDITOR,
    )),
    company_id: int = Depends(get_active_company_id),
):
    """Get a calculation with rules and items. Calculation must belong to current company."""
    _ensure_calculation_belongs_to_company(db, calculation_id, company_id)
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
    membership=Depends(require_company_roles(CompanyRole.ACCOUNTANT)),
    company_id: int = Depends(get_active_company_id),
):
    """Link an existing financial item to a calculation. Calculation must belong to current company."""
    _ensure_calculation_belongs_to_company(db, calculation_id, company_id)
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
    membership=Depends(require_company_roles(CompanyRole.ACCOUNTANT)),
    company_id: int = Depends(get_active_company_id),
):
    """Remove a financial item from a calculation. Calculation must belong to current company."""
    _ensure_calculation_belongs_to_company(db, calculation_id, company_id)
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
    membership=Depends(require_company_roles(CompanyRole.ACCOUNTANT)),
    company_id: int = Depends(get_active_company_id),
):
    """Create a revision (clone) of a finalized calculation. Calculation must belong to current company."""
    _ensure_calculation_belongs_to_company(db, calculation_id, company_id)
    try:
        service = ZakatService(db, rule_engine)
        new_calculation = service.create_revision(calculation_id)
        db.commit()
        return service.get_calculation_with_rules(new_calculation.id)
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))
