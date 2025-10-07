"""Activity tracking API router."""

from fastapi import APIRouter

from .track import router as track_router

# Create activity router
activity_router = APIRouter(prefix="/activity", tags=["Activity"])

# Include activity routes
activity_router.include_router(track_router)