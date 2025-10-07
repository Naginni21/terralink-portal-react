"""User model definition."""

from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, Boolean
from sqlalchemy.sql import func
from datetime import datetime
import enum

from ..db.base import Base


class UserRole(str, enum.Enum):
    """User role enumeration."""
    ADMIN = "admin"
    USUARIO = "usuario"
    CUSTOMER = "customer"
    DEFAULT = "default"


class User(Base):
    """User model for authentication and authorization."""

    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)  # Google sub ID
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.DEFAULT, nullable=False)
    picture = Column(String, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Access control
    is_active = Column(Boolean, default=True, nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoked_by = Column(String, nullable=True)
    updated_by = Column(String, nullable=True)

    # Domain from email (computed)
    @property
    def domain(self) -> str:
        """Extract domain from email."""
        return self.email.split("@")[1] if "@" in self.email else ""

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"