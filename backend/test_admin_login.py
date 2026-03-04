#!/usr/bin/env python
"""Test admin login"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt

async def test_login():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.rental_system

    # Find admin user
    admin = await db.users.find_one({"phone": "+96892345218"})

    if not admin:
        print("Admin user not found!")
        return

    print(f"Admin found:")
    print(f"  Username: {admin.get('username', 'NOT SET')}")
    print(f"  Phone: {admin.get('phone')}")
    print(f"  Name: {admin.get('name', 'NOT SET')}")
    print(f"  Role: {admin.get('role')}")
    print(f"  Has Password: {'Yes' if admin.get('password') else 'No'}")

    # Test password
    test_password = "admin123"
    stored_password = admin.get('password')

    if stored_password:
        # Test if it's already hashed correctly
        try:
            is_valid = bcrypt.checkpw(
                test_password.encode('utf-8'),
                stored_password.encode('utf-8')
            )
            print(f"\nPassword 'admin123' is valid: {is_valid}")

            if not is_valid:
                print("Password mismatch! Let me update it...")
                # Update with correct password
                new_hash = bcrypt.hashpw(test_password.encode('utf-8'), bcrypt.gensalt())
                await db.users.update_one(
                    {"phone": "+96892345218"},
                    {"$set": {"password": new_hash.decode('utf-8')}}
                )
                print("Password updated successfully!")
        except Exception as e:
            print(f"Error checking password: {e}")
            print("Setting new password...")
            new_hash = bcrypt.hashpw(test_password.encode('utf-8'), bcrypt.gensalt())
            await db.users.update_one(
                {"phone": "+96892345218"},
                {"$set": {"password": new_hash.decode('utf-8')}}
            )
            print("Password updated successfully!")
    else:
        print("\nNo password set! Setting one now...")
        new_hash = bcrypt.hashpw(test_password.encode('utf-8'), bcrypt.gensalt())
        await db.users.update_one(
            {"phone": "+96892345218"},
            {"$set": {"password": new_hash.decode('utf-8')}}
        )
        print("Password set successfully!")

    client.close()

if __name__ == "__main__":
    asyncio.run(test_login())