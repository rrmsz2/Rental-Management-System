"""
Test script to verify Pydantic's behavior with nested objects
to determine if NoSQL injection is possible in auth.py
"""
from pydantic import BaseModel, ValidationError
import json
import sys
import io

# Fix encoding for Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

class LoginPasswordRequest(BaseModel):
    username: str
    password: str

# Test 1: Normal valid input
print("=" * 60)
print("TEST 1: Normal valid input")
print("=" * 60)
try:
    request = LoginPasswordRequest(username="admin", password="test123")
    print(f"[PASS] Success: {request}")
    print(f"  username type: {type(request.username)}")
    print(f"  username value: {request.username}")
except ValidationError as e:
    print(f"[FAIL] Validation Error: {e}")

# Test 2: Nested object in username field (NoSQL injection attempt)
print("\n" + "=" * 60)
print("TEST 2: Nested object in username - direct dict")
print("=" * 60)
try:
    # Simulating: {"username": {"$ne": null}, "password": "test"}
    request = LoginPasswordRequest(username={"$ne": None}, password="test")
    print(f"[PASS] Success (VULNERABLE!): {request}")
    print(f"  username type: {type(request.username)}")
    print(f"  username value: {request.username}")
except ValidationError as e:
    print(f"[FAIL] Validation Error (PROTECTED): {e}")
except Exception as e:
    print(f"[FAIL] Other Error: {e}")

# Test 3: Nested object via JSON parsing (like FastAPI receives)
print("\n" + "=" * 60)
print("TEST 3: Nested object via JSON parsing (FastAPI-like)")
print("=" * 60)
try:
    # This is how FastAPI would receive the request
    json_payload = '{"username": {"$ne": null}, "password": "test"}'
    data = json.loads(json_payload)
    request = LoginPasswordRequest(**data)
    print(f"[PASS] Success (VULNERABLE!): {request}")
    print(f"  username type: {type(request.username)}")
    print(f"  username value: {request.username}")
except ValidationError as e:
    print(f"[FAIL] Validation Error (PROTECTED): {e}")
except Exception as e:
    print(f"[FAIL] Other Error: {e}")

# Test 4: $regex operator attempt
print("\n" + "=" * 60)
print("TEST 4: $regex operator in username")
print("=" * 60)
try:
    json_payload = '{"username": {"$regex": "^admin"}, "password": "test"}'
    data = json.loads(json_payload)
    request = LoginPasswordRequest(**data)
    print(f"[PASS] Success (VULNERABLE!): {request}")
    print(f"  username type: {type(request.username)}")
    print(f"  username value: {request.username}")
except ValidationError as e:
    print(f"[FAIL] Validation Error (PROTECTED): {e}")
except Exception as e:
    print(f"[FAIL] Other Error: {e}")

# Test 5: Integer instead of string
print("\n" + "=" * 60)
print("TEST 5: Integer instead of string (type coercion test)")
print("=" * 60)
try:
    request = LoginPasswordRequest(username=12345, password="test")
    print(f"[PASS] Success: {request}")
    print(f"  username type: {type(request.username)}")
    print(f"  username value: {request.username}")
except ValidationError as e:
    print(f"[FAIL] Validation Error: {e}")

# Test 6: List instead of string
print("\n" + "=" * 60)
print("TEST 6: List instead of string")
print("=" * 60)
try:
    request = LoginPasswordRequest(username=["admin"], password="test")
    print(f"[PASS] Success (VULNERABLE!): {request}")
    print(f"  username type: {type(request.username)}")
    print(f"  username value: {request.username}")
except ValidationError as e:
    print(f"[FAIL] Validation Error (PROTECTED): {e}")

print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
print("If any nested objects (dicts) passed validation,")
print("the application is VULNERABLE to NoSQL injection.")
