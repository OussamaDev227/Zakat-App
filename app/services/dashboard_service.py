"""Dashboard data aggregation service."""
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.user import User
from app.models.zakat_calculation import CalculationStatus, ZakatCalculation
from app.schemas.dashboard import (
    AdminDashboardResponse,
    DashboardCalculationItem,
    DashboardStatusBreakdown,
    DashboardUserItem,
    OwnerDashboardCompanySummary,
    OwnerDashboardResponse,
)


class DashboardService:
    """Builds dashboard payloads for admin and owner roles."""

    def __init__(self, db: Session):
        self.db = db

    def get_admin_dashboard(self) -> AdminDashboardResponse:
        users_total = self.db.query(func.count(User.id)).scalar() or 0
        users_active = (
            self.db.query(func.count(User.id))
            .filter(User.is_active.is_(True))
            .scalar()
            or 0
        )
        users_inactive = users_total - users_active

        companies_total = self.db.query(func.count(Company.id)).scalar() or 0
        calculations_total = self.db.query(func.count(ZakatCalculation.id)).scalar() or 0

        draft_count = (
            self.db.query(func.count(ZakatCalculation.id))
            .filter(ZakatCalculation.status == CalculationStatus.DRAFT)
            .scalar()
            or 0
        )
        finalized_count = (
            self.db.query(func.count(ZakatCalculation.id))
            .filter(ZakatCalculation.status == CalculationStatus.FINALIZED)
            .scalar()
            or 0
        )

        recent_users_rows = (
            self.db.query(User)
            .order_by(User.id.desc())
            .limit(5)
            .all()
        )
        recent_calculation_rows = (
            self.db.query(ZakatCalculation)
            .order_by(ZakatCalculation.created_at.desc())
            .limit(5)
            .all()
        )

        return AdminDashboardResponse(
            users_total=users_total,
            users_active=users_active,
            users_inactive=users_inactive,
            companies_total=companies_total,
            calculations_total=calculations_total,
            status_breakdown=DashboardStatusBreakdown(
                draft=draft_count,
                finalized=finalized_count,
            ),
            recent_users=[
                DashboardUserItem(
                    user_id=user.id,
                    name=user.name,
                    email=user.email,
                    system_role=getattr(user.system_role, "value", str(user.system_role)),
                    is_active=bool(user.is_active),
                )
                for user in recent_users_rows
            ],
            recent_calculations=[
                DashboardCalculationItem(
                    calculation_id=calc.id,
                    company_id=calc.company_id,
                    status=getattr(calc.status, "value", str(calc.status)),
                    zakat_amount=calc.zakat_amount,
                    created_at=calc.created_at,
                    calculation_date=calc.calculation_date,
                )
                for calc in recent_calculation_rows
            ],
        )

    def get_owner_dashboard(self, company_id: int) -> OwnerDashboardResponse:
        company = self.db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise ValueError("Company not found.")

        calculations_total = (
            self.db.query(func.count(ZakatCalculation.id))
            .filter(ZakatCalculation.company_id == company_id)
            .scalar()
            or 0
        )

        draft_count = (
            self.db.query(func.count(ZakatCalculation.id))
            .filter(
                ZakatCalculation.company_id == company_id,
                ZakatCalculation.status == CalculationStatus.DRAFT,
            )
            .scalar()
            or 0
        )
        finalized_count = (
            self.db.query(func.count(ZakatCalculation.id))
            .filter(
                ZakatCalculation.company_id == company_id,
                ZakatCalculation.status == CalculationStatus.FINALIZED,
            )
            .scalar()
            or 0
        )

        latest_finalized = (
            self.db.query(ZakatCalculation)
            .filter(
                ZakatCalculation.company_id == company_id,
                ZakatCalculation.status == CalculationStatus.FINALIZED,
            )
            .order_by(ZakatCalculation.calculation_date.desc(), ZakatCalculation.id.desc())
            .first()
        )

        recent_calculation_rows = (
            self.db.query(ZakatCalculation)
            .filter(ZakatCalculation.company_id == company_id)
            .order_by(ZakatCalculation.created_at.desc())
            .limit(5)
            .all()
        )

        return OwnerDashboardResponse(
            company=OwnerDashboardCompanySummary(
                id=company.id,
                name=company.name,
                legal_type=getattr(company.legal_type, "value", str(company.legal_type)),
                fiscal_year_start=company.fiscal_year_start,
                fiscal_year_end=company.fiscal_year_end,
            ),
            calculations_total=calculations_total,
            status_breakdown=DashboardStatusBreakdown(
                draft=draft_count,
                finalized=finalized_count,
            ),
            has_active_draft=draft_count > 0,
            latest_finalized_zakat_amount=(
                latest_finalized.zakat_amount if latest_finalized else None
            ),
            recent_calculations=[
                DashboardCalculationItem(
                    calculation_id=calc.id,
                    company_id=calc.company_id,
                    status=getattr(calc.status, "value", str(calc.status)),
                    zakat_amount=calc.zakat_amount,
                    created_at=calc.created_at,
                    calculation_date=calc.calculation_date,
                )
                for calc in recent_calculation_rows
            ],
        )
