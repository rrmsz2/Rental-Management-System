#!/usr/bin/env python
"""Fix admin password using the correct hashing method"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

# Use the EXACT same password context as the app
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

async def fix_password():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.rental_system

    # Admin details
    phone = "+96892345218"
    password = "admin123"

    # Hash password using the same method as the app
    hashed_password_str = pwd_context.hash(password)

    # Update admin user
    result = await db.users.update_one(
        {"phone": phone},
        {"$set": {
            "password": hashed_password_str,
            "password_hash": hashed_password_str  # Store in both fields for compatibility
        }}
    )

    if result.modified_count > 0:
        print("Admin password fixed successfully!")
        print(f"  Phone: {phone}")
        print(f"  Username: admin")
        print(f"  Password: {password}")
        print("\nYou can now login with these credentials at /admin-login")
    else:
        print("No changes made")

    client.close()

if __name__ == "__main__":
    asyncio.run(fix_password())