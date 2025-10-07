"""Google Sign-In endpoint."""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from ...db.base import get_db
from ...core.config import settings
from ...services.auth import AuthService
from ...schemas.auth import GoogleSignInRequest, AuthResponse, UserResponse

router = APIRouter()


@router.post("/google-signin", response_model=AuthResponse)
async def google_signin(
    request: Request,
    response: Response,
    signin_data: GoogleSignInRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user with Google ID token.

    - Verifies the Google ID token
    - Creates or updates user in database
    - Creates a new session
    - Sets session cookie
    """
    # Verify Google token
    user_info = await AuthService.verify_google_token(signin_data.credential)

    # Check email verification
    if not user_info.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified"
        )

    # Check allowed domains
    email = user_info["email"].lower()
    if not settings.is_domain_allowed(email):
        domain = email.split("@")[1] if "@" in email else "unknown"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied - domain '{domain}' not allowed"
        )

    # Create or update user
    user = await AuthService.create_or_update_user(db, user_info)

    # Get client info
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    # Create session
    session, session_id = await AuthService.create_session(
        db, user, ip_address, user_agent
    )

    # Set session cookie
    cookie_settings = settings.cookie_settings.copy()
    cookie_settings.pop("key")  # Remove key from settings

    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=session_id,
        **cookie_settings
    )

    # Return user data and CSRF token
    return AuthResponse(
        success=True,
        user=UserResponse.model_validate(user),
        csrfToken=session.csrf_token
    )