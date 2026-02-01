from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path
from services.security import get_password_hash

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'rental_management')

async def set_admin_credentials():
    print(f"Connecting to MongoDB at {MONGO_URL}...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    phone = "+96812345678"
    username = "admin"
    password = "admin"
    
    print(f"Updating user {phone}...")
    print(f"New Username: {username}")
    print(f"New Password: {password}")
    
    hashed_password = get_password_hash(password)
    
    result = await db.users.update_one(
        {"phone": phone},
        {
            "$set": {
                "username": username,
                "password_hash": hashed_password
            }
        }
    )
    
    if result.matched_count > 0:
        print("✅ User updated successfully!")
    else:
        print("❌ User not found with phone:", phone)
        # Create user if not exists?
        print("Detailed search...")
        user = await db.users.find_one({"phone": phone})
        print(f"User check: {user}")

if __name__ == "__main__":
    asyncio.run(set_admin_credentials())
