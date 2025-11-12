"""
Script to update existing users with full_name field
Run this once to migrate old users
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def update_users():
    # Connect to MongoDB
    mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client.rental_db
    
    print("Starting user update...")
    
    # Find all users without full_name or with empty full_name
    users = await db.users.find({}).to_list(1000)
    
    updated_count = 0
    for user in users:
        needs_update = False
        update_data = {}
        
        # Check if full_name is missing or equals phone
        if not user.get('full_name') or user.get('full_name') == user.get('phone'):
            # Try to get name from customer record
            if user.get('customer_id'):
                customer = await db.customers.find_one({"id": user['customer_id']})
                if customer and customer.get('full_name'):
                    update_data['full_name'] = customer['full_name']
                    needs_update = True
        
        # Ensure role field exists
        if not user.get('role'):
            if user.get('is_manager'):
                update_data['role'] = 'admin'
            else:
                update_data['role'] = 'employee'
            needs_update = True
        
        # Update if needed
        if needs_update:
            await db.users.update_one(
                {"_id": user['_id']},
                {"$set": update_data}
            )
            updated_count += 1
            print(f"Updated user: {user.get('phone')} - {update_data}")
    
    print(f"\nUpdate complete! Updated {updated_count} users.")
    client.close()

if __name__ == "__main__":
    asyncio.run(update_users())
