"""User management schemas."""
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.user import SystemRole
from app.models.user_company import CompanyRole


class UserCreateRequest(BaseModel):
    """Payload for creating a new user."""

    name: str = Field(min_length=1, max_length=255)
    email: str
    password: str = Field(min_length=6, max_length=255)
    system_role: SystemRole = SystemRole.USER


class UserCompanyMembershipResponse(BaseModel):
    """Membership details for a user-company relation."""

    company_id: int
    role: CompanyRole


class UserResponse(BaseModel):
    """Safe user representation (never includes password hash)."""

    id: int
    name: str
    email: str
    system_role: SystemRole
    is_active: bool
    memberships: Optional[List[UserCompanyMembershipResponse]] = None


class UserListResponse(BaseModel):
    """List wrapper for users."""

    items: List[UserResponse]


class CompanyUserAssignRequest(BaseModel):
    """Payload to assign a user to a company with a company-scoped role."""

    user_id: int
    role: CompanyRole


class CompanyUserMembershipResponse(BaseModel):
    """Response body for company membership assignment."""

    user_id: int
    company_id: int
    role: CompanyRole


class UserStatusUpdateRequest(BaseModel):
    """Payload for changing user active status."""

    is_active: bool
