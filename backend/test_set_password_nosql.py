"""
Test NoSQL Injection vulnerability in set-password endpoint
"""
from pydantic import BaseModel, ValidationError
import pytest
import sys
import io

# Fix unicode output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

class UpdatePasswordRequest(BaseModel):
    phone: str
    password: str

def test_nosql_injection_nested_object():
    """Test if Pydantic blocks nested objects when expecting string"""

    # Attempt 1: Direct nested dict injection
    malicious_payload = {
        "phone": {"$ne": None},  # This would match all users
        "password": "attacker_password"
    }

    try:
        request = UpdatePasswordRequest(**malicious_payload)
        print(f"❌ VULNERABLE: Pydantic accepted nested object: {request.phone}")
        print(f"   Type of phone: {type(request.phone)}")
        return False
    except ValidationError as e:
        print(f"✅ PROTECTED: Pydantic rejected nested object")
        print(f"   Error: {e}")
        return True

def test_nosql_injection_array():
    """Test if Pydantic blocks arrays when expecting string"""

    malicious_payload = {
        "phone": ["+96812345678", "+96887654321"],
        "password": "attacker_password"
    }

    try:
        request = UpdatePasswordRequest(**malicious_payload)
        print(f"❌ VULNERABLE: Pydantic accepted array: {request.phone}")
        print(f"   Type of phone: {type(request.phone)}")
        return False
    except ValidationError as e:
        print(f"✅ PROTECTED: Pydantic rejected array")
        print(f"   Error: {e}")
        return True

def test_nosql_injection_special_chars():
    """Test if special MongoDB operators in strings are safe"""

    # These are strings, so they should be accepted
    test_cases = [
        {"phone": "$ne", "password": "test"},
        {"phone": "$gt", "password": "test"},
        {"phone": "{\"$ne\": null}", "password": "test"},
    ]

    for payload in test_cases:
        try:
            request = UpdatePasswordRequest(**payload)
            print(f"✅ String accepted (safe): {request.phone}")
            # This is OK because MongoDB will treat it as a literal string
            # Query: {"phone": "$ne"} will match phone field with value "$ne"
            # NOT as an operator
        except ValidationError as e:
            print(f"❌ UNEXPECTED: Pydantic rejected valid string: {e}")

def test_valid_request():
    """Test that valid requests work"""

    valid_payload = {
        "phone": "+96812345678",
        "password": "secure_password123"
    }

    try:
        request = UpdatePasswordRequest(**valid_payload)
        print(f"✅ Valid request accepted: {request.phone}")
        return True
    except ValidationError as e:
        print(f"❌ ERROR: Valid request rejected: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Testing NoSQL Injection in UpdatePasswordRequest")
    print("=" * 60)
    print()

    print("Test 1: Nested Object Injection")
    print("-" * 60)
    result1 = test_nosql_injection_nested_object()
    print()

    print("Test 2: Array Injection")
    print("-" * 60)
    result2 = test_nosql_injection_array()
    print()

    print("Test 3: Special Characters in Strings (should be safe)")
    print("-" * 60)
    test_nosql_injection_special_chars()
    print()

    print("Test 4: Valid Request")
    print("-" * 60)
    result4 = test_valid_request()
    print()

    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)

    if result1 and result2 and result4:
        print("✅ UpdatePasswordRequest is PROTECTED against NoSQL injection")
        print("   - Pydantic v2 blocks nested objects and arrays")
        print("   - Only string values are accepted for 'phone' field")
    else:
        print("❌ UpdatePasswordRequest may be VULNERABLE")
