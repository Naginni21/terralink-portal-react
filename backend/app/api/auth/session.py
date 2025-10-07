"""Session management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from ...db.base import get_db
from ...core.config import settings
from ...services.auth import AuthService
from ...schemas.auth import SessionResponse, UserResponse
from ...models import Session

router = APIRouter()


async def get_current_session(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Session:
    """Dependency to get current session from cookie."""
    # Extract session cookie
    session_id = request.cookies.get(settings.COOKIE_NAME)

    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    # Validate session
    session = await AuthService.validate_session(db, session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session"
        )

    return session


@router.get("/session", response_model=SessionResponse)
async def get_session(
    session: Session = Depends(get_current_session)
):
    """
    Get current session information.

    Returns user data and CSRF token if session is valid.
    """
    return SessionResponse(
        authenticated=True,  # Explicitly set for frontend compatibility
        user=UserResponse.model_validate(session.user),
        csrfToken=session.csrf_token,
        expiresAt=session.expires_at
    )