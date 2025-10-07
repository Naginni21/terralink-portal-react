"""Logout endpoint."""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from ...db.base import get_db
from ...core.config import settings
from ...services.auth import AuthService
from .session import get_current_session
from ...models import Session

router = APIRouter()


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    session: Session = Depends(get_current_session),
    db: AsyncSession = Depends(get_db)
):
    """
    Logout the current user.

    - Validates CSRF token (if provided in header)
    - Deletes the session
    - Clears the session cookie
    """
    # Optional CSRF validation
    csrf_token = request.headers.get("x-csrf-token")
    if csrf_token and csrf_token != session.csrf_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid CSRF token"
        )

    # Delete session
    await AuthService.delete_session(db, session.id)

    # Clear cookie
    response.delete_cookie(
        key=settings.COOKIE_NAME,
        domain=settings.COOKIE_DOMAIN,
        path="/"
    )

    return {"success": True, "message": "Logged out successfully"}