import urllib.request
import urllib.parse
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import json

async def run():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.rental_management
    settings = await db.settings.find_one({})
    key = settings.get('whatsapp_api_key', '')
    
    print(f"Using key: {key[:5]}...")
    phone_with_plus = '+96895555386'
    
    print('Testing with + prefix')
    params_plus = urllib.parse.urlencode({'recipient': phone_with_plus, 'apikey': key, 'text': 'test_message_1'})
    url_plus = f'http://api.textmebot.com/send.php?{params_plus}'
    try:
        req = urllib.request.Request(url_plus, headers={'User-Agent': 'Mozilla'})
        resp = urllib.request.urlopen(req)
        print(f'Status: {resp.status} - Response: {resp.read().decode("utf-8")}')
    except Exception as e:
        print(f'Error: {e}')
        
    print('\nTesting without + prefix')
    phone_no_plus = '96895555386'
    params_no = urllib.parse.urlencode({'recipient': phone_no_plus, 'apikey': key, 'text': 'test_message_2'})
    url_no = f'http://api.textmebot.com/send.php?{params_no}'
    try:
        req = urllib.request.Request(url_no, headers={'User-Agent': 'Mozilla'})
        resp = urllib.request.urlopen(req)
        print(f'Status: {resp.status} - Response: {resp.read().decode("utf-8")}')
    except Exception as e:
        print(f'Error: {e}')

if __name__ == "__main__":
    asyncio.run(run())
