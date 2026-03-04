#!/usr/bin/env python
"""Script to add admin user to the system"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import bcrypt

async def add_admin():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.rental_system

    # Admin details
    phone = "+96892345218"

    # Check if admin already exists
    existing = await db.users.find_one({"phone": phone})
    if existing:
        print(f"Admin with phone {phone} already exists:")
        print(f"  Name: {existing.get('name', 'N/A')}")
        print(f"  Role: {existing.get('role', 'N/A')}")
        return

    # Hash a default password
    password = "admin123"  # Default password - should be changed after first login
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    # Create admin user
    admin = {
        "name": "مدير النظام",
        "phone": phone,
        "role": "admin",
        "password": hashed_password.decode('utf-8'),
        "created_at": datetime.utcnow(),
        "is_active": True,
        "email": "admin@rental-system.com"
    }

    # Insert admin
    result = await db.users.insert_one(admin)

    if result.inserted_id:
        print(f"Successfully added admin user:")
        print(f"  Phone: {phone}")
        print(f"  Name: {admin['name']}")
        print(f"  Password: {password}")
        print(f"  Role: admin")
        print("\nIMPORTANT: Please change the password after first login!")
    else:
        print("Failed to add admin user")

    client.close()

if __name__ == "__main__":
    asyncio.run(add_admin())