import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.notification_service import NotificationService
from motor.motor_asyncio import AsyncIOMotorClient

async def test_notifications():
    # Initialize database
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.rental_management

    # Initialize notification service
    notification_service = NotificationService(db)

    # Get a sample customer and equipment
    customer = await db.customers.find_one({'phone': '+96895555386'})
    equipment = await db.equipment.find_one({'status': 'available'})

    if customer and equipment:
        print(f"Testing notifications for customer ID: {customer.get('_id')}")
        print(f"Phone: {customer.get('phone')}")
        print(f"WhatsApp opt-in: {customer.get('whatsapp_opt_in', True)}")

        # Test rental activated notification
        rental = {
            'contract_no': 'TEST-001',
            'start_date': '2024-03-01',
            'end_date': '2024-03-10',
            'daily_rate_snap': 100
        }

        print("\n1. Testing rental activation notification to customer...")
        result = await notification_service.notify_rental_activated(rental, customer, equipment)
        print(f"Result: {result}")

        # Test return notification
        print("\n2. Testing equipment return notification to customer...")
        result = await notification_service.notify_equipment_returned(rental, customer, equipment)
        print(f"Result: {result}")

        # Test invoice notification
        invoice = {
            'invoice_no': 'INV-TEST-001',
            'total': 1050
        }
        print("\n3. Testing invoice notification to customer...")
        result = await notification_service.notify_invoice_issued(invoice, customer, rental, equipment)
        print(f"Result: {result}")

        # Test payment notification
        print("\n4. Testing payment notification to customer...")
        result = await notification_service.notify_payment_received(invoice, customer)
        print(f"Result: {result}")

        print("\n✅ All notification tests completed!")
    else:
        print("Could not find test data (customer or equipment)")

    # Close connection
    client.close()

if __name__ == "__main__":
    asyncio.run(test_notifications())