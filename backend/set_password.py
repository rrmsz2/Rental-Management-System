import requests
import time

url = "http://127.0.0.1:8001/api/auth/set-password"
data = {
    "phone": "+96812345678",
    "password": "admin"
}

print(f"Connecting to {url}...")
try:
    resp = requests.post(url, json=data)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
