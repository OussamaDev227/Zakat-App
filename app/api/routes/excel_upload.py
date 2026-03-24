"""Excel upload endpoints for financial statement ingestion."""
import os
import tempfile
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.excel_upload import ExcelUploadResponse
from app.models.company import Company
from app.services.excel_ingestion_service import ExcelIngestionService
from app.rules.engine import RuleEngine
from app.core.security import get_active_company_id, require_company_roles
from app.models.user_company import CompanyRole

router = APIRouter()


def get_rule_engine(request: Request) -> RuleEngine:
    """Dependency to get rule engine from app state."""
    return request.app.state.rule_engine


@router.post("/excel/upload", response_model=ExcelUploadResponse)
async def upload_excel_file(
    file: UploadFile = File(..., description="Excel file (.xlsx) with financial statement data"),
    db: Session = Depends(get_db),
    rule_engine: RuleEngine = Depends(get_rule_engine),
    membership=Depends(require_company_roles(CompanyRole.ACCOUNTANT)),
    company_id: int = Depends(get_active_company_id),
):
    """
    Upload and process Excel file containing financial statement items.
    Company is taken from session only.
    
    Expected columns in Excel file:
    - item_name (required): Name of the financial item
    - category (required): Category (Cash, Inventory, Receivable, Liability, Long-term Loan, Capital, Retained Earnings)
    - amount (required): Numeric amount
    - notes (optional): Additional notes or description
    
    The endpoint will:
    1. Parse all rows from the Excel file
    2. Classify each item according to the zakat ruleset
    3. Create financial items in the database
    4. Automatically create a DRAFT calculation
    5. Calculate zakat base and zakat due
    6. Return structured results with import statistics
    
    Fiqh-accounting compliance:
    - Equity items are excluded from calculation (never added, never deducted)
    - Long-term liabilities are not deducted from zakat base
    - Only zakatable assets minus short-term liabilities = zakat base
    - Zakat rate: 2.5% (0.025) from ruleset
    """
    # Validate company exists
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail=f"Company {company_id} not found")
    
    # Validate file extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="File name is required")
    
    if not file.filename.lower().endswith('.xlsx'):
        raise HTTPException(
            status_code=400,
            detail="Only .xlsx files are supported. Please upload an Excel file with .xlsx extension."
        )
    
    # Save uploaded file temporarily
    temp_file_path = None
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as temp_file:
            temp_file_path = temp_file.name
            # Read uploaded file content
            content = await file.read()
            temp_file.write(content)
            temp_file.flush()
        
        # Process Excel file
        ingestion_service = ExcelIngestionService(db, rule_engine)
        result = ingestion_service.ingest_excel_file(company_id, temp_file_path)
        
        # Commit transaction
        db.commit()
        
        # Convert to response schema
        return ExcelUploadResponse(**result)
        
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing Excel file: {str(e)}")
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception:
                pass  # Ignore cleanup errors
