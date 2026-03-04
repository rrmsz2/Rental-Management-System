import urllib.request
import urllib.error
import json

base_url = "http://127.0.0.1:8001/api"
login_url = f"{base_url}/auth/login-password"
data = json.dumps({"username":"+96892345218", "password":"admin123"}).encode("utf-8")

req = urllib.request.Request(login_url, data=data, headers={"Content-Type": "application/json"})
try:
    response = urllib.request.urlopen(req)
    response_data = json.loads(response.read())
    token = response_data["access_token"]
    print("Login successful.")
except urllib.error.URLError as e:
    print("Login failed:", e)
    if hasattr(e, "read"):
        print(e.read().decode())
    exit(1)

endpoints = [
    "/rentals",
    "/invoices",
    "/customers",
    "/equipment"
]

for endpoint in endpoints:
    url = f"{base_url}{endpoint}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    try:
        res = urllib.request.urlopen(req)
        print(f"OK: GET {endpoint} -> {res.getcode()} (Len: {len(res.read())})")
    except urllib.error.HTTPError as e:
        print(f"FAIL: GET {endpoint} -> {e.code}")
        print("  Error:", e.read().decode())
    except Exception as e:
        print(f"FAIL: GET {endpoint} -> {type(e).__name__}: {e}")
