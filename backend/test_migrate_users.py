from pymongo import MongoClient
import uuid
from datetime import datetime

client = MongoClient("mongodb://localhost:27017/")
db = client.rental_management

users = db.users.find({})
count = 0

for user in users:
    updates = {}
    
    # 1. Map old roles to new enums
    role = user.get("role")
    if role not in ["admin", "sales", "rentals", "viewer"]:
        if role == "employee":
            updates["role"] = "sales"
        elif role == "accountant":
            updates["role"] = "viewer"
        else:
            # Customers remain customers? But the enum only allows admin, sales, rentals, viewer.
            # Wait, auth.py sets 'customer' role. We might need to allow 'customer' in UserRole enum
            # or map them to 'viewer' if they are internal users.
            # Auth.py uses 'customer' for external users, but the Users API typically serves staff.
            # Let's map customer to viewer for now, or just leave it. 
            pass

    # 2. Add 'id' if missing
    if "id" not in user:
        updates["id"] = str(uuid.uuid4())
        
    # 3. Rename 'name' to 'full_name' if 'full_name' is missing
    if "full_name" not in user:
        if "name" in user:
            updates["full_name"] = user["name"]
        else:
            updates["full_name"] = "مستخدم جديد"
            
    # 4. Fix 'created_at' if it's a datetime object
    created_at = user.get("created_at")
    if isinstance(created_at, datetime):
        updates["created_at"] = created_at.isoformat()
        
    if updates:
        db.users.update_one({"_id": user["_id"]}, {"$set": updates})
        count += 1

print(f"Migrated {count} legacy user records.")
