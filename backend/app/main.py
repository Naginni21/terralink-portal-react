"""Main FastAPI application."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import sys

from .core.config import settings
from .core.middleware import (
    setup_cors,
    RateLimitMiddleware,
    SecurityHeadersMiddleware,
    LoggingMiddleware
)
from .db.base import init_db
from .api.auth import auth_router
from .api.admin import admin_router
from .api.activity import activity_router

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format=settings.LOG_FORMAT,
    stream=sys.stdout
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"Debug mode: {settings.DEBUG}")

    # Initialize database tables (for development)
    if settings.DEBUG:
        logger.info("Initializing database tables...")
        try:
            await init_db()
            logger.info("Database tables initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")

    yield

    # Shutdown
    logger.info("Shutting down application")


# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan
)

# Setup CORS
setup_cors(app)

# Add middleware
app.add_middleware(LoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    RateLimitMiddleware,
    requests_per_window=settings.RATE_LIMIT_REQUESTS,
    window_seconds=settings.RATE_LIMIT_WINDOW
)

# Include API routers
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(admin_router, prefix=settings.API_PREFIX)
app.include_router(activity_router, prefix=settings.API_PREFIX)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Custom 404 handler."""
    return JSONResponse(
        status_code=404,
        content={"error": "Not found", "path": str(request.url.path)}
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    """Custom 500 handler."""
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        log_level=settings.LOG_LEVEL.lower()
    )