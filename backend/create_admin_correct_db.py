import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from passlib.context import CryptContext
from datetime import datetime

load_dotenv()

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

async def create_admin():
    # Connect to MongoDB - Use the correct database name from .env
    client = AsyncIOMotorClient(os.getenv("MONGO_URL", "mongodb://localhost:27017"))
    db = client[os.getenv("DB_NAME", "rental_management")]  # Use DB_NAME not MONGO_DB

    phone = "+96892345218"
    password = "admin123"

    print(f"Creating admin in database: {os.getenv('DB_NAME')}")

    # Check if user exists
    user = await db.users.find_one({"phone": phone})

    if user:
        print(f"User with phone {phone} already exists, updating...")
        # Update existing user
        hashed_password = pwd_context.hash(password)
        result = await db.users.update_one(
            {"phone": phone},
            {"$set": {
                "username": "admin",
                "password": hashed_password,
                "password_hash": hashed_password,
                "role": "admin",
                "is_active": True,
                "updated_at": datetime.utcnow()
            }}
        )
        print(f"Updated: {result.modified_count} document(s)")
    else:
        print(f"Creating new admin user...")
        # Create new user
        hashed_password = pwd_context.hash(password)
        user_doc = {
            "name": "System Admin",
            "phone": phone,
            "username": "admin",
            "role": "admin",
            "password": hashed_password,
            "password_hash": hashed_password,
            "is_active": True,
            "email": "admin@rental-system.com",
            "created_at": datetime.utcnow()
        }
        result = await db.users.insert_one(user_doc)
        print(f"Created user with ID: {result.inserted_id}")

    # Verify the user was created/updated correctly
    user = await db.users.find_one({"phone": phone})
    if user:
        print(f"\n✓ Admin user confirmed in database")
        print(f"  Phone: {user.get('phone')}")
        print(f"  Username: {user.get('username')}")
        print(f"  Role: {user.get('role')}")
        print(f"  Has password: {'password' in user or 'password_hash' in user}")

        # Test password verification
        password_field = user.get("password_hash") or user.get("password")
        if password_field:
            result = pwd_context.verify(password, password_field)
            print(f"  Password verification: {'✓ PASS' if result else '✗ FAIL'}")

    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())