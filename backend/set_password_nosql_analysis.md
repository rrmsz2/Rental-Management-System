# NoSQL Injection Analysis: Set-Password Endpoint

## Vulnerability Report

**Endpoint:** `/api/auth/set-password`
**File:** `backend/routers/auth.py`
**Lines:** 93-127
**Severity:** FALSE POSITIVE
**Confidence:** 9/10

---

## Executive Summary

The set-password endpoint is **NOT vulnerable** to NoSQL injection attacks due to:
1. **Pydantic v2 type validation** blocking nested objects and arrays
2. **Admin-only authorization** restricting access to privileged users
3. **String coercion** ensuring MongoDB query safety

---

## Code Analysis

### Endpoint Implementation

```python
@router.post("/set-password")
async def set_password(
    request: UpdatePasswordRequest,
    current_user: dict = Depends(require_admin),  # Admin-only access
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Set password for a user (Admin only)"""
    user = await db.users.find_one({"phone": request.phone})  # Line 103

    if not user:
        # Special handling for manager phone
        if request.phone == os.getenv("MANAGER_PHONE", "+96812345678"):
            # Create admin user
            user = {...}
            await db.users.insert_one(user)
        else:
            raise HTTPException(status_code=404, detail="User not found")

    hashed_pw = get_password_hash(request.password)
    await db.users.update_one(
        {"phone": request.phone},  # Line 123
        {"$set": {"password_hash": hashed_pw}}
    )

    return {"message": "Password set successfully"}
```

### Request Model

```python
class UpdatePasswordRequest(BaseModel):
    phone: str      # Pydantic enforces string type
    password: str   # Pydantic enforces string type
```

---

## Security Layers

### Layer 1: Authorization (Primary Defense)

**Protection:** `require_admin` dependency

```python
def require_admin(current_user: dict = Depends(get_current_user)):
    """Requires Admin role"""
    return require_roles([UserRole.admin])(current_user)
```

**Impact:**
- Only authenticated users with `role: "admin"` can access this endpoint
- JWT token must be valid and not expired
- Significantly reduces attack surface to trusted admins only

### Layer 2: Pydantic Type Validation (Secondary Defense)

**Protection:** Automatic type coercion and validation

**Test Results:**

```python
# Test 1: Nested Object Injection (BLOCKED)
malicious_payload = {
    "phone": {"$ne": None},  # Would match all users if not validated
    "password": "attacker_password"
}
# Result: ValidationError - Input should be a valid string

# Test 2: Array Injection (BLOCKED)
malicious_payload = {
    "phone": ["+96812345678", "+96887654321"],
    "password": "attacker_password"
}
# Result: ValidationError - Input should be a valid string

# Test 3: Valid Request (ACCEPTED)
valid_payload = {
    "phone": "+96812345678",
    "password": "secure_password123"
}
# Result: Success
```

**Pydantic v2 Behavior:**
- Rejects dicts when expecting strings: `input_value={'$ne': None}, input_type=dict`
- Rejects lists when expecting strings: `input_value=['+968...'], input_type=list`
- Only accepts string values for `phone` field

### Layer 3: MongoDB Query Safety

**Safe Query Construction:**

```python
# When request.phone = "+96812345678" (string)
db.users.find_one({"phone": "+96812345678"})
# MongoDB receives: {"phone": "+96812345678"}
# Safe: Exact match on phone field

# When request.phone = {"$ne": None} (hypothetically, if Pydantic allowed it)
db.users.find_one({"phone": {"$ne": None}})
# MongoDB receives: {"phone": {"$ne": null}}
# Vulnerable: Would match all users with non-null phone
```

**Why it's safe:**
- Pydantic ensures `request.phone` is always a string
- MongoDB treats string values as literal matches, not operators
- Even if someone sends `{"phone": "$ne"}`, it matches phone field with value "$ne" (string)

---

## Attack Scenarios (All Blocked)

### Scenario 1: Admin Privilege Escalation
**Attack:** Malicious admin tries to reset password for all users

```http
POST /api/auth/set-password
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "phone": {"$ne": null},
  "password": "hacked123"
}
```

**Result:** `400 Bad Request` - Pydantic validation error before reaching database

---

### Scenario 2: External NoSQL Injection
**Attack:** Unauthenticated attacker tries to inject payload

```http
POST /api/auth/set-password
Content-Type: application/json

{
  "phone": {"$ne": null},
  "password": "hacked123"
}
```

**Result:** `403 Forbidden` - Blocked by `require_admin` middleware, never reaches validation

---

### Scenario 3: Bypass via String Encoding
**Attack:** Send MongoDB operator as JSON-encoded string

```http
POST /api/auth/set-password
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "phone": "{\"$ne\": null}",
  "password": "hacked123"
}
```

**Result:** `404 Not Found` - Pydantic accepts string, but MongoDB query looks for user with phone = `"{\"$ne\": null}"` (literal string), which doesn't exist

---

## Why This is a FALSE POSITIVE

### 1. Defense in Depth
Multiple independent security layers:
- **Authorization:** Admin-only access
- **Validation:** Pydantic type enforcement
- **Database:** MongoDB treats strings as literals

### 2. Attack Surface Minimal
- Requires valid admin JWT token
- Only admins are trusted users (typically 1-2 accounts)
- If admin is compromised, system has bigger problems than password resets

### 3. Pydantic v2 Protection Confirmed
Empirical testing shows:
- Nested objects are rejected with clear error messages
- Arrays are rejected with clear error messages
- Only string values pass validation

### 4. No Bypass Path Found
- Cannot bypass Pydantic validation (runs before business logic)
- Cannot bypass authorization (runs before validation)
- Cannot inject operators as strings (MongoDB treats as literals)

---

## Comparison: Login Endpoint vs Set-Password

Both endpoints use the same protection mechanism:

| Aspect | Login Endpoint | Set-Password Endpoint |
|--------|---------------|----------------------|
| **Model** | `LoginPasswordRequest(username: str)` | `UpdatePasswordRequest(phone: str)` |
| **Pydantic** | Enforces string type | Enforces string type |
| **Auth** | None (public) | Admin-only |
| **Query** | `{"username": request.username}` | `{"phone": request.phone}` |
| **Verdict** | FALSE POSITIVE | FALSE POSITIVE |

The set-password endpoint has **stronger** protection due to admin-only access.

---

## Confidence Rating: 9/10

### Why 9/10 (not 10/10)?

**Remaining 10% doubt:**
1. Pydantic version dependency (assumes v2.x behavior holds)
2. Potential future Pydantic bugs (unlikely but not impossible)
3. Unknown MongoDB driver edge cases

**Why not lower?**
- Empirical test confirms protection
- Authorization layer provides independent defense
- Consistent with industry-standard practices
- No known bypasses for Pydantic v2 type validation

---

## Recommendations

### 1. Keep Current Implementation ✅
The code is secure as-is. No changes needed.

### 2. Optional: Add Explicit Validation (Defense in Depth)
If you want extra paranoia:

```python
import re

PHONE_REGEX = r'^\+968\d{8}$'

class UpdatePasswordRequest(BaseModel):
    phone: str
    password: str

    @validator('phone')
    def validate_phone_format(cls, v):
        if not isinstance(v, str):
            raise ValueError('Phone must be a string')
        if not re.match(PHONE_REGEX, v):
            raise ValueError('Invalid phone format')
        return v
```

**Pros:** Belt-and-suspenders approach, validates business logic
**Cons:** Redundant given Pydantic already enforces string type

### 3. Monitor for Pydantic Updates
Track Pydantic changelog for any changes to type validation behavior.

### 4. Security Audit Log (Optional)
Log all password reset operations:

```python
import logging

@router.post("/set-password")
async def set_password(...):
    # ... existing code ...

    logging.warning(
        f"Password reset by admin {current_user['user_id']} "
        f"for phone {request.phone}"
    )

    # ... rest of endpoint ...
```

---

## Conclusion

**VERDICT: FALSE POSITIVE**

The set-password endpoint is **NOT vulnerable** to NoSQL injection. The combination of:
1. Admin-only authorization
2. Pydantic v2 type validation
3. Safe MongoDB query construction

...creates a robust defense against this attack vector.

**Confidence: 9/10** - Based on empirical testing and code analysis.

---

## Test Evidence

See `backend/test_set_password_nosql.py` for reproducible tests confirming Pydantic protection.

**Test Output:**
```
✅ PROTECTED: Pydantic rejected nested object
✅ PROTECTED: Pydantic rejected array
✅ UpdatePasswordRequest is PROTECTED against NoSQL injection
   - Pydantic v2 blocks nested objects and arrays
   - Only string values are accepted for 'phone' field
```
