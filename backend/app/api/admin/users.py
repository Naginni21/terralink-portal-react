"""Admin user management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List

from ...db.base import get_db
from ...models import User, Session, UserRole
from ...schemas.admin import (
    UsersListResponse,
    UserWithSessions,
    UpdateUserRoleRequest,
    UpdateUserRoleResponse,
    RevokeUserRequest,
    RevokeUserResponse
)
from ...services.auth import AuthService
from ..auth.session import get_current_session
from ...models import Session as SessionModel

router = APIRouter()


async def require_admin(session: SessionModel = Depends(get_current_session)) -> SessionModel:
    """Dependency to require admin role."""
    if session.user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return session


@router.get("/users", response_model=UsersListResponse)
async def get_users(
    db: AsyncSession = Depends(get_db),
    admin_session: SessionModel = Depends(require_admin)
):
    """
    Get all users with their session information.

    Admin only endpoint.
    """
    # Get all users with session count
    users_query = select(
        User,
        func.count(Session.id).label("session_count")
    ).outerjoin(
        Session, User.id == Session.user_id
    ).group_by(User.id)

    result = await db.execute(users_query)
    users_data = result.all()

    # Get active session IDs per user
    sessions_query = select(Session.id, Session.user_id).where(
        Session.expires_at > func.now()
    )
    sessions_result = await db.execute(sessions_query)
    active_sessions = sessions_result.all()

    # Build user sessions map
    user_sessions_map = {}
    for session_id, user_id in active_sessions:
        if user_id not in user_sessions_map:
            user_sessions_map[user_id] = []
        user_sessions_map[user_id].append(session_id)

    # Build response
    users_list = []
    for user, session_count in users_data:
        users_list.append(UserWithSessions(
            email=user.email,
            role=user.role,
            domain=user.domain,
            lastLogin=user.last_login,
            sessions=user_sessions_map.get(user.id, []),
            isActive=len(user_sessions_map.get(user.id, [])) > 0,
            revokedAt=user.revoked_at,
            revokedBy=user.revoked_by,
            updatedAt=user.updated_at,
            updatedBy=user.updated_by
        ))

    # Sort by last login (most recent first)
    users_list.sort(key=lambda x: x.lastLogin or "", reverse=True)

    return UsersListResponse(
        users=users_list,
        total=len(users_list),
        activeSessions=len(active_sessions)
    )


@router.put("/users", response_model=UpdateUserRoleResponse)
async def update_user_role(
    update_data: UpdateUserRoleRequest,
    db: AsyncSession = Depends(get_db),
    admin_session: SessionModel = Depends(require_admin)
):
    """
    Update a user's role.

    Admin only endpoint.
    """
    # Find user
    result = await db.execute(
        select(User).where(User.email == update_data.email)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update user role
    user.role = update_data.role
    user.updated_at = func.now()
    user.updated_by = admin_session.user.email

    await db.commit()

    return UpdateUserRoleResponse(
        success=True,
        user={
            "email": user.email,
            "role": user.role.value,
            "updatedAt": user.updated_at,
            "updatedBy": user.updated_by
        }
    )


@router.delete("/users", response_model=RevokeUserResponse)
async def revoke_user_access(
    revoke_data: RevokeUserRequest,
    db: AsyncSession = Depends(get_db),
    admin_session: SessionModel = Depends(require_admin)
):
    """
    Revoke a user's access by deleting all their sessions.

    Admin only endpoint.
    """
    # Don't allow admin to revoke their own access
    if revoke_data.email == admin_session.user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot revoke your own access"
        )

    # Find user
    result = await db.execute(
        select(User).where(User.email == revoke_data.email)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Delete all user sessions
    revoked_count = await AuthService.delete_user_sessions(db, revoke_data.email)

    # Mark user as revoked
    user.is_active = False
    user.revoked_at = func.now()
    user.revoked_by = admin_session.user.email

    await db.commit()

    return RevokeUserResponse(
        success=True,
        revokedSessions=revoked_count,
        user={
            "email": user.email,
            "revokedAt": user.revoked_at,
            "revokedBy": user.revoked_by
        }
    )