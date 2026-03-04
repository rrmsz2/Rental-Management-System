from pymongo import MongoClient
client = MongoClient("mongodb://localhost:27017/")
db = client.rental_management

users = db.users.find({}, {"phone": 1, "role": 1, "is_customer_only": 1, "is_manager": 1, "username": 1})
for u in users:
    print(f"Phone: {u.get('phone')}, Username: {u.get('username')}, Role: {u.get('role')}, CustomerOnly: {u.get('is_customer_only')}")
