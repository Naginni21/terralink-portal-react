"""Admin API router."""

from fastapi import APIRouter

from .users import router as users_router
from .domains import router as domains_router

# Create admin router
admin_router = APIRouter(prefix="/admin", tags=["Admin"])

# Include all admin routes
admin_router.include_router(users_router)
admin_router.include_router(domains_router)