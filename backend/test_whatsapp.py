import asyncio
import httpx
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.rental_management
    
    settings = await db.settings.find_one({})
    key = settings.get("whatsapp_api_key", "")
    print(f'Using Key: {key}')
    phone = "+96895555386"
    
    url = "http://api.textmebot.com/send.php"
    params = {
        "recipient": phone,
        "apikey": key,
        "text": "test_message"
    }
    
    print(f"Requesting: {url} with params {params}")
    async with httpx.AsyncClient() as client:
        # Try once with '+'
        resp = await client.get(url, params=params)
        print(f"Response with + {phone}: {resp.status_code} - {resp.text}")
        
        # Try again without '+'
        params['recipient'] = phone.replace("+", "")
        print(f"Trying without +: {params['recipient']}")
        resp2 = await client.get(url, params=params)
        print(f"Response without +: {resp2.status_code} - {resp2.text}")

if __name__ == '__main__':
    asyncio.run(check())
