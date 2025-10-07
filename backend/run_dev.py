#!/usr/bin/env python3
"""Development server runner for FastAPI application."""

import uvicorn
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.config import settings

if __name__ == "__main__":
    print(f"Starting {settings.PROJECT_NAME} in development mode...")
    print(f"API will be available at http://localhost:{settings.PORT}")
    print(f"Documentation at http://localhost:{settings.PORT}/docs")

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,  # Enable auto-reload for development
        log_level="info"
    )