"""Application middleware for CORS, rate limiting, and security."""

from fastapi import Request, Response, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
from datetime import datetime, timedelta
import time
import logging

from .config import settings

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiting middleware."""

    def __init__(self, app, requests_per_window: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.requests_per_window = requests_per_window
        self.window_seconds = window_seconds
        self.request_counts = defaultdict(list)

    def _get_client_id(self, request: Request) -> str:
        """Get client identifier for rate limiting."""
        # Use IP address as client ID
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"
        return client_ip

    def _is_rate_limited(self, client_id: str) -> bool:
        """Check if client has exceeded rate limit."""
        now = time.time()
        window_start = now - self.window_seconds

        # Clean old requests
        self.request_counts[client_id] = [
            req_time for req_time in self.request_counts[client_id]
            if req_time > window_start
        ]

        # Check if limit exceeded
        if len(self.request_counts[client_id]) >= self.requests_per_window:
            return True

        # Record this request
        self.request_counts[client_id].append(now)
        return False

    async def dispatch(self, request: Request, call_next):
        """Process request with rate limiting."""
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/docs", "/openapi.json"]:
            return await call_next(request)

        # Skip if rate limiting is disabled
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        client_id = self._get_client_id(request)

        if self._is_rate_limited(client_id):
            logger.warning(f"Rate limit exceeded for client: {client_id}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later."
            )

        response = await call_next(request)
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to responses."""

    async def dispatch(self, request: Request, call_next):
        """Add security headers to response."""
        response = await call_next(request)

        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Add CSP header for production
        if settings.is_production:
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' https://accounts.google.com; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "connect-src 'self' https://accounts.google.com;"
            )

        return response


class LoggingMiddleware(BaseHTTPMiddleware):
    """Log requests and responses."""

    async def dispatch(self, request: Request, call_next):
        """Log request and response details."""
        start_time = time.time()

        # Get client info
        client_ip = request.client.host if request.client else "unknown"
        if forwarded_for := request.headers.get("X-Forwarded-For"):
            client_ip = forwarded_for.split(",")[0].strip()

        # Log request
        logger.info(
            f"Request: {request.method} {request.url.path} from {client_ip}"
        )

        # Process request
        response = await call_next(request)

        # Calculate duration
        duration = time.time() - start_time

        # Log response
        logger.info(
            f"Response: {request.method} {request.url.path} - "
            f"Status: {response.status_code} - Duration: {duration:.3f}s"
        )

        # Add timing header
        response.headers["X-Process-Time"] = f"{duration:.3f}"

        return response


def setup_cors(app):
    """Configure CORS middleware."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=settings.ALLOW_CREDENTIALS,
        allow_methods=settings.ALLOWED_METHODS,
        allow_headers=settings.ALLOWED_HEADERS,
    )