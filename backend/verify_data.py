"""
Quick verification script to check database contents
"""
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'rental_management')

async def verify_data():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("📊 Database Contents:")
    print(f"   Users: {await db.users.count_documents({})}")
    print(f"   Employees: {await db.employees.count_documents({})}")
    print(f"   Customers: {await db.customers.count_documents({})}")
    print(f"   Equipment: {await db.equipment.count_documents({})}")
    print(f"   Rentals: {await db.rental_contracts.count_documents({})}")
    print(f"   Invoices: {await db.invoices.count_documents({})}")
    print(f"   Settings: {await db.settings.count_documents({})}")

if __name__ == "__main__":
    asyncio.run(verify_data())
