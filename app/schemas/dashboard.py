"""Dashboard response schemas."""
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class DashboardStatusBreakdown(BaseModel):
    """Breakdown of calculation statuses."""

    draft: int
    finalized: int


class DashboardCalculationItem(BaseModel):
    """Light calculation item for dashboard lists."""

    calculation_id: int
    company_id: int
    status: str
    zakat_amount: Decimal
    created_at: datetime
    calculation_date: datetime | None = None


class DashboardUserItem(BaseModel):
    """Light user item for dashboard lists."""

    user_id: int
    name: str
    email: str
    system_role: str
    is_active: bool


class AdminDashboardResponse(BaseModel):
    """Platform-wide dashboard for system admins."""

    users_total: int
    users_active: int
    users_inactive: int
    companies_total: int
    calculations_total: int
    status_breakdown: DashboardStatusBreakdown
    recent_users: list[DashboardUserItem]
    recent_calculations: list[DashboardCalculationItem]
    direction: str = "rtl"


class OwnerDashboardCompanySummary(BaseModel):
    """Current company information shown on owner dashboard."""

    id: int
    name: str
    legal_type: str
    fiscal_year_start: date
    fiscal_year_end: date


class OwnerDashboardResponse(BaseModel):
    """Company-scoped dashboard for owners."""

    company: OwnerDashboardCompanySummary
    calculations_total: int
    status_breakdown: DashboardStatusBreakdown
    has_active_draft: bool
    latest_finalized_zakat_amount: Decimal | None = None
    recent_calculations: list[DashboardCalculationItem]
    direction: str = "rtl"
