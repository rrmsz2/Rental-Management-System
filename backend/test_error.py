import requests
import sys

resp = requests.post("http://127.0.0.1:8001/api/auth/login-password", json={
    "username": "admin",
    "password": "admin"
})
token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
users_resp = requests.get("http://127.0.0.1:8001/api/users", headers=headers)

if users_resp.status_code == 200:
    print("Success")
else:
    print(users_resp.text)
