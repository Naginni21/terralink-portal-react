"""Activity tracking schemas for request/response validation."""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class TrackActivityRequest(BaseModel):
    """Request schema for tracking activity."""

    appId: str = Field(..., description="Application ID")
    appName: str = Field(..., description="Application name")
    action: str = Field(..., description="Action performed")
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="Additional metadata")


class ActivityResponse(BaseModel):
    """Response schema for activity tracking."""

    success: bool = True
    activity: dict


class ActivityInfo(BaseModel):
    """Activity information schema."""

    id: str
    userEmail: str
    appId: str
    appName: str
    action: str
    metadata: Dict[str, Any]
    timestamp: datetime
    userRole: str
    userDomain: str

    class Config:
        from_attributes = True


class ActivitiesListResponse(BaseModel):
    """Response schema for activities list."""

    activities: List[ActivityInfo]
    total: int
    user: str