"""Authentication API router."""

from fastapi import APIRouter

from .google_signin import router as google_signin_router
from .google_callback import router as google_callback_router
from .session import router as session_router
from .logout import router as logout_router
from .app_token import router as app_token_router

# Create auth router
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])

# Include all auth routes
auth_router.include_router(google_signin_router)
auth_router.include_router(google_callback_router)
auth_router.include_router(session_router)
auth_router.include_router(logout_router)
auth_router.include_router(app_token_router)