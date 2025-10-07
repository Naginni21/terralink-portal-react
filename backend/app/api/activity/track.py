"""Activity tracking endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_, func
from typing import Optional
from datetime import datetime
import secrets

from ...db.base import get_db
from ...models import ActivityLog, UserRole
from ...schemas.activity import (
    TrackActivityRequest,
    ActivityResponse,
    ActivitiesListResponse,
    ActivityInfo
)
from ..auth.session import get_current_session
from ...models import Session as SessionModel

router = APIRouter()


@router.post("/track", response_model=ActivityResponse)
async def track_activity(
    activity_data: TrackActivityRequest,
    session: SessionModel = Depends(get_current_session),
    db: AsyncSession = Depends(get_db)
):
    """
    Track user activity in an application.

    Requires authenticated session.
    """
    # Generate activity ID
    activity_id = f"act_{int(datetime.utcnow().timestamp())}_{secrets.token_hex(4)}"

    # Create activity log
    activity = ActivityLog(
        id=activity_id,
        user_id=session.user.id,
        user_email=session.user.email,
        user_role=session.user.role.value,
        user_domain=session.user.domain,
        app_id=activity_data.appId,
        app_name=activity_data.appName,
        action=activity_data.action,
        action_metadata=activity_data.metadata or {},
        timestamp=datetime.utcnow()
    )

    db.add(activity)
    await db.commit()

    return ActivityResponse(
        success=True,
        activity={
            "id": activity.id,
            "timestamp": activity.timestamp.isoformat()
        }
    )


@router.get("/track", response_model=ActivitiesListResponse)
async def get_activities(
    email: Optional[str] = Query(None, description="Filter by user email (admin only)"),
    limit: int = Query(100, ge=1, le=1000, description="Number of activities to return"),
    session: SessionModel = Depends(get_current_session),
    db: AsyncSession = Depends(get_db)
):
    """
    Get activity logs.

    - Users can see their own activities
    - Admins can see all activities or filter by email
    """
    # Check permissions for viewing other users' activities
    if email and email != session.user.email and session.user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized to view other users' activities"
        )

    # Build query
    query = select(ActivityLog)

    # Apply filters
    if session.user.role == UserRole.ADMIN:
        # Admin can see all or filter by email
        if email:
            query = query.where(ActivityLog.user_email == email)
    else:
        # Non-admin can only see their own
        query = query.where(ActivityLog.user_email == session.user.email)

    # Order by timestamp (most recent first) and apply limit
    query = query.order_by(desc(ActivityLog.timestamp)).limit(limit)

    # Execute query
    result = await db.execute(query)
    activities = result.scalars().all()

    # Count total activities for this filter
    count_query = select(func.count(ActivityLog.id))
    if session.user.role == UserRole.ADMIN and email:
        count_query = count_query.where(ActivityLog.user_email == email)
    elif session.user.role != UserRole.ADMIN:
        count_query = count_query.where(ActivityLog.user_email == session.user.email)

    count_result = await db.execute(count_query)
    total_count = count_result.scalar() or 0

    # Build response
    activities_list = [
        ActivityInfo(
            id=activity.id,
            userEmail=activity.user_email,
            appId=activity.app_id,
            appName=activity.app_name,
            action=activity.action,
            metadata=activity.action_metadata or {},
            timestamp=activity.timestamp,
            userRole=activity.user_role,
            userDomain=activity.user_domain
        )
        for activity in activities
    ]

    return ActivitiesListResponse(
        activities=activities_list,
        total=total_count,
        user=email or ("all" if session.user.role == UserRole.ADMIN and not email else session.user.email)
    )