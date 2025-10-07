"""Application configuration using Pydantic Settings."""

from typing import List, Optional, Dict, Any
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import secrets
from pathlib import Path
import json


def parse_list_from_env(v: Any) -> List[str]:
    """Parse list from environment variable - handles JSON arrays or comma-separated strings."""
    if v is None or (isinstance(v, str) and not v.strip()):
        return []
    if isinstance(v, list):
        return v
    if isinstance(v, str):
        v = v.strip()
        # Try JSON parsing first
        if v.startswith("["):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, ValueError):
                pass
        # Fallback to comma-separated
        return [item.strip() for item in v.split(",") if item.strip()]
    return []


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        env_ignore_empty=True,
        env_nested_delimiter="__",
        # Don't try to parse env vars as JSON - let our validators handle it
        env_parse_enums=False,
    )

    # API Settings
    PROJECT_NAME: str = "TerraLink Portal API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    DEBUG: bool = Field(default=False, description="Debug mode")

    # Server Settings
    HOST: str = Field(default="0.0.0.0", description="Server host")
    PORT: int = Field(default=8000, description="Server port")
    RELOAD: bool = Field(default=False, description="Auto-reload on code changes")

    # Security
    SECRET_KEY: str = Field(
        default_factory=lambda: secrets.token_urlsafe(32),
        description="Secret key for JWT encoding"
    )
    JWT_SECRET: Optional[str] = Field(default=None, description="JWT secret key")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60 * 24 * 30, description="30 days")
    CSRF_TOKEN_LENGTH: int = Field(default=32, description="CSRF token length")

    # Google OAuth
    GOOGLE_CLIENT_ID: str = Field(default="test-client-id", description="Google OAuth client ID")
    GOOGLE_CLIENT_SECRET: Optional[str] = Field(default=None, description="Google OAuth client secret")

    # Database
    DATABASE_URL: Optional[str] = Field(
        default="sqlite+aiosqlite:///./terralink.db",
        description="Database URL (PostgreSQL or SQLite)"
    )
    DATABASE_ECHO: bool = Field(default=False, description="Echo SQL queries")

    # Redis (Session Storage)
    REDIS_URL: Optional[str] = Field(
        default="redis://localhost:6379/0",
        description="Redis URL for session storage"
    )
    USE_REDIS_SESSIONS: bool = Field(default=False, description="Use Redis for sessions instead of DB")

    # CORS Settings (stored as strings, parsed via properties)
    ALLOWED_ORIGINS: str = Field(
        default="http://localhost:6001,http://localhost:3000",
        description="Allowed CORS origins (comma-separated)"
    )
    ALLOW_CREDENTIALS: bool = Field(default=True, description="Allow credentials in CORS")
    ALLOWED_METHODS: List[str] = Field(default_factory=lambda: ["*"], description="Allowed HTTP methods")
    ALLOWED_HEADERS: List[str] = Field(default_factory=lambda: ["*"], description="Allowed HTTP headers")

    # Cookie Settings
    COOKIE_NAME: str = Field(default="terralink_session", description="Session cookie name")
    COOKIE_DOMAIN: Optional[str] = Field(default=None, description="Cookie domain")
    COOKIE_SECURE: bool = Field(default=False, description="Secure cookie flag")
    COOKIE_HTTPONLY: bool = Field(default=True, description="HttpOnly cookie flag")
    COOKIE_SAMESITE: str = Field(default="lax", description="SameSite cookie attribute")
    COOKIE_MAX_AGE: int = Field(default=60 * 60 * 24 * 30, description="Cookie max age in seconds (30 days)")

    # Access Control (stored as strings, parsed via properties)
    ALLOWED_DOMAINS: str = Field(
        default="terralink.cl",
        description="Allowed email domains for login (comma-separated)"
    )
    ADMIN_EMAILS: str = Field(
        default="admin@terralink.cl",
        description="Admin user emails (comma-separated)"
    )

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = Field(default=True, description="Enable rate limiting")
    RATE_LIMIT_REQUESTS: int = Field(default=100, description="Requests per window")
    RATE_LIMIT_WINDOW: int = Field(default=60, description="Time window in seconds")

    # Logging
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    LOG_FORMAT: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="Log format"
    )

    @property
    def jwt_secret_key(self) -> str:
        """Get JWT secret key, fallback to SECRET_KEY if not set."""
        return self.JWT_SECRET or self.SECRET_KEY

    @property
    def cors_origins(self) -> List[str]:
        """Get CORS origins as list."""
        return parse_list_from_env(self.ALLOWED_ORIGINS)

    @property
    def allowed_domains(self) -> List[str]:
        """Get allowed domains as list."""
        return parse_list_from_env(self.ALLOWED_DOMAINS)

    @property
    def admin_emails(self) -> List[str]:
        """Get admin emails as list."""
        return parse_list_from_env(self.ADMIN_EMAILS)

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return not self.DEBUG

    @property
    def cookie_settings(self) -> Dict[str, Any]:
        """Get cookie configuration as a dictionary."""
        return {
            "key": self.COOKIE_NAME,
            "max_age": self.COOKIE_MAX_AGE,
            "httponly": self.COOKIE_HTTPONLY,
            "secure": self.COOKIE_SECURE or self.is_production,
            "samesite": self.COOKIE_SAMESITE,
            "domain": self.COOKIE_DOMAIN,
        }

    def is_admin(self, email: str) -> bool:
        """Check if an email belongs to an admin user."""
        return email.lower() in [e.lower() for e in self.admin_emails]

    def is_domain_allowed(self, email: str) -> bool:
        """Check if an email domain is allowed."""
        if "@" not in email:
            return False
        domain = email.split("@")[1].lower()
        return domain in [d.lower() for d in self.allowed_domains]


# Create a single settings instance
settings = Settings()