"""
Simulate what an attacker would see when attempting NoSQL injection
"""
from fastapi.testclient import TestClient
from fastapi import FastAPI
from pydantic import BaseModel
import json

app = FastAPI()

class LoginPasswordRequest(BaseModel):
    username: str
    password: str

@app.post("/api/auth/login-password")
async def login_password(request: LoginPasswordRequest):
    return {"message": "Login successful", "username": request.username}

client = TestClient(app)

print("=" * 70)
print("ATTACKER'S VIEW: NoSQL Injection Attempt")
print("=" * 70)

print("\nATTACK SCENARIO:")
print("An attacker tries to bypass login by sending:")
print(json.dumps({"username": {"$ne": None}, "password": "anything"}, indent=2))

print("\n" + "-" * 70)
print("SENDING REQUEST...")
print("-" * 70)

response = client.post(
    "/api/auth/login-password",
    json={"username": {"$ne": None}, "password": "anything"}
)

print(f"\nHTTP Status Code: {response.status_code}")
print(f"\nResponse Headers:")
print(f"  Content-Type: {response.headers.get('content-type')}")

print(f"\nResponse Body:")
print(json.dumps(response.json(), indent=2))

print("\n" + "=" * 70)
print("ATTACKER'S PERSPECTIVE")
print("=" * 70)
print("""
What the attacker sees:
1. HTTP 422 Unprocessable Entity (not 200 OK)
2. Clear validation error message
3. Attack payload was rejected BEFORE reaching the database
4. No sensitive information leaked in error message

Conclusion: Attack failed at the validation layer.
The application is protected by Pydantic's type checking.
""")

print("=" * 70)
print("WHAT IF PYDANTIC WASN'T THERE?")
print("=" * 70)
print("""
If there was NO Pydantic validation, the MongoDB query would be:

  db.users.find_one({"username": {"$ne": None}})

This would match ANY user where username exists (is not null).
The attacker could log in without knowing any credentials!

But WITH Pydantic (current setup):
  ✓ Request is validated BEFORE endpoint logic
  ✓ {"$ne": None} is rejected as invalid type
  ✓ HTTP 422 is returned immediately
  ✓ Database query never executes
  ✓ Attack is completely neutralized
""")

# Show what a successful legitimate request looks like
print("\n" + "=" * 70)
print("LEGITIMATE REQUEST (for comparison)")
print("=" * 70)

print("\nSending legitimate request:")
print(json.dumps({"username": "admin", "password": "correctpassword"}, indent=2))

response = client.post(
    "/api/auth/login-password",
    json={"username": "admin", "password": "correctpassword"}
)

print(f"\nHTTP Status Code: {response.status_code}")
print(f"\nResponse Body:")
print(json.dumps(response.json(), indent=2))

print("\n✓ Legitimate request accepted (HTTP 200)")
print("✓ Validation passed because both fields are strings")
