"""Authentication service for handling Google OAuth and sessions."""

import secrets
from datetime import datetime, timedelta
from typing import Optional, Tuple
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from jose import jwt, JWTError
from fastapi import HTTPException, status

from ..core.config import settings
from ..models import User, Session, UserRole
from ..schemas.auth import UserResponse


class AuthService:
    """Service for handling authentication operations."""

    @staticmethod
    async def verify_google_token(credential: str) -> dict:
        """Verify Google ID token and extract user info."""
        try:
            # Verify the token with Google
            idinfo = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )

            # Extract user information
            return {
                "id": idinfo["sub"],
                "email": idinfo.get("email", ""),
                "name": idinfo.get("name", ""),
                "picture": idinfo.get("picture", ""),
                "email_verified": idinfo.get("email_verified", False),
            }
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Google credential: {str(e)}"
            )

    @staticmethod
    async def create_or_update_user(
        db: AsyncSession,
        user_info: dict
    ) -> User:
        """Create or update user from Google info."""
        # Check if user exists
        result = await db.execute(
            select(User).where(User.id == user_info["id"])
        )
        user = result.scalar_one_or_none()

        # Determine user role
        email = user_info["email"].lower()
        role = UserRole.ADMIN if settings.is_admin(email) else UserRole.USUARIO

        if user:
            # Update existing user
            user.name = user_info["name"]
            user.picture = user_info.get("picture")
            user.last_login = datetime.utcnow()
            if user.role != role:
                user.role = role
        else:
            # Create new user
            user = User(
                id=user_info["id"],
                email=email,
                name=user_info["name"],
                role=role,
                picture=user_info.get("picture"),
                last_login=datetime.utcnow()
            )
            db.add(user)

        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def create_session(
        db: AsyncSession,
        user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Tuple[Session, str]:
        """Create a new session for the user."""
        # Generate session ID and CSRF token
        session_id = secrets.token_hex(32)
        csrf_token = secrets.token_hex(settings.CSRF_TOKEN_LENGTH)

        # Calculate expiration
        expires_at = datetime.utcnow() + timedelta(seconds=settings.COOKIE_MAX_AGE)

        # Create session
        session = Session(
            id=session_id,
            user_id=user.id,
            csrf_token=csrf_token,
            expires_at=expires_at,
            last_activity=datetime.utcnow(),
            ip_address=ip_address,
            user_agent=user_agent
        )

        db.add(session)
        await db.commit()
        await db.refresh(session)

        return session, session_id

    @staticmethod
    async def validate_session(
        db: AsyncSession,
        session_id: str
    ) -> Optional[Session]:
        """Validate and refresh session."""
        # Get session with user
        result = await db.execute(
            select(Session)
            .where(Session.id == session_id)
            .where(Session.expires_at > datetime.utcnow())
        )
        session = result.scalar_one_or_none()

        if not session:
            return None

        # Check if user is still active
        if not session.user.is_active:
            return None

        # Update last activity
        session.last_activity = datetime.utcnow()
        await db.commit()

        return session

    @staticmethod
    async def delete_session(
        db: AsyncSession,
        session_id: str
    ) -> bool:
        """Delete a session."""
        result = await db.execute(
            delete(Session).where(Session.id == session_id)
        )
        await db.commit()
        return result.rowcount > 0

    @staticmethod
    async def delete_user_sessions(
        db: AsyncSession,
        user_email: str
    ) -> int:
        """Delete all sessions for a user."""
        # Find user
        result = await db.execute(
            select(User).where(User.email == user_email)
        )
        user = result.scalar_one_or_none()

        if not user:
            return 0

        # Delete all sessions
        result = await db.execute(
            delete(Session).where(Session.user_id == user.id)
        )
        await db.commit()
        return result.rowcount

    @staticmethod
    def create_app_token(user: User, app_id: str, app_name: str) -> str:
        """Create a JWT token for sub-application authentication."""
        payload = {
            "sub": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role.value,
            "app_id": app_id,
            "app_name": app_name,
            "exp": datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
            "iat": datetime.utcnow(),
        }

        return jwt.encode(
            payload,
            settings.jwt_secret_key,
            algorithm="HS256"
        )

    @staticmethod
    def validate_app_token(token: str) -> dict:
        """Validate and decode app token."""
        try:
            payload = jwt.decode(
                token,
                settings.jwt_secret_key,
                algorithms=["HS256"]
            )
            return payload
        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}"
            )

    @staticmethod
    async def cleanup_expired_sessions(db: AsyncSession) -> int:
        """Clean up expired sessions from database."""
        result = await db.execute(
            delete(Session).where(Session.expires_at < datetime.utcnow())
        )
        await db.commit()
        return result.rowcount