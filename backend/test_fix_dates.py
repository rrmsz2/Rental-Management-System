from pymongo import MongoClient
from datetime import datetime

client = MongoClient("mongodb://localhost:27017/")
db = client.rental_management

users = db.users.find()
fixed = 0

for user in users:
    created_at = user.get("created_at")
    # If it's a python datetime object coming straight from MongoDB (common with Mongo compass inserts or older mongoose models)
    if isinstance(created_at, datetime):
        db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"created_at": created_at.isoformat()}}
        )
        fixed += 1
    # also check if the role is still "customer" and map it, though we added it to the enum
    # let's map it to viewer just in case to be safe, since users API is explicitly staff management
    role = user.get("role")
    if role == "customer":
        db.users.update_one(
             {"_id": user["_id"]},
             {"$set": {"role": "viewer"}}
        )

print(f"Fixed datetime formatting on {fixed} users.")
