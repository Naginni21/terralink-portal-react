"""Domain whitelist model for access control."""

from sqlalchemy import Column, String, DateTime, Integer
from sqlalchemy.sql import func

from ..db.base import Base


class DomainWhitelist(Base):
    """Domain whitelist for controlling which email domains can access the system."""

    __tablename__ = "domain_whitelist"

    domain = Column(String, primary_key=True, index=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    added_by = Column(String, nullable=False)
    user_count = Column(Integer, default=0, nullable=False)  # Cached count of users from this domain
    status = Column(String, default="active", nullable=False)  # active, suspended

    def __repr__(self):
        return f"<DomainWhitelist(domain={self.domain}, status={self.status})>"