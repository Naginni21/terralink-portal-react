"""Application token endpoints for sub-app authentication."""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from ...db.base import get_db
from ...core.config import settings
from ...services.auth import AuthService
from ...schemas.auth import AppTokenRequest, AppTokenResponse, ValidateAppTokenRequest, UserResponse
from .session import get_current_session
from ...models import Session

router = APIRouter()


@router.post("/app-token", response_model=AppTokenResponse)
async def create_app_token(
    request: Request,
    token_data: AppTokenRequest,
    session: Session = Depends(get_current_session)
):
    """
    Create a JWT token for sub-application authentication.

    - Validates current session
    - Validates CSRF token (if provided)
    - Creates a JWT token with user info and app details
    """
    # Optional CSRF validation
    if token_data.csrfToken and token_data.csrfToken != session.csrf_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid CSRF token"
        )

    # Create app token
    token = AuthService.create_app_token(
        session.user,
        token_data.appId,
        token_data.appName
    )

    return AppTokenResponse(
        token=token,
        expiresIn=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/validate-app-token")
async def validate_app_token(
    token_data: ValidateAppTokenRequest
):
    """
    Validate and decode an application JWT token.

    Returns the token payload if valid.
    """
    # Validate and decode token
    payload = AuthService.validate_app_token(token_data.token)

    return {
        "valid": True,
        "user": {
            "id": payload["sub"],
            "email": payload["email"],
            "name": payload["name"],
            "role": payload["role"]
        },
        "app": {
            "id": payload.get("app_id"),
            "name": payload.get("app_name")
        },
        "exp": payload["exp"]
    }