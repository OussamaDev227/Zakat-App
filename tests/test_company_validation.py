"""Unit tests for company validation: fiscal year start < end."""
import pytest
from datetime import date
from pydantic import ValidationError

from app.schemas.company import CompanyCreate, CompanyUpdate
from app.models.company import LegalType


def test_company_create_valid_fiscal_year():
    """Valid: start before end."""
    data = CompanyCreate(
        name="Test Co",
        legal_type=LegalType.LLC,
        fiscal_year_start=date(2024, 1, 1),
        fiscal_year_end=date(2024, 12, 31),
    )
    assert data.fiscal_year_start < data.fiscal_year_end


def test_company_create_invalid_fiscal_year_same_date():
    """Invalid: start equals end."""
    with pytest.raises(ValidationError) as exc_info:
        CompanyCreate(
            name="Test Co",
            legal_type=LegalType.LLC,
            fiscal_year_start=date(2024, 6, 1),
            fiscal_year_end=date(2024, 6, 1),
        )
    assert "fiscal_year" in str(exc_info.value).lower() or "start" in str(exc_info.value).lower()


def test_company_create_invalid_fiscal_year_end_before_start():
    """Invalid: end before start."""
    with pytest.raises(ValidationError) as exc_info:
        CompanyCreate(
            name="Test Co",
            legal_type=LegalType.LLC,
            fiscal_year_start=date(2024, 12, 31),
            fiscal_year_end=date(2024, 1, 1),
        )
    assert "fiscal_year" in str(exc_info.value).lower() or "start" in str(exc_info.value).lower()


def test_company_update_valid_fiscal_year():
    """Valid: start before end on update."""
    data = CompanyUpdate(
        name="Test Co",
        legal_type=LegalType.SOLE_PROPRIETORSHIP,
        fiscal_year_start=date(2023, 7, 1),
        fiscal_year_end=date(2024, 6, 30),
    )
    assert data.fiscal_year_start < data.fiscal_year_end


def test_company_update_invalid_fiscal_year():
    """Invalid: start >= end on update."""
    with pytest.raises(ValidationError):
        CompanyUpdate(
            name="Test Co",
            legal_type=LegalType.LLC,
            fiscal_year_start=date(2024, 12, 1),
            fiscal_year_end=date(2024, 11, 1),
        )
