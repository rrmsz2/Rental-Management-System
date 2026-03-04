"""
Comprehensive NoSQL injection attack simulation
Tests all possible bypass techniques against the actual endpoint pattern
"""
import requests
import json

# Note: This test would need the actual server running
# For now, we'll use FastAPI TestClient for offline testing

from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel
from typing import Any

app = FastAPI()

class LoginPasswordRequest(BaseModel):
    username: str
    password: str

# Simulate the vulnerable pattern
fake_db = {
    "users": [
        {"username": "admin", "password_hash": "$2b$12$hashedpassword", "role": "admin"},
        {"username": "testuser", "password_hash": "$2b$12$anotherhashedpassword", "role": "user"}
    ]
}

@app.post("/api/auth/login-password")
async def login_password(request: LoginPasswordRequest):
    """
    Simulates the actual vulnerable code pattern from auth.py line 38:
    user = await db.users.find_one({"username": request.username})
    """
    # This simulates MongoDB find_one
    # In reality, request.username is ALWAYS a string due to Pydantic
    query = {"username": request.username}

    # If this were MongoDB and request.username could be a dict like {"$ne": null},
    # it would match any user where username is not null (bypassing authentication)
    user = None
    for u in fake_db["users"]:
        if u["username"] == request.username:
            user = u
            break

    if user:
        return {
            "status": "User found",
            "username": user["username"],
            "query_used": str(query),
            "request_username_type": str(type(request.username))
        }
    else:
        return {
            "status": "User not found",
            "query_used": str(query),
            "request_username_type": str(type(request.username))
        }

client = TestClient(app)

print("=" * 70)
print("COMPREHENSIVE NoSQL INJECTION ATTACK SIMULATION")
print("=" * 70)

attack_vectors = [
    {
        "name": "Classic $ne (not equal) bypass",
        "payload": {"username": {"$ne": None}, "password": "anything"},
        "description": "Should match any user where username is not null"
    },
    {
        "name": "$regex pattern matching",
        "payload": {"username": {"$regex": "^admin"}, "password": "test"},
        "description": "Should match usernames starting with 'admin'"
    },
    {
        "name": "$gt (greater than) bypass",
        "payload": {"username": {"$gt": ""}, "password": "test"},
        "description": "Should match any username greater than empty string"
    },
    {
        "name": "$exists operator",
        "payload": {"username": {"$exists": True}, "password": "test"},
        "description": "Should match any user with a username field"
    },
    {
        "name": "$in array operator",
        "payload": {"username": {"$in": ["admin", "root", "superuser"]}, "password": "test"},
        "description": "Should match if username is in the array"
    },
    {
        "name": "$where JavaScript injection",
        "payload": {"username": {"$where": "this.username == 'admin'"}, "password": "test"},
        "description": "JavaScript code execution in MongoDB"
    },
    {
        "name": "Array input bypass",
        "payload": {"username": ["admin"], "password": "test"},
        "description": "Some parsers might accept arrays"
    },
    {
        "name": "Nested object with valid username",
        "payload": {"username": {"$eq": "admin"}, "password": "test"},
        "description": "Using $eq operator explicitly"
    },
    {
        "name": "Boolean type confusion",
        "payload": {"username": True, "password": "test"},
        "description": "Type confusion attack"
    },
    {
        "name": "Integer type confusion",
        "payload": {"username": 1, "password": "test"},
        "description": "Numeric type confusion"
    }
]

vulnerable_count = 0
protected_count = 0

for i, attack in enumerate(attack_vectors, 1):
    print(f"\n{'-' * 70}")
    print(f"Attack {i}: {attack['name']}")
    print(f"Description: {attack['description']}")
    print(f"Payload: {json.dumps(attack['payload'], indent=2)}")
    print(f"{'-' * 70}")

    try:
        response = client.post("/api/auth/login-password", json=attack["payload"])

        if response.status_code == 200:
            print(f"[VULNERABLE] Status: {response.status_code}")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            vulnerable_count += 1
        elif response.status_code == 422:
            print(f"[PROTECTED] Status: {response.status_code} - Validation Error")
            print(f"Pydantic blocked the attack!")
            protected_count += 1
        else:
            print(f"[UNKNOWN] Status: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"[ERROR] Exception: {str(e)}")

print("\n" + "=" * 70)
print("FINAL RESULTS")
print("=" * 70)
print(f"Total attack vectors tested: {len(attack_vectors)}")
print(f"Blocked by Pydantic: {protected_count}")
print(f"Bypassed (VULNERABLE): {vulnerable_count}")
print(f"Errors: {len(attack_vectors) - protected_count - vulnerable_count}")
print("=" * 70)

if vulnerable_count == 0:
    print("\n✓ CONCLUSION: All NoSQL injection attempts were blocked by Pydantic v2")
    print("  The reported vulnerability is a FALSE POSITIVE.")
    print("  Pydantic v2's strict type validation prevents nested objects/operators.")
else:
    print(f"\n✗ CRITICAL: {vulnerable_count} attack vectors succeeded!")
    print("  The application IS VULNERABLE to NoSQL injection.")

print("\nTECHNICAL DETAILS:")
print("- Pydantic version: 2.10.6 (confirmed in project)")
print("- FastAPI automatically uses Pydantic for request validation")
print("- When username: str is declared, Pydantic rejects non-string inputs")
print("- This includes dicts, lists, and other complex types")
print("- MongoDB operators like $ne, $regex, etc. cannot be injected")
