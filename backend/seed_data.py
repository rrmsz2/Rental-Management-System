"""
Seed script to populate the database with sample data
"""
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timedelta, timezone
import uuid
from services.security import get_password_hash

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'rental_management')

async def seed_database():
    print(f"🔌 Connecting to MongoDB at {MONGO_URL}...")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🗑️  Clearing existing data...")
    await db.customers.delete_many({})
    await db.equipment.delete_many({})
    await db.rental_contracts.delete_many({})
    await db.invoices.delete_many({})
    await db.users.delete_many({})
    await db.employees.delete_many({})
    
    # 1. Create Users
    print("👥 Creating users...")
    admin_user = {
        "id": str(uuid.uuid4()),
        "phone": "+96812345678",
        "username": "admin",
        "full_name": "مدير النظام",
        "role": "admin",
        "email": "admin@rental.om",
        "is_active": True,
        "is_manager": True,
        "is_customer_only": False,
        "password_hash": get_password_hash("admin"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    employee_user = {
        "id": str(uuid.uuid4()),
        "phone": "+96887654321",
        "username": "employee1",
        "full_name": "أحمد محمد",
        "role": "employee",
        "email": "ahmed@rental.om",
        "is_active": True,
        "is_manager": False,
        "is_customer_only": False,
        "password_hash": get_password_hash("employee123"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_many([admin_user, employee_user])
    print(f"   ✅ Created {2} users")
    
    # 2. Create Employees
    print("👔 Creating employees...")
    employees = [
        {
            "id": str(uuid.uuid4()),
            "full_name": "أحمد محمد",
            "phone": "+96887654321",
            "email": "ahmed@rental.om",
            "position": "موظف مبيعات",
            "hire_date": (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d"),
            "salary": 500.0,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "full_name": "فاطمة علي",
            "phone": "+96891234567",
            "email": "fatima@rental.om",
            "position": "محاسبة",
            "hire_date": (datetime.now() - timedelta(days=200)).strftime("%Y-%m-%d"),
            "salary": 600.0,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.employees.insert_many(employees)
    print(f"   ✅ Created {len(employees)} employees")
    
    # 3. Create Customers
    print("🧑‍🤝‍🧑 Creating customers...")
    customers = [
        {
            "id": str(uuid.uuid4()),
            "full_name": "سالم بن خالد",
            "phone": "+96899887766",
            "email": "salem@example.om",
            "civil_id": "12345678",
            "address": "مسقط، الخوير",
            "whatsapp_opt_in": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "full_name": "مريم بنت سعيد",
            "phone": "+96898765432",
            "email": "maryam@example.om",
            "civil_id": "87654321",
            "address": "صلالة، الدهاريز",
            "whatsapp_opt_in": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "full_name": "محمد بن علي",
            "phone": "+96897654321",
            "email": "mohammed@example.om",
            "civil_id": "11223344",
            "address": "نزوى، المركز",
            "whatsapp_opt_in": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.customers.insert_many(customers)
    print(f"   ✅ Created {len(customers)} customers")
    
    # 4. Create Equipment
    print("🛠️  Creating equipment...")
    equipment_list = [
        {
            "id": str(uuid.uuid4()),
            "name": "خلاطة خرسانة كبيرة",
            "category": "معدات بناء",
            "daily_rate": 25.0,
            "status": "available",
            "description": "خلاطة خرسانة سعة 500 لتر",
            "serial_number": "MIX-001",
            "purchase_date": "2024-01-15",
            "condition": "excellent",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "مولد كهربائي 10 كيلو واط",
            "category": "مولدات",
            "daily_rate": 15.0,
            "status": "rented",
            "description": "مولد ديزل صامت",
            "serial_number": "GEN-002",
            "purchase_date": "2024-02-20",
            "condition": "good",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "سقالة معدنية 6 متر",
            "category": "سقالات",
            "daily_rate": 8.0,
            "status": "available",
            "description": "سقالة معدنية قابلة للتعديل",
            "serial_number": "SCAF-003",
            "purchase_date": "2023-11-10",
            "condition": "good",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "حفارة صغيرة",
            "category": "معدات حفر",
            "daily_rate": 45.0,
            "status": "maintenance",
            "description": "حفارة ميني 1.5 طن",
            "serial_number": "EXC-004",
            "purchase_date": "2023-08-05",
            "condition": "fair",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "منشار كهربائي",
            "category": "أدوات كهربائية",
            "daily_rate": 5.0,
            "status": "available",
            "description": "منشار دائري 1800 واط",
            "serial_number": "SAW-005",
            "purchase_date": "2024-03-12",
            "condition": "excellent",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.equipment.insert_many(equipment_list)
    print(f"   ✅ Created {len(equipment_list)} equipment items")
    
    # 5. Create Rental Contracts
    print("📋 Creating rental contracts...")
    
    # Active rental (generator is rented)
    active_rental = {
        "id": str(uuid.uuid4()),
        "contract_no": "RC-2026-001",
        "customer_id": customers[0]["id"],
        "equipment_id": equipment_list[1]["id"],  # Generator
        "start_date": (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d"),
        "end_date": (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d"),
        "daily_rate_snap": 15.0,
        "status": "active",
        "deposit": 50.0,
        "notes": "عقد نشط - المولد قيد الاستخدام",
        "created_by": admin_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Completed rental
    completed_rental = {
        "id": str(uuid.uuid4()),
        "contract_no": "RC-2026-002",
        "customer_id": customers[1]["id"],
        "equipment_id": equipment_list[0]["id"],  # Mixer
        "start_date": (datetime.now() - timedelta(days=10)).strftime("%Y-%m-%d"),
        "end_date": (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d"),
        "actual_return_date": (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d"),
        "daily_rate_snap": 25.0,
        "status": "completed",
        "deposit": 100.0,
        "notes": "عقد مكتمل - تم الإرجاع في الموعد",
        "created_by": admin_user["id"],
        "created_at": (datetime.now() - timedelta(days=10)).isoformat()
    }
    
    # Draft rental
    draft_rental = {
        "id": str(uuid.uuid4()),
        "contract_no": "RC-2026-003",
        "customer_id": customers[2]["id"],
        "equipment_id": equipment_list[2]["id"],  # Scaffold
        "start_date": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"),
        "end_date": (datetime.now() + timedelta(days=9)).strftime("%Y-%m-%d"),
        "daily_rate_snap": 8.0,
        "status": "draft",
        "deposit": 30.0,
        "notes": "مسودة - في انتظار التفعيل",
        "created_by": employee_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    rentals = [active_rental, completed_rental, draft_rental]
    await db.rental_contracts.insert_many(rentals)
    print(f"   ✅ Created {len(rentals)} rental contracts")
    
    # 6. Create Invoices
    print("🧾 Creating invoices...")
    
    # Paid invoice for completed rental
    paid_invoice = {
        "id": str(uuid.uuid4()),
        "invoice_no": "INV-2026-001",
        "rental_id": completed_rental["id"],
        "customer_id": customers[1]["id"],
        "issue_date": (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d"),
        "due_date": (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d"),
        "subtotal": 175.0,  # 7 days * 25
        "tax": 0.0,
        "discount": 0.0,
        "total": 175.0,
        "paid_amount": 175.0,
        "status": "paid",
        "payment_method": "cash",
        "notes": "دفع نقدي كامل",
        "created_at": (datetime.now() - timedelta(days=3)).isoformat()
    }
    
    # Pending invoice for active rental
    pending_invoice = {
        "id": str(uuid.uuid4()),
        "invoice_no": "INV-2026-002",
        "rental_id": active_rental["id"],
        "customer_id": customers[0]["id"],
        "issue_date": datetime.now().strftime("%Y-%m-%d"),
        "due_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
        "subtotal": 105.0,  # 7 days * 15
        "tax": 0.0,
        "discount": 10.0,
        "total": 95.0,
        "paid_amount": 0.0,
        "status": "pending",
        "payment_method": None,
        "notes": "في انتظار الدفع",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    invoices = [paid_invoice, pending_invoice]
    await db.invoices.insert_many(invoices)
    print(f"   ✅ Created {len(invoices)} invoices")
    
    # 7. Create Settings (if not exists)
    print("⚙️  Creating default settings...")
    existing_settings = await db.settings.find_one({})
    if not existing_settings:
        settings = {
            "id": str(uuid.uuid4()),
            "header_logo": None,
            "header_title": "نظام إدارة التأجير",
            "header_subtitle": "Rental Management System",
            "footer_text": "جميع الحقوق محفوظة © 2026",
            "footer_phone": "+96812345678",
            "footer_email": "info@rental.om",
            "footer_address": "مسقط، سلطنة عمان",
            "whatsapp_api_key": None,
            "whatsapp_instance_id": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.settings.insert_one(settings)
        print("   ✅ Created default settings")
    else:
        print("   ℹ️  Settings already exist, skipping")
    
    print("\n✨ Database seeded successfully!")
    print("\n📊 Summary:")
    print(f"   - Users: 2 (admin, employee)")
    print(f"   - Employees: {len(employees)}")
    print(f"   - Customers: {len(customers)}")
    print(f"   - Equipment: {len(equipment_list)}")
    print(f"   - Rentals: {len(rentals)} (1 active, 1 completed, 1 draft)")
    print(f"   - Invoices: {len(invoices)} (1 paid, 1 pending)")
    print("\n🔑 Login Credentials:")
    print("   Admin: username=admin, password=admin")
    print("   Employee: username=employee1, password=employee123")

if __name__ == "__main__":
    asyncio.run(seed_database())
