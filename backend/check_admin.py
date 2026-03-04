import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check_admin():
    # Connect to MongoDB
    client = AsyncIOMotorClient(os.getenv("MONGO_URI", "mongodb://localhost:27017"))
    db = client[os.getenv("MONGO_DB", "rental_system")]

    # Check for admin user with the phone number
    phone = "+96892345218"

    print(f"Searching for user with phone: {phone}")

    # Find user by phone
    user = await db.users.find_one({"phone": phone})

    if user:
        print(f"Found user: {user}")
        print(f"Username: {user.get('username')}")
        print(f"Role: {user.get('role')}")
        print(f"Password field exists: {'password' in user or 'password_hash' in user}")
    else:
        print("User not found")

    # Check if username exists
    user_by_username = await db.users.find_one({"username": "admin"})
    if user_by_username:
        print(f"\nFound user by username 'admin': {user_by_username.get('phone')}")
    else:
        print("\nNo user found with username 'admin'")

    # List all users
    print("\n=== All users in database ===")
    async for user in db.users.find():
        print(f"Phone: {user.get('phone')}, Username: {user.get('username')}, Role: {user.get('role')}")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_admin())