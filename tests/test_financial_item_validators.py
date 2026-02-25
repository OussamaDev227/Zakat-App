"""Unit tests for financial item validators: duplicate detection and name normalization."""
from unittest.mock import MagicMock
from sqlalchemy.orm import Session

from app.validators.financial_item_validators import (
    normalize_item_name,
    find_duplicate_financial_items,
    DuplicateCheckResult,
)
from app.models.financial_item import FinancialItem


def test_normalize_item_name_empty():
    assert normalize_item_name("") == ""
    assert normalize_item_name("   ") == ""


def test_normalize_item_name_lowercase():
    assert normalize_item_name("Cash") == "cash"
    assert normalize_item_name("CASH") == "cash"


def test_normalize_item_name_trim_and_collapse():
    assert normalize_item_name("  Cash  in  Bank  ") == "cash in bank"


def test_normalize_item_name_remove_symbols():
    assert normalize_item_name("Cash-in-Bank!") == "cashinbank"
    assert normalize_item_name("Receivables (Net)") == "receivables net"


def test_normalize_item_name_unicode():
    # Arabic / NFKC normalization
    assert isinstance(normalize_item_name("نقدية"), str)
    assert len(normalize_item_name("نقدية")) >= 1


def test_find_duplicate_empty_name():
    db = MagicMock(spec=Session)
    result = find_duplicate_financial_items(db, company_id=1, name="", exclude_item_id=None)
    assert result.is_duplicate is False
    assert result.exact_match_id is None


def test_find_duplicate_no_existing_items():
    db = MagicMock(spec=Session)
    chain = MagicMock()
    chain.filter.return_value = chain
    chain.all.return_value = []
    db.query.return_value.filter.return_value = chain
    result = find_duplicate_financial_items(db, company_id=1, name="Cash", exclude_item_id=None)
    assert result.is_duplicate is False


def test_find_duplicate_exact_match():
    existing = MagicMock(spec=FinancialItem)
    existing.id = 10
    existing.name = "Cash"
    existing.company_id = 1
    db = MagicMock(spec=Session)
    chain = MagicMock()
    chain.filter.return_value = chain
    chain.all.return_value = [existing]
    db.query.return_value.filter.return_value = chain
    result = find_duplicate_financial_items(db, company_id=1, name="Cash", exclude_item_id=None)
    assert result.is_duplicate is True
    assert result.exact_match_id == 10
    assert result.message is not None


def test_find_duplicate_exclude_item_id():
    existing = MagicMock(spec=FinancialItem)
    existing.id = 10
    existing.name = "Cash"
    existing.company_id = 1
    db = MagicMock(spec=Session)
    # First filter: by company_id. Second filter: id != exclude_item_id (excludes id=10).
    chain_after_first = MagicMock()
    chain_after_second = MagicMock()
    chain_after_second.all.return_value = []  # After excluding id=10, no rows left
    chain_after_first.filter.return_value = chain_after_second
    chain_after_first.all.return_value = [existing]
    db.query.return_value.filter.return_value = chain_after_first
    result = find_duplicate_financial_items(db, company_id=1, name="Cash", exclude_item_id=10)
    assert result.is_duplicate is False


def test_duplicate_check_result_to_http_detail():
    r = DuplicateCheckResult(
        is_duplicate=True,
        exact_match_id=5,
        normalized_match_id=None,
        similar_match_ids=None,
        message="Duplicate found",
    )
    d = r.to_http_detail()
    assert d["message"] == "Duplicate found"
    assert d["exact_match_id"] == 5
    assert "normalized_match_id" not in d or d.get("normalized_match_id") is None
