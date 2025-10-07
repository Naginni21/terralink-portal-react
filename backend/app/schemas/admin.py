"""Admin schemas for request/response validation."""

from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

from ..models.user import UserRole


class UserWithSessions(BaseModel):
    """User with sessions information."""

    email: EmailStr
    role: UserRole
    domain: str
    lastLogin: Optional[datetime] = None
    sessions: List[str] = []
    isActive: bool = False
    revokedAt: Optional[datetime] = None
    revokedBy: Optional[str] = None
    updatedAt: Optional[datetime] = None
    updatedBy: Optional[str] = None

    class Config:
        from_attributes = True


class UsersListResponse(BaseModel):
    """Response schema for users list."""

    users: List[UserWithSessions]
    total: int
    activeSessions: int


class UpdateUserRoleRequest(BaseModel):
    """Request schema for updating user role."""

    email: EmailStr
    role: UserRole


class UpdateUserRoleResponse(BaseModel):
    """Response schema for updated user role."""

    success: bool = True
    user: dict


class RevokeUserRequest(BaseModel):
    """Request schema for revoking user access."""

    email: EmailStr


class RevokeUserResponse(BaseModel):
    """Response schema for revoked user."""

    success: bool = True
    revokedSessions: int
    user: dict


class DomainInfo(BaseModel):
    """Domain information schema."""

    domain: str
    addedAt: datetime
    addedBy: str
    status: str = "active"
    userCount: int = 0


class DomainsListResponse(BaseModel):
    """Response schema for domains list."""

    domains: List[DomainInfo]
    total: int


class AddDomainRequest(BaseModel):
    """Request schema for adding domain."""

    domain: str = Field(..., pattern=r"^[a-z0-9]+([-.]a-z0-9]+)*\.[a-z]{2,}$")


class AddDomainResponse(BaseModel):
    """Response schema for added domain."""

    success: bool = True
    domain: DomainInfo


class RemoveDomainRequest(BaseModel):
    """Request schema for removing domain."""

    domain: str