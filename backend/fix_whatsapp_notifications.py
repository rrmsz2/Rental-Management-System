# -*- coding: utf-8 -*-
from pymongo import MongoClient
import json

client = MongoClient('mongodb://localhost:27017')
db = client.rental_management

# Check customers' WhatsApp opt-in status
customers = list(db.customers.find({}, {'full_name': 1, 'phone': 1, 'whatsapp_opt_in': 1}))
print('Customer WhatsApp Opt-In Status:')
for customer in customers:
    opt_in = customer.get('whatsapp_opt_in', True)
    print(f"Customer ID: {customer.get('_id', 'N/A')} - Phone: {customer.get('phone', 'N/A')} - Opt-In: {opt_in}")

# Update all customers to opt-in
result = db.customers.update_many({}, {'$set': {'whatsapp_opt_in': True}})
print(f"\nUpdated {result.modified_count} customers to opt-in for WhatsApp")

# Update settings with manager phone
db.settings.update_one({}, {'$set': {'manager_phone': '+96892345218'}})
print("\nUpdated manager phone to: +96892345218")

# Verify settings
settings = db.settings.find_one({})
if settings:
    print('\nVerified Settings:')
    print(f"WhatsApp API Key: {settings.get('whatsapp_api_key', 'NOT SET')}")
    print(f"Instance ID: {settings.get('whatsapp_instance_id', 'NOT SET')}")
    print(f"Manager Phone: {settings.get('manager_phone', 'NOT SET')}")