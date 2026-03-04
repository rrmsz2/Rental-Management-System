import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

async def test_login():
    # Connect to MongoDB
    client = AsyncIOMotorClient(os.getenv("MONGO_URI", "mongodb://localhost:27017"))
    db = client[os.getenv("MONGO_DB", "rental_system")]

    test_cases = [
        {"username": "admin"},
        {"username": "+96892345218"},
        {"phone": "+96892345218"}
    ]

    for test in test_cases:
        print(f"\n=== Testing query: {test} ===")
        user = await db.users.find_one(test)

        if user:
            print(f"Found user: {user.get('phone')}, username: {user.get('username')}")

            # Test password verification
            password_field = user.get("password_hash") or user.get("password")
            if password_field:
                result = pwd_context.verify("admin123", password_field)
                print(f"Password verification: {result}")
            else:
                print("No password field found")
        else:
            print("User not found with this query")

    # Now test the exact logic from auth.py
    print("\n=== Testing auth.py logic ===")

    # Test with username "admin"
    request_username = "admin"
    print(f"Login attempt with username: {request_username}")

    user = await db.users.find_one({"username": request_username})

    if not user:
        print(f"User not found by username, trying phone...")
        user = await db.users.find_one({"phone": request_username})

    if not user:
        print(f"User not found at all for: {request_username}")
    else:
        print(f"SUCCESS! Found user: {user.get('phone')}")

    # Test with phone number
    request_username = "+96892345218"
    print(f"\nLogin attempt with username: {request_username}")

    user = await db.users.find_one({"username": request_username})

    if not user:
        print(f"User not found by username, trying phone...")
        user = await db.users.find_one({"phone": request_username})

    if not user:
        print(f"User not found at all for: {request_username}")
    else:
        print(f"SUCCESS! Found user: {user.get('phone')}")

    client.close()

if __name__ == "__main__":
    asyncio.run(test_login())