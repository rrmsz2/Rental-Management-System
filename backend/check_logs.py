import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_logs():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.rental_management
    print('-- Settings --')
    settings = await db.settings.find_one({})
    if settings:
        print('whatsapp_api_key exists:', 'whatsapp_api_key' in settings)
    else:
        print('No settings document found')
        
    print('\n-- Recent Notification Logs --')
    async for log in db.notification_logs.find().sort('_id', -1).limit(5):
        print(f"Status: {log.get('status')}, Error: {log.get('error')}, Template: {log.get('template_key')}")

if __name__ == '__main__':
    asyncio.run(check_logs())
