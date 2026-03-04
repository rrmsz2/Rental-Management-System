from pymongo import MongoClient
from bson.json_util import dumps

client = MongoClient("mongodb://localhost:27017/")
db = client.rental_management

admins = list(db.users.find({"role": "admin"}))

with open("admin_dump.json", "w", encoding="utf-8") as f:
    f.write(dumps(admins, indent=2, ensure_ascii=False))
