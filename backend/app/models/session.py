"""Session model for managing user sessions."""

from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta

from ..db.base import Base


class Session(Base):
    """Session model for managing user authentication sessions."""

    __tablename__ = "sessions"

    id = Column(String, primary_key=True, index=True)  # Session ID (hex token)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    csrf_token = Column(String, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    last_activity = Column(DateTime(timezone=True), nullable=False)

    # Client information
    ip_address = Column(String, nullable=True)
    user_agent = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", backref="sessions", lazy="joined")

    @property
    def is_expired(self) -> bool:
        """Check if session is expired."""
        return datetime.utcnow() > self.expires_at

    @property
    def is_active(self) -> bool:
        """Check if session is active (not expired)."""
        return not self.is_expired

    def refresh_activity(self) -> None:
        """Update last activity timestamp."""
        self.last_activity = datetime.utcnow()

    def __repr__(self):
        return f"<Session(id={self.id}, user_id={self.user_id}, expires_at={self.expires_at})>"