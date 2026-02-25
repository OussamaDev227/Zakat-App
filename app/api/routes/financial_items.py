"""Financial items management endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
import sqlalchemy as sa

from app.db.session import get_db
from app.schemas.financial_item import (
    FinancialItemCreate,
    FinancialItemUpdate,
    FinancialItemResponse,
    FinancialItemListResponse
)
from app.models.financial_item import FinancialItem, ItemCategory, AssetType
from app.models.company import Company
from app.rules.engine import RuleEngine
from app.validators.financial_item_validators import find_duplicate_financial_items
from app.core.security import get_current_company_id

router = APIRouter()


def get_rule_engine(request: Request) -> RuleEngine:
    """Dependency to get rule engine from app state."""
    return request.app.state.rule_engine


@router.post("", response_model=FinancialItemResponse, status_code=201)
async def create_financial_item(
    item_data: FinancialItemCreate,
    db: Session = Depends(get_db),
    rule_engine: RuleEngine = Depends(get_rule_engine),
    company_id: int = Depends(get_current_company_id),
):
    """Create a new financial item with rule code validation. Company is taken from session only."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    if company.fiscal_year_start >= company.fiscal_year_end:
        raise HTTPException(
            status_code=400,
            detail="Company has invalid fiscal year (start must be before end). Please correct the company settings first."
        )

    # Duplicate detection: exact, normalized, and fuzzy
    dup = find_duplicate_financial_items(db, company_id, item_data.name, exclude_item_id=None)
    if dup.is_duplicate:
        raise HTTPException(status_code=409, detail=dup.to_http_detail())

    # Validate rule codes
    if item_data.category == ItemCategory.ASSET:
        if not item_data.asset_type:
            raise HTTPException(status_code=422, detail="asset_type is required for ASSET category")
        if not rule_engine.is_valid_asset_type(item_data.asset_type):
            raise HTTPException(status_code=422, detail=f"Invalid asset_type: {item_data.asset_type}")
    elif item_data.category == ItemCategory.LIABILITY:
        if not item_data.liability_code:
            raise HTTPException(status_code=422, detail="liability_code is required for LIABILITY category")
        if not rule_engine.is_valid_liability_code(item_data.liability_code):
            raise HTTPException(status_code=422, detail=f"Invalid liability_code: {item_data.liability_code}")
    elif item_data.category == ItemCategory.EQUITY:
        if not item_data.equity_code:
            raise HTTPException(status_code=422, detail="equity_code is required for EQUITY category")
        if not rule_engine.is_valid_equity_code(item_data.equity_code):
            raise HTTPException(status_code=422, detail=f"Invalid equity_code: {item_data.equity_code}")
    
    # Map metadata to item_metadata for database
    item_dict = item_data.model_dump()
    item_dict['item_metadata'] = item_dict.pop('metadata', {})
    
    # #region agent log
    import json
    import time
    try:
        log_entry = {
            "location": "financial_items.py:create_financial_item:before_create",
            "message": "About to create FinancialItem",
            "data": {
                "category": item_dict.get('category'),
                "asset_type": str(item_dict.get('asset_type')) if item_dict.get('asset_type') else None,
                "liability_code": item_dict.get('liability_code'),
                "item_dict_keys": list(item_dict.keys()),
            },
            "timestamp": int(time.time() * 1000),
            "sessionId": "debug-session",
            "runId": "run1",
            "hypothesisId": "H1"
        }
        with open(r"c:\Users\user\OneDrive\Desktop\Zakat App\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception:
        pass
    # #endregion
    
    # Ensure category-specific code consistency (database constraint)
    if item_dict.get('category') == ItemCategory.LIABILITY:
        item_dict['asset_type'] = None
        item_dict['equity_code'] = None
    elif item_dict.get('category') == ItemCategory.EQUITY:
        item_dict['asset_type'] = None
        item_dict['liability_code'] = None
    elif item_dict.get('category') == ItemCategory.ASSET:
        item_dict['liability_code'] = None
        item_dict['equity_code'] = None
    
    # #region agent log
    try:
        log_entry = {
            "location": "financial_items.py:create_financial_item:after_liability_fix",
            "message": "After setting asset_type to None for LIABILITY",
            "data": {
                "category": item_dict.get('category'),
                "asset_type": str(item_dict.get('asset_type')) if item_dict.get('asset_type') else None,
                "liability_code": item_dict.get('liability_code'),
            },
            "timestamp": int(time.time() * 1000),
            "sessionId": "debug-session",
            "runId": "run1",
            "hypothesisId": "H1"
        }
        with open(r"c:\Users\user\OneDrive\Desktop\Zakat App\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception:
        pass
    # #endregion
    
    item_dict["company_id"] = company_id
    item = FinancialItem(**item_dict)
    db.add(item)
    
    # #region agent log
    try:
        log_entry = {
            "location": "financial_items.py:create_financial_item:before_commit",
            "message": "About to commit to database",
            "data": {
                "category": item.category.value if hasattr(item.category, 'value') else str(item.category),
                "asset_type": str(item.asset_type) if item.asset_type else None,
                "liability_code": item.liability_code,
            },
            "timestamp": int(time.time() * 1000),
            "sessionId": "debug-session",
            "runId": "run1",
            "hypothesisId": "H1"
        }
        with open(r"c:\Users\user\OneDrive\Desktop\Zakat App\.cursor\debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception:
        pass
    # #endregion
    
    db.commit()
    db.refresh(item)
    
    # Map item_metadata back to metadata for response
    return FinancialItemResponse.from_orm_with_metadata(item)


@router.get("", response_model=FinancialItemListResponse)
async def list_financial_items(
    category: Optional[ItemCategory] = Query(None, description="Filter by category (optional)"),
    db: Session = Depends(get_db),
    company_id: int = Depends(get_current_company_id),
):
    """List financial items for the current company (from session). Optionally filtered by category."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    query = db.query(FinancialItem).filter(FinancialItem.company_id == company_id)
    
    if category:
        query = query.filter(FinancialItem.category == category)
    
    items = query.all()
    return FinancialItemListResponse(items=[FinancialItemResponse.from_orm_with_metadata(item) for item in items])


@router.get("/{item_id}", response_model=FinancialItemResponse)
async def get_financial_item(
    item_id: int,
    db: Session = Depends(get_db),
    company_id: int = Depends(get_current_company_id),
):
    """Get a financial item by ID. Only if it belongs to the current company."""
    item = db.query(FinancialItem).filter(FinancialItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Financial item not found")
    if item.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied to this item")
    return FinancialItemResponse.from_orm_with_metadata(item)


@router.put("/{item_id}", response_model=FinancialItemResponse)
async def update_financial_item(
    item_id: int,
    item_data: FinancialItemUpdate,
    db: Session = Depends(get_db),
    rule_engine: RuleEngine = Depends(get_rule_engine),
    company_id: int = Depends(get_current_company_id),
):
    """Update a financial item with rule code validation. Only if it belongs to the current company."""
    item = db.query(FinancialItem).filter(FinancialItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Financial item not found")
    if item.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied to this item")

    # Ensure company has valid fiscal year
    company = db.query(Company).filter(Company.id == item.company_id).first()
    if company and company.fiscal_year_start >= company.fiscal_year_end:
        raise HTTPException(
            status_code=400,
            detail="Company has invalid fiscal year (start must be before end). Please correct the company settings first."
        )

    # Duplicate detection when name changes (exclude current item)
    dup = find_duplicate_financial_items(db, item.company_id, item_data.name, exclude_item_id=item_id)
    if dup.is_duplicate:
        raise HTTPException(status_code=409, detail=dup.to_http_detail())

    # Validate rule codes
    if item_data.category == ItemCategory.ASSET:
        if not item_data.asset_type:
            raise HTTPException(status_code=422, detail="asset_type is required for ASSET category")
        if not rule_engine.is_valid_asset_type(item_data.asset_type):
            raise HTTPException(status_code=422, detail=f"Invalid asset_type: {item_data.asset_type}")
    elif item_data.category == ItemCategory.LIABILITY:
        if not item_data.liability_code:
            raise HTTPException(status_code=422, detail="liability_code is required for LIABILITY category")
        if not rule_engine.is_valid_liability_code(item_data.liability_code):
            raise HTTPException(status_code=422, detail=f"Invalid liability_code: {item_data.liability_code}")
    elif item_data.category == ItemCategory.EQUITY:
        if not item_data.equity_code:
            raise HTTPException(status_code=422, detail="equity_code is required for EQUITY category")
        if not rule_engine.is_valid_equity_code(item_data.equity_code):
            raise HTTPException(status_code=422, detail=f"Invalid equity_code: {item_data.equity_code}")
    
    # Update fields (map metadata to item_metadata)
    update_dict = item_data.model_dump()
    update_dict['item_metadata'] = update_dict.pop('metadata', {})
    
    # Ensure category-specific code consistency
    if update_dict.get('category') == ItemCategory.LIABILITY:
        update_dict['asset_type'] = None
        update_dict['equity_code'] = None
    elif update_dict.get('category') == ItemCategory.EQUITY:
        update_dict['asset_type'] = None
        update_dict['liability_code'] = None
    elif update_dict.get('category') == ItemCategory.ASSET:
        update_dict['liability_code'] = None
        update_dict['equity_code'] = None
    
    for field, value in update_dict.items():
        setattr(item, field, value)
    
    db.commit()
    db.refresh(item)
    return FinancialItemResponse.from_orm_with_metadata(item)


@router.delete("/{item_id}", status_code=204)
async def delete_financial_item(
    item_id: int,
    db: Session = Depends(get_db),
    company_id: int = Depends(get_current_company_id),
):
    """Delete a financial item. Only if it belongs to the current company."""
    item = db.query(FinancialItem).filter(FinancialItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Financial item not found")
    if item.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied to this item")
    db.delete(item)
    db.commit()
    return None
