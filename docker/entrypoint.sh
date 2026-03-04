#!/bin/bash
set -e

echo "🚀 Starting Rental Management System..."

# Check if MongoDB is accessible
echo "🔍 Checking MongoDB connection..."
python -c "
import os
from pymongo import MongoClient
import sys

mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
try:
    client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
    client.server_info()
    print('✅ MongoDB is accessible')
except Exception as e:
    print(f'❌ MongoDB connection failed: {e}')
    print('⚠️  Make sure MongoDB is running and accessible')
    sys.exit(1)
"

# Run database migrations if needed
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "🔄 Running database migrations..."
    cd /app/backend
    python -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def create_indexes():
    client = AsyncIOMotorClient(os.getenv('MONGO_URL', 'mongodb://localhost:27017'))
    db = client[os.getenv('DB_NAME', 'rental_management')]

    # Create indexes for better performance
    await db.users.create_index('phone', unique=True)
    await db.users.create_index('username', sparse=True)
    await db.customers.create_index('phone', unique=True)
    await db.equipment.create_index('id', unique=True)
    await db.rental_contracts.create_index('id', unique=True)
    await db.invoices.create_index('id', unique=True)

    print('✅ Database indexes created')

asyncio.run(create_indexes())
    "
fi

# Create initial admin user if not exists
if [ "$CREATE_ADMIN" = "true" ] && [ -n "$ADMIN_PASSWORD" ]; then
    echo "👤 Creating admin user..."
    cd /app/backend
    python -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from services.security import get_password_hash
import os
import uuid
from datetime import datetime, timezone

async def create_admin():
    client = AsyncIOMotorClient(os.getenv('MONGO_URL', 'mongodb://localhost:27017'))
    db = client[os.getenv('DB_NAME', 'rental_management')]

    admin_phone = os.getenv('ADMIN_PHONE', '+96812345678')
    existing = await db.users.find_one({'phone': admin_phone})

    if not existing:
        admin_user = {
            'id': str(uuid.uuid4()),
            'phone': admin_phone,
            'username': 'admin',
            'password_hash': get_password_hash(os.getenv('ADMIN_PASSWORD')),
            'full_name': 'System Administrator',
            'role': 'admin',
            'email': os.getenv('ADMIN_EMAIL', 'admin@rental.om'),
            'is_active': True,
            'is_manager': True,
            'is_customer_only': False,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        print('✅ Admin user created')
    else:
        print('ℹ️  Admin user already exists')

asyncio.run(create_admin())
    "
fi

echo "✅ All checks passed, starting services..."

# Start supervisor
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf