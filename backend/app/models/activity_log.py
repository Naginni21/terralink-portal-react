"""Activity log model for tracking user actions."""

from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ..db.base import Base


class ActivityLog(Base):
    """Activity log for tracking user actions across applications."""

    __tablename__ = "activity_logs"

    id = Column(String, primary_key=True, index=True)  # act_timestamp_random
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    user_email = Column(String, nullable=False, index=True)  # Store email directly for history
    user_role = Column(String, nullable=False)
    user_domain = Column(String, nullable=False, index=True)

    # Application information
    app_id = Column(String, nullable=False, index=True)
    app_name = Column(String, nullable=False)

    # Action details
    action = Column(String, nullable=False, index=True)
    action_metadata = Column(JSON, nullable=True)  # Additional action-specific data

    # Timestamp
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    user = relationship("User", backref="activities", lazy="select")

    def __repr__(self):
        return f"<ActivityLog(id={self.id}, user={self.user_email}, action={self.action})>"