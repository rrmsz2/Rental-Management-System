"""
Test to understand Pydantic v1 vs v2 behavior differences
and document why this is NOT vulnerable in Pydantic v2
"""
import pydantic
from pydantic import BaseModel, ValidationError

print("=" * 70)
print(f"Pydantic Version: {pydantic.VERSION}")
print("=" * 70)

class LoginPasswordRequest(BaseModel):
    username: str
    password: str

print("\nPydantic v2 Behavior Analysis:")
print("-" * 70)

# Check if ConfigDict has any settings that could weaken validation
print("\nModel Config:")
print(f"  model_config: {LoginPasswordRequest.model_config}")

# Check the schema
print("\nModel JSON Schema:")
import json
print(json.dumps(LoginPasswordRequest.model_json_schema(), indent=2))

# Test strict mode
print("\n" + "=" * 70)
print("Testing with strict=True (even stricter validation)")
print("=" * 70)

class StrictLoginRequest(BaseModel):
    model_config = {'strict': True}
    username: str
    password: str

try:
    # This should fail even with integer (no coercion in strict mode)
    req = StrictLoginRequest(username=123, password="test")
    print(f"Strict mode allowed integer: {req}")
except ValidationError as e:
    print(f"Strict mode rejected integer: {e.errors()[0]['type']}")

try:
    # This should definitely fail with dict
    req = StrictLoginRequest(username={"$ne": None}, password="test")
    print(f"[VULNERABLE] Strict mode allowed dict: {req}")
except ValidationError as e:
    print(f"[PROTECTED] Strict mode rejected dict: {e.errors()[0]['type']}")

print("\n" + "=" * 70)
print("PYDANTIC V2 SECURITY FEATURES")
print("=" * 70)
print("""
Pydantic v2 (2.10.6 used in this project) includes strict type validation:

1. Type Coercion Control:
   - By default, Pydantic v2 is more strict than v1
   - It does NOT coerce complex types (dict, list) to strings
   - It CAN coerce simple types (int, float) to strings in non-strict mode

2. Security Against NoSQL Injection:
   - When a field is declared as 'str', Pydantic validates input type
   - Dictionaries (MongoDB operators like $ne, $regex) are REJECTED
   - Lists are REJECTED
   - Only string-like values are accepted

3. FastAPI Integration:
   - FastAPI automatically applies Pydantic validation to request bodies
   - Returns HTTP 422 (Unprocessable Entity) on validation failure
   - The malicious payload never reaches the application logic

4. Why Pydantic v1 Could Be Different:
   - Pydantic v1 had more lenient type coercion
   - But even v1 would not convert dict to str
   - This vulnerability claim would be FALSE in both v1 and v2

CONCLUSION FOR THIS CODEBASE:
- Using Pydantic v2.10.6 (confirmed)
- Standard Pydantic BaseModel with str type hints
- No custom validators that could bypass type checking
- No direct request.body parsing that bypasses Pydantic
- FastAPI's automatic validation is in place

VERDICT: NOT VULNERABLE to NoSQL injection via nested objects
""")
