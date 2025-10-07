"""Google OAuth callback endpoint."""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Form
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from ...db.base import get_db
from ...core.config import settings
from ...services.auth import AuthService
from ...schemas.auth import AuthResponse, UserResponse

router = APIRouter()


@router.post("/google-callback")
async def google_callback(
    request: Request,
    response: Response,
    credential: str = Form(...),
    g_csrf_token: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Handle Google OAuth callback with credential.

    This endpoint receives the credential from Google Sign-In redirect flow.
    """
    import logging
    logger = logging.getLogger(__name__)

    try:
        # Verify Google token
        logger.info(f"Received OAuth callback, verifying token...")
        user_info = await AuthService.verify_google_token(credential)
        logger.info(f"Token verified for user: {user_info.get('email')}")

        # Check email verification
        if not user_info.get("email_verified"):
            logger.warning(f"Email not verified: {user_info.get('email')}")
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/signin?error=email_not_verified",
                status_code=status.HTTP_302_FOUND
            )

        # Check allowed domains
        email = user_info["email"].lower()
        if not settings.is_domain_allowed(email):
            logger.warning(f"Domain not allowed: {email}")
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/signin?error=domain_not_allowed",
                status_code=status.HTTP_302_FOUND
            )

        logger.info(f"Creating/updating user for: {email}")

        # Create or update user
        user = await AuthService.create_or_update_user(db, user_info)

        # Get client info
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")

        # Create session
        session, session_id = await AuthService.create_session(
            db, user, ip_address, user_agent
        )

        # Create redirect response to frontend with token in URL
        # For cross-domain compatibility, pass session_id as URL parameter
        redirect_url = f"{settings.FRONTEND_URL}?token={session_id}"
        redirect_response = RedirectResponse(
            url=redirect_url,
            status_code=status.HTTP_302_FOUND
        )

        logger.info(f"Redirecting to frontend with session token")
        return redirect_response

    except Exception as e:
        # Log the error for debugging
        logger.error(f"Google callback error: {e}", exc_info=True)

        # Redirect with error
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/signin?error=authentication_failed",
            status_code=status.HTTP_302_FOUND
        )