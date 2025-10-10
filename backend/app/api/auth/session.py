"""Session management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import logging

from ...db.base import get_db
from ...core.config import settings
from ...services.auth import AuthService
from ...schemas.auth import SessionResponse, UserResponse
from ...models import Session

router = APIRouter()
logger = logging.getLogger(__name__)


async def get_current_session(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Session:
    """Dependency to get current session from cookie or Authorization header."""
    # Log incoming request details
    logger.info(f"Session validation request from: {request.client.host if request.client else 'unknown'}")
    logger.info(f"Request headers: Origin={request.headers.get('origin')}, Referer={request.headers.get('referer')}")
    logger.info(f"Cookie header present: {bool(request.headers.get('cookie'))}")
    logger.info(f"Cookies: {list(request.cookies.keys())}")

    # Try to get session from Authorization header first (for cross-domain)
    auth_header = request.headers.get("Authorization")
    session_id = None

    if auth_header and auth_header.startswith("Bearer "):
        session_id = auth_header.replace("Bearer ", "")
        logger.info(f"Session ID from Authorization header: {session_id[:10]}...")
    else:
        # Fallback to cookie (for same-domain)
        cookie_value = request.cookies.get(settings.COOKIE_NAME)
        if cookie_value:
            session_id = cookie_value
            logger.info(f"Session ID from cookie '{settings.COOKIE_NAME}': {session_id[:10]}...")
        else:
            logger.warning(f"Cookie '{settings.COOKIE_NAME}' not found in request")

    if not session_id:
        logger.error("No session ID found in Authorization header or cookie")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    # Validate session
    logger.info(f"Validating session: {session_id[:10]}...")
    session = await AuthService.validate_session(db, session_id)

    if not session:
        logger.error(f"Session validation failed for: {session_id[:10]}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session"
        )

    logger.info(f"Session valid for user: {session.user.email}")
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