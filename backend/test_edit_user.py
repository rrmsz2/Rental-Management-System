import requests
import sys

# Login first
resp = requests.post("http://127.0.0.1:8001/api/auth/login-password", json={
    "username": "admin",
    "password": "admin"
})

if resp.status_code != 200:
    print(f"Login failed: {resp.text}")
    sys.exit(1)

token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Get users
users_resp = requests.get("http://127.0.0.1:8001/api/users", headers=headers)
users = users_resp.json()
first_user = users[0]
user_id = first_user["id"]

# Simulate frontend edit payload with empty strings
payload = {
    "phone": first_user["phone"],
    "full_name": first_user.get("full_name", "Test"),
    "role": "sales",
    "email": "",
    "national_id": "",
    "position": "",
    "salary": "", # This empty string is likely causing the pydantic float validation error
    "hire_date": "2024-01-01",
    "notes": "",
    "is_active": True
}

print(f"Testing edit on user {user_id}...")
edit_resp = requests.put(f"http://127.0.0.1:8001/api/users/{user_id}", json=payload, headers=headers)

print(f"Status: {edit_resp.status_code}")
print(edit_resp.text)
