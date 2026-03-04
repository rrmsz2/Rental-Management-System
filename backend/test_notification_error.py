import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from services.notification_service import NotificationService
import os
from dotenv import load_dotenv

load_dotenv()
client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
db = client[os.getenv("DB_NAME")]

async def test_error():
    invoices = await db.invoices.find({}).to_list(10)
    for invoice in invoices:
        print(f"Testing invoice {invoice.get('id')} with contract_id {invoice.get('contract_id')}")
        
        rental = await db.rental_contracts.find_one({"id": invoice.get("contract_id")})
        if not rental:
            print(f"Rental not found for invoice {invoice.get('id')}")
            continue
            
        print(f"Found rental {rental.get('id')}")
        customer = await db.customers.find_one({"id": rental.get("customer_id")})
        if not customer:
            print(f"Customer not found for rental {rental.get('id')}")
            continue
            
        print(f"Found customer {customer.get('id')}")
        
        try:
            ns = NotificationService(db)
            await ns.notify_payment_received(invoice, customer)
            print("Notification sent successfully")
        except Exception as e:
            print(f"Notification error: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()

asyncio.run(test_error())
