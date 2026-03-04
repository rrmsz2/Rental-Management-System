#!/usr/bin/env python
"""Script to add username to admin user"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def add_username():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.rental_system

    # Admin phone
    phone = "+96892345218"

    # Update admin user with username
    update_data = {
        "$set": {
            "username": "admin",  # Simple username for admin
            "updated_at": datetime.utcnow()
        }
    }

    # Update admin
    result = await db.users.update_one(
        {"phone": phone},
        update_data
    )

    if result.modified_count > 0:
        print("Admin user updated successfully!")
        print("  Username: admin")
        print("  Phone: +96892345218")
        print("  Password: admin123")
        print("\nYou can now login with either username or phone number.")
    else:
        print("No changes made to admin user")

    client.close()

if __name__ == "__main__":
    asyncio.run(add_username())