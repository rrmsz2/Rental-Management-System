import urllib.request
import urllib.error
import json
from datetime import datetime
from uuid import uuid4

base_url = "http://localhost:8001/api"
login_url = f"{base_url}/auth/login-password"
data = json.dumps({"username":"+96892345218", "password":"admin123"}).encode("utf-8")

req = urllib.request.Request(login_url, data=data, headers={"Content-Type": "application/json"})
response = urllib.request.urlopen(req)
token = json.loads(response.read())["access_token"]
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

# 1. Fetch available equipment and customers
customers = json.loads(urllib.request.urlopen(urllib.request.Request(f"{base_url}/customers", headers=headers)).read())
equipments = json.loads(urllib.request.urlopen(urllib.request.Request(f"{base_url}/equipment", headers=headers)).read())

available_eq = next((e for e in equipments if e["status"] == "available"), None)
if not available_eq:
    print("No available equipment")
    exit(1)
c = customers[0]

# 2. Create rental
print(f"Creating rental for Equipment (ID: {available_eq['id']})")
rental_data = {
    "customer_id": c["id"],
    "equipment_id": available_eq["id"],
    "start_date": datetime.now().isoformat(),
    "end_date": datetime.now().isoformat(),
    "deposit": 100.0,
    "notes": "Test Rental"
}
try:
    req = urllib.request.Request(f"{base_url}/rentals", data=json.dumps(rental_data).encode("utf-8"), headers=headers, method="POST")
    res = urllib.request.urlopen(req)
    rental = json.loads(res.read())
    print(f"Created rental: {rental['id']} - Status: {rental['status']}")
except urllib.error.HTTPError as e:
    print("Create Rental FAIL:", e.code, e.read().decode("utf-8"))
    exit(1)

# 3. Close rental
print(f"Closing rental {rental['id']}")
close_url = f"{base_url}/rentals/{rental['id']}/close?tax_rate=0.05&discount_amount=0.0&paid=false"
try:
    req = urllib.request.Request(close_url, data=b"", headers=headers, method="POST")
    res = urllib.request.urlopen(req)
    close_data = json.loads(res.read())
    print("Closed rental. Invoice ID:", close_data["invoice"]["id"])
    invoice_id = close_data["invoice"]["id"]
except urllib.error.HTTPError as e:
    print("Close Rental FAIL:", e.code, e.read().decode("utf-8"))
    exit(1)

# 4. Mark invoice paid
print(f"Marking invoice {invoice_id} paid")
paid_url = f"{base_url}/invoices/{invoice_id}/mark-paid?payment_method=cash"
try:
    req = urllib.request.Request(paid_url, data=b"", headers=headers, method="POST")
    urllib.request.urlopen(req)
    print("Mark Paid SUCCESS")
except urllib.error.HTTPError as e:
    print("Mark Paid FAIL:", e.code, e.read().decode("utf-8"))
