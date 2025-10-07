"""Authentication schemas for request/response validation."""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

from ..models.user import UserRole


class GoogleSignInRequest(BaseModel):
    """Request schema for Google Sign-In."""

    credential: str = Field(..., description="Google ID token from client")


class UserResponse(BaseModel):
    """User information response schema."""

    id: str
    email: EmailStr
    name: str
    role: UserRole
    picture: Optional[str] = None

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Authentication response schema."""

    success: bool = True
    user: UserResponse
    csrfToken: str = Field(..., description="CSRF token for session")


class SessionResponse(BaseModel):
    """Session response schema."""

    authenticated: bool = True  # Frontend expects this field
    user: UserResponse
    csrfToken: str
    expiresAt: datetime

    class Config:
        from_attributes = True


class LogoutRequest(BaseModel):
    """Request schema for logout."""

    csrfToken: Optional[str] = Field(None, description="CSRF token for validation")


class AppTokenRequest(BaseModel):
    """Request schema for app token generation."""

    appId: str = Field(..., description="Application ID")
    appName: str = Field(..., description="Application name")
    csrfToken: Optional[str] = Field(None, description="CSRF token for validation")


class AppTokenResponse(BaseModel):
    """Response schema for app token."""

    token: str = Field(..., description="JWT token for sub-application")
    expiresIn: int = Field(..., description="Token expiration time in seconds")


class ValidateAppTokenRequest(BaseModel):
    """Request schema for app token validation."""

    token: str = Field(..., description="JWT token to validate")