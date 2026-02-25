"""Pytest fixtures for API and validation tests."""
import pytest
from datetime import date
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.company import CompanyCreate, CompanyUpdate
from app.models.company import LegalType


@pytest.fixture
def client():
    """Test client (no DB; use for schema/validation-only tests)."""
    return TestClient(app)
