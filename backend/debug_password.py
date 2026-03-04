#!/usr/bin/env python
"""Debug password verification"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

# Use the EXACT same password context as the app
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

async def debug():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.rental_system

    # Admin details
    phone = "+96892345218"
    test_password = "admin123"

    # Find admin user
    admin = await db.users.find_one({"phone": phone})

    if not admin:
        print("Admin not found!")
        return

    print(f"Admin found:")
    print(f"  Phone: {admin.get('phone')}")
    print(f"  Username: {admin.get('username', 'NOT SET')}")

    # Check password fields
    password_field = admin.get('password')
    password_hash_field = admin.get('password_hash')

    print(f"\nPassword fields:")
    print(f"  'password' field exists: {password_field is not None}")
    print(f"  'password_hash' field exists: {password_hash_field is not None}")

    # Try to verify the password
    stored_hash = password_field or password_hash_field

    if stored_hash:
        print(f"\nStored hash starts with: {stored_hash[:30]}...")

        # Check if it's a valid pbkdf2_sha256 hash
        if stored_hash.startswith('$pbkdf2-sha256$'):
            print("Hash format looks correct for pbkdf2_sha256")
            try:
                result = pwd_context.verify(test_password, stored_hash)
                print(f"Password verification result: {result}")
            except Exception as e:
                print(f"Verification error: {e}")
        else:
            print(f"Hash format doesn't match pbkdf2_sha256 (should start with '$pbkdf2-sha256$')")
            print("Let me fix this by setting the correct hash...")

            # Set correct hash
            correct_hash = pwd_context.hash(test_password)
            await db.users.update_one(
                {"phone": phone},
                {"$set": {
                    "password": correct_hash,
                    "password_hash": correct_hash
                }}
            )
            print("Password hash updated successfully!")

    client.close()

if __name__ == "__main__":
    asyncio.run(debug())