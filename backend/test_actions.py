import urllib.request
import urllib.error
import urllib.parse
import json

base_url = "http://127.0.0.1:8001/api"
login_url = f"{base_url}/auth/login-password"
data = json.dumps({"username":"+96892345218", "password":"admin123"}).encode("utf-8")

req = urllib.request.Request(login_url, data=data, headers={"Content-Type": "application/json"})
response = urllib.request.urlopen(req)
token = json.loads(response.read())["access_token"]

# 1. Test update rental
url = f"{base_url}/rentals"
req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
rentals = json.loads(urllib.request.urlopen(req).read())
print(f"Got {len(rentals)} rentals")

if rentals:
    r = rentals[0]
    rid = r["id"]
    print(f"Testing actions on rental {rid} with status {r['status']}")

    # Try to close the rental
    close_url = f"{base_url}/rentals/{rid}/close?tax_rate=0.05&discount_amount=0.0&paid=false"
    req = urllib.request.Request(close_url, data=b"", headers={"Authorization": f"Bearer {token}"}, method="POST")
    try:
        res = urllib.request.urlopen(req)
        print("Close Rental OK:", res.getcode())
    except urllib.error.HTTPError as e:
        print("Close Rental FAIL:", e.code, e.read().decode())
    
    # Try to activate the rental
    activate_url = f"{base_url}/rentals/{rid}/activate"
    req = urllib.request.Request(activate_url, data=b"", headers={"Authorization": f"Bearer {token}"}, method="POST")
    try:
        res = urllib.request.urlopen(req)
        print("Activate Rental OK:", res.getcode())
    except urllib.error.HTTPError as e:
        print("Activate Rental FAIL:", e.code, e.read().decode())

# Test mark invoice paid
url = f"{base_url}/invoices"
req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
invoices = json.loads(urllib.request.urlopen(req).read())
if invoices:
    i = invoices[0]
    iid = i["id"]
    print(f"Testing actions on invoice {iid} with paid status {i['paid']}")
    # Try to mark paid
    paid_url = f"{base_url}/invoices/{iid}/mark-paid?payment_method=cash"
    req = urllib.request.Request(paid_url, data=b"", headers={"Authorization": f"Bearer {token}"}, method="POST")
    try:
        res = urllib.request.urlopen(req)
        print("Mark Paid OK:", res.getcode())
    except urllib.error.HTTPError as e:
        print("Mark Paid FAIL:", e.code, e.read().decode())
