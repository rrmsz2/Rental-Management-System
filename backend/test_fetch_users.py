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

# Fetch users
headers = {"Authorization": f"Bearer {token}"}
users_resp = requests.get("http://127.0.0.1:8001/api/users", headers=headers)

if users_resp.status_code == 200:
    users = users_resp.json()
    print(f"Success! Fetched {len(users)} users.")
else:
    print(f"Failed to fetch users: {users_resp.status_code}")
    print(users_resp.text)
