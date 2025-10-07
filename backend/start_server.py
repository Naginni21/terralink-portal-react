#!/usr/bin/env python3
"""Simple server start script to work around configuration issues."""

import os
import sys

# Set environment variables to avoid list parsing issues
os.environ.pop("ALLOWED_ORIGINS", None)
os.environ.pop("ALLOWED_DOMAINS", None)
os.environ.pop("ADMIN_EMAILS", None)

# Import after environment is set
import uvicorn
from app.main import app

if __name__ == "__main__":
    print("Starting TerraLink Portal API...")
    print("API will be available at http://localhost:8000")
    print("Documentation at http://localhost:8000/docs")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )