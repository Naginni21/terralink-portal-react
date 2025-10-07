#!/usr/bin/env python3
"""Simple test script to verify FastAPI endpoints are working."""

import asyncio
import httpx
import json
from datetime import datetime

# Test configuration
BASE_URL = "http://localhost:8000"
API_PREFIX = "/api"

# Colors for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


async def test_health_check():
    """Test health check endpoint."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/health")
            assert response.status_code == 200
            assert response.json()["status"] == "healthy"
            return True, "Health check passed"
        except Exception as e:
            return False, f"Health check failed: {e}"


async def test_root_endpoint():
    """Test root endpoint."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/")
            assert response.status_code == 200
            data = response.json()
            assert "name" in data
            assert "version" in data
            return True, f"Root endpoint returned: {data['name']} v{data['version']}"
        except Exception as e:
            return False, f"Root endpoint failed: {e}"


async def test_docs_endpoint():
    """Test API documentation endpoint."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/docs")
            assert response.status_code == 200
            return True, "API documentation is accessible"
        except Exception as e:
            return False, f"Docs endpoint failed: {e}"


async def test_session_unauthorized():
    """Test session endpoint without authentication."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}{API_PREFIX}/auth/session")
            assert response.status_code == 401
            return True, "Session endpoint correctly returns 401 when unauthorized"
        except Exception as e:
            return False, f"Session test failed: {e}"


async def test_admin_unauthorized():
    """Test admin endpoints without authentication."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}{API_PREFIX}/admin/users")
            assert response.status_code == 401
            return True, "Admin endpoints correctly return 401 when unauthorized"
        except Exception as e:
            return False, f"Admin test failed: {e}"


async def test_cors_headers():
    """Test CORS headers are present."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.options(
                f"{BASE_URL}{API_PREFIX}/auth/session",
                headers={"Origin": "http://localhost:6001"}
            )
            headers = response.headers
            assert "access-control-allow-origin" in headers
            return True, f"CORS headers present: Origin={headers.get('access-control-allow-origin')}"
        except Exception as e:
            return False, f"CORS test failed: {e}"


async def run_tests():
    """Run all tests."""
    print(f"\n{BLUE}========================================{RESET}")
    print(f"{BLUE}FastAPI Backend Test Suite{RESET}")
    print(f"{BLUE}========================================{RESET}\n")
    print(f"Testing API at: {BASE_URL}\n")

    tests = [
        ("Health Check", test_health_check),
        ("Root Endpoint", test_root_endpoint),
        ("API Documentation", test_docs_endpoint),
        ("Session (Unauthorized)", test_session_unauthorized),
        ("Admin (Unauthorized)", test_admin_unauthorized),
        ("CORS Headers", test_cors_headers),
    ]

    results = []
    for test_name, test_func in tests:
        print(f"Testing {test_name}...", end=" ")
        success, message = await test_func()
        results.append(success)

        if success:
            print(f"{GREEN}✓{RESET}")
            print(f"  {message}")
        else:
            print(f"{RED}✗{RESET}")
            print(f"  {RED}{message}{RESET}")
        print()

    # Summary
    passed = sum(results)
    total = len(results)
    print(f"{BLUE}========================================{RESET}")
    print(f"Results: {passed}/{total} tests passed")

    if passed == total:
        print(f"{GREEN}All tests passed!{RESET}")
    else:
        print(f"{YELLOW}Some tests failed. Please check the output above.{RESET}")

    print(f"\n{BLUE}API Endpoints Available:{RESET}")
    print(f"  Documentation: {BASE_URL}/docs")
    print(f"  Health Check:  {BASE_URL}/health")
    print(f"  Auth:          {BASE_URL}{API_PREFIX}/auth/*")
    print(f"  Admin:         {BASE_URL}{API_PREFIX}/admin/*")
    print(f"  Activity:      {BASE_URL}{API_PREFIX}/activity/*")


def main():
    """Main function."""
    try:
        asyncio.run(run_tests())
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Tests interrupted by user{RESET}")
    except Exception as e:
        print(f"\n{RED}Error running tests: {e}{RESET}")
        print(f"{YELLOW}Make sure the FastAPI server is running on port 8000{RESET}")
        print(f"Run: {BLUE}npm run dev:fastapi{RESET}")


if __name__ == "__main__":
    main()