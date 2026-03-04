import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()
client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
db = client[os.getenv("DB_NAME")]

async def migrate_data():
    # Fix rental statuses
    result1 = await db.rental_contracts.update_many(
        {"status": "completed"},
        {"$set": {"status": "closed"}}
    )
    print(f"Fixed {result1.modified_count} rentals with 'completed' status")
    
    # Fix invoices missing contract_id
    invoices = await db.invoices.find({}).to_list(100)
    for invoice in invoices:
        if "contract_id" not in invoice:
            if "rental_id" in invoice:
                await db.invoices.update_one(
                    {"_id": invoice["_id"]},
                    {"$set": {"contract_id": invoice["rental_id"]}, "$unset": {"rental_id": ""}}
                )
                print(f"Migrated rental_id to contract_id for invoice {invoice.get('id')}")
            else:
                # If neither is present, we might have to delete or handle it, let's see
                print(f"Invoice {invoice.get('id')} has NO rental_id or contract_id. Keys: {list(invoice.keys())}")

asyncio.run(migrate_data())
