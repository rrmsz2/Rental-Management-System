import requests
import json
import sys

# We'll try hitting the login endpoint with "admin" / "admin"
# and also try typical passwords if that fails.
passwords = ["admin", "123456", "password", "1234"]

for pwd in passwords:
    resp = requests.post("http://127.0.0.1:8000/api/auth/login-password", json={
        "username": "admin",
        "password": pwd
    })
    print(f"Testing password: '{pwd}' - Status: {resp.status_code}")
    if resp.status_code == 200:
        print("Success! Token received.")
        sys.exit(0)
    else:
        print(resp.json())

# If both fail, let's reset the password via pymongo and passlib directly
print("All default passwords failed. We likely just have a mismatched password.")
