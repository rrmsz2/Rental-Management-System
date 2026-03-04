import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from models import RentalContract, Invoice
from pydantic import ValidationError
import os
from dotenv import load_dotenv

load_dotenv()
client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
db = client[os.getenv("DB_NAME")]

async def test_validation():
    print("Testing Rentals...")
    rentals = await db.rental_contracts.find({}).to_list(10)
    for r in rentals:
        r.pop("_id", None)
        try:
            RentalContract(**r)
            print(f"Rental {r.get('id')} OK")
        except ValidationError as e:
            print(f"\nRental {r.get('id')} Validation Error:")
            print(e)

    print("\nTesting Invoices...")
    invoices = await db.invoices.find({}).to_list(10)
    for i in invoices:
        i.pop("_id", None)
        try:
            Invoice(**i)
            print(f"Invoice {i.get('id')} OK")
        except ValidationError as e:
            print(f"\nInvoice {i.get('id')} Validation Error:")
            print(e)

asyncio.run(test_validation())
