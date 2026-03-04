"""
Test FastAPI's actual request handling with NoSQL injection attempts
This simulates how FastAPI would process the request
"""
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from pydantic import BaseModel
import json

app = FastAPI()

class LoginPasswordRequest(BaseModel):
    username: str
    password: str

@app.post("/login")
async def login(request: LoginPasswordRequest):
    # Simulate the vulnerable code pattern from auth.py
    # In reality, this would query MongoDB
    return {
        "username": request.username,
        "username_type": str(type(request.username)),
        "password": request.password
    }

client = TestClient(app)

print("=" * 60)
print("FastAPI Integration Test - NoSQL Injection Attempts")
print("=" * 60)

# Test 1: Normal request
print("\nTest 1: Normal JSON request")
response = client.post("/login", json={"username": "admin", "password": "test123"})
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

# Test 2: NoSQL injection attempt with $ne operator
print("\nTest 2: NoSQL injection with $ne operator")
response = client.post("/login", json={"username": {"$ne": None}, "password": "test"})
print(f"Status: {response.status_code}")
if response.status_code == 422:
    print(f"[PROTECTED] Validation failed: {response.json()}")
else:
    print(f"[VULNERABLE] Response: {response.json()}")

# Test 3: NoSQL injection with $regex
print("\nTest 3: NoSQL injection with $regex operator")
response = client.post("/login", json={"username": {"$regex": "^admin"}, "password": "test"})
print(f"Status: {response.status_code}")
if response.status_code == 422:
    print(f"[PROTECTED] Validation failed: {response.json()}")
else:
    print(f"[VULNERABLE] Response: {response.json()}")

# Test 4: NoSQL injection with $gt
print("\nTest 4: NoSQL injection with $gt operator")
response = client.post("/login", json={"username": {"$gt": ""}, "password": "test"})
print(f"Status: {response.status_code}")
if response.status_code == 422:
    print(f"[PROTECTED] Validation failed: {response.json()}")
else:
    print(f"[VULNERABLE] Response: {response.json()}")

# Test 5: Content-Type manipulation attempt
print("\nTest 5: Raw JSON string (bypassing JSON parser)")
response = client.post(
    "/login",
    data='{"username": {"$ne": null}, "password": "test"}',
    headers={"Content-Type": "application/json"}
)
print(f"Status: {response.status_code}")
if response.status_code == 422:
    print(f"[PROTECTED] Validation failed")
else:
    print(f"[VULNERABLE] Response: {response.json()}")

print("\n" + "=" * 60)
print("CONCLUSION")
print("=" * 60)
print("All tests should return status 422 (Validation Error)")
print("If any test returns 200, the endpoint is vulnerable.")
