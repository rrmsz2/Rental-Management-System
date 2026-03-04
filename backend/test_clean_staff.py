from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client.rental_management

# Find all staff members who might have been flagged as customers
staff_query = {"role": {"$in": ["admin", "sales", "rentals", "viewer"]}}
staff_users = db.users.find(staff_query)
fixed_count = 0

for _user in staff_users:
    if _user.get("is_customer_only", True) is True:
        db.users.update_one(
             {"_id": _user["_id"]},
             {"$set": {"is_customer_only": False}}
        )
        fixed_count += 1

print(f"Fixed {fixed_count} staff accounts that were locked as customers.")
