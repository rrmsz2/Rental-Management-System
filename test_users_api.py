import asyncio
import os
import sys

# Add the backend directory to sys.path so we can import from server
backend_dir = r"C:\Users\rrmsz\Rental-Management-System\backend"
sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from server import app

# Set up test client
client = TestClient(app)

def test_routes():
    # 1. First we need an auth token. The system assumes a logged-in user.
    # Let's hit the login endpoint using the superadmin manager phone.
    # NOTE: In a real environment, we'd need the password. 
    # For now, we will just try hitting the users endpoint and seeing if the 401 triggers nicely, 
    # or if we can bypass it for a unit test.
    print("Testing Users Endpoint Connectivity natively...")
    
    # Try an unauthorized access to ensure the router didn't crash
    resp = client.get("/api/users")
    print(f"Users Route Access Without Token: {resp.status_code}")
    print(f"Response: {resp.json()}")

if __name__ == "__main__":
    test_routes()
