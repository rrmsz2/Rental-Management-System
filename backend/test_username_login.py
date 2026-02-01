import requests

url = "http://127.0.0.1:8001/api/auth/login-password"
data = {
    "username": "admin",
    "password": "admin"
}

print(f"Connecting to {url}...")
try:
    resp = requests.post(url, json=data)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        print("Success! Token received.")
        print(resp.json().get('user'))
    else:
        print(f"Failed: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
