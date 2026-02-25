"""Unit tests for financial item schema: amount validation (no negative unless allowed)."""
import pytest
from decimal import Decimal
from pydantic import ValidationError

from app.schemas.financial_item import FinancialItemCreate, FinancialItemUpdate
from app.models.financial_item import ItemCategory


def test_financial_item_create_amount_non_negative():
    """Amount must be >= 0 by default."""
    data = FinancialItemCreate(
        company_id=1,
        name="Cash",
        category=ItemCategory.ASSET,
        asset_type="CASH",
        amount=Decimal("100.00"),
    )
    assert data.amount >= 0


def test_financial_item_create_amount_zero():
    """Amount can be zero."""
    data = FinancialItemCreate(
        company_id=1,
        name="Cash",
        category=ItemCategory.ASSET,
        asset_type="CASH",
        amount=Decimal("0"),
    )
    assert data.amount == 0


def test_financial_item_create_amount_negative_rejected():
    """Negative amount is rejected by schema."""
    with pytest.raises(ValidationError):
        FinancialItemCreate(
            company_id=1,
            name="Cash",
            category=ItemCategory.ASSET,
            asset_type="CASH",
            amount=Decimal("-50.00"),
        )


def test_financial_item_update_amount_non_negative():
    """Update schema also enforces amount >= 0."""
    data = FinancialItemUpdate(
        name="Cash",
        category=ItemCategory.ASSET,
        asset_type="CASH",
        amount=Decimal("200.00"),
    )
    assert data.amount >= 0


def test_financial_item_update_amount_negative_rejected():
    """Update with negative amount is rejected."""
    with pytest.raises(ValidationError):
        FinancialItemUpdate(
            name="Cash",
            category=ItemCategory.ASSET,
            asset_type="CASH",
            amount=Decimal("-10.00"),
        )
