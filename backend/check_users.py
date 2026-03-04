#!/usr/bin/env python
"""Script to check users in the system"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json
from datetime import datetime

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

async def check_users():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.rental_system

    # Get all users
    users = await db.users.find({}).to_list(None)

    print(f"Total users in database: {len(users)}\n")

    for i, user in enumerate(users, 1):
        print(f"User {i}:")
        print(f"  Phone: {user.get('phone', 'N/A')}")
        print(f"  Name: {user.get('name', 'N/A').encode('ascii', 'ignore').decode('ascii')}")
        print(f"  Role: {user.get('role', 'N/A')}")
        print(f"  Email: {user.get('email', 'N/A')}")
        print(f"  Has Password: {'Yes' if user.get('password') else 'No'}")
        print(f"  Active: {user.get('is_active', False)}")
        print("-" * 40)

    # Check specifically for admin with phone 92345218
    admin_phone = "+96892345218"
    admin = await db.users.find_one({"phone": admin_phone})

    if admin:
        print(f"\nAdmin with phone {admin_phone} EXISTS")
        print("Admin can login with:")
        print(f"  Phone: {admin_phone}")
        if admin.get('password'):
            print("  Password: [Password is set - use the password you know]")
        else:
            print("  Password: Not set - needs to be configured")
    else:
        print(f"\nAdmin with phone {admin_phone} NOT FOUND")
        print("You may need to add this admin user.")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_users())