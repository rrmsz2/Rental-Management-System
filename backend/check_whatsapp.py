import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.rental_management
    
    settings = await db.settings.find_one({})
    key = settings.get("whatsapp_api_key", "")
    print(f'API Key length: {len(key)}, Key prefix: {key[:5]}...')
    
    print('\nRecent logs details:')
    async for log in db.notification_logs.find().sort('_id', -1).limit(5):
        print(f"Phone: {log.get('to_phone')}")
        print(f"Status: {log.get('status')}")
        print(f"Provider_ID: {log.get('provider_message_id')}")
        print(f"Error: {log.get('error')}")
        print("-" * 20)

if __name__ == '__main__':
    asyncio.run(check())
