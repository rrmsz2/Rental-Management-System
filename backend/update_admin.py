#!/usr/bin/env python
"""Script to update admin user in the system"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import bcrypt

async def update_admin():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.rental_system

    # Admin details
    phone = "+96892345218"

    # Set a known password
    password = "admin123"
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    # Update admin user
    update_data = {
        "$set": {
            "name": "System Admin",
            "password": hashed_password.decode('utf-8'),
            "updated_at": datetime.utcnow(),
            "is_active": True
        }
    }

    # Update admin
    result = await db.users.update_one(
        {"phone": phone},
        update_data
    )

    if result.modified_count > 0 or result.matched_count > 0:
        print(f"Admin user updated successfully!")
        print(f"  Phone: {phone}")
        print(f"  Name: System Admin")
        print(f"  Password: {password}")
        print(f"  Role: admin")
        print("\nYou can now login with these credentials.")
    else:
        print("No admin found to update or no changes made")

    client.close()

if __name__ == "__main__":
    asyncio.run(update_admin())