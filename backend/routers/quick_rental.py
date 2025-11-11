"""
Quick Rental API - للتأجير السريع عبر QR Code
"""
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone
from typing import Dict
import uuid
from models import RentalStatus, EquipmentStatus
from services.notification_service import NotificationService
from pydantic import BaseModel, Field

router = APIRouter(prefix="/quick-rental", tags=["Quick Rental"])

from server import get_db

class QuickRentalRequest(BaseModel):
    equipment_id: str = Field(..., description="معرف المعدة")
    customer_name: str = Field(..., min_length=2, description="اسم العميل")
    customer_phone: str = Field(..., pattern=r"^\d{8}$", description="رقم الهاتف (8 أرقام)")
    deposit: float = Field(default=0, ge=0, description="الوديعة")
    notes: str = Field(default="", description="ملاحظات")

class QuickReturnRequest(BaseModel):
    tax_rate: float = Field(default=0.05, ge=0, le=1, description="نسبة الضريبة")
    discount_amount: float = Field(default=0, ge=0, description="مبلغ الخصم")
    notes: str = Field(default="", description="ملاحظات على الفاتورة")

def generate_contract_no() -> str:
    """Generate unique contract number"""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"RC-{timestamp}"

def generate_invoice_no() -> str:
    """Generate unique invoice number"""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"INV-{timestamp}"

@router.get("/equipment/{equipment_id}")
async def get_equipment_for_rental(equipment_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    الحصول على معلومات المعدة للتأجير السريع
    """
    equipment = await db.equipment.find_one({"id": equipment_id}, {"_id": 0})
    if not equipment:
        raise HTTPException(status_code=404, detail="المعدة غير موجودة")
    
    # Check if equipment has active rental
    active_rental = await db.rental_contracts.find_one({
        "equipment_id": equipment_id,
        "status": "active"
    })
    
    return {
        "equipment": equipment,
        "is_available": equipment["status"] == "available",
        "has_active_rental": active_rental is not None,
        "active_rental_id": active_rental["id"] if active_rental else None
    }

@router.post("/create")
async def create_quick_rental(
    rental_data: QuickRentalRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> Dict:
    """
    إنشاء عقد إيجار سريع عبر QR Code
    - يتم إنشاء العميل تلقائياً إذا لم يكن موجوداً
    - العقد يبدأ فوراً بدون تاريخ نهاية محدد
    """
    # Format phone number to +968 format
    full_phone = f"+968{rental_data.customer_phone}"
    
    # Get equipment
    equipment = await db.equipment.find_one({"id": rental_data.equipment_id})
    if not equipment:
        raise HTTPException(status_code=404, detail="المعدة غير موجودة")
    
    # Check if equipment is available
    if equipment["status"] != "available":
        raise HTTPException(status_code=400, detail="المعدة غير متاحة حالياً")
    
    # Check for active rentals on this equipment
    active_rental = await db.rental_contracts.find_one({
        "equipment_id": rental_data.equipment_id,
        "status": "active"
    })
    if active_rental:
        raise HTTPException(status_code=400, detail="المعدة مؤجرة حالياً")
    
    # Find or create customer
    customer = await db.customers.find_one({"phone": full_phone}, {"_id": 0})
    
    if not customer:
        # Create new customer
        customer = {
            "id": str(uuid.uuid4()),
            "full_name": rental_data.customer_name,
            "phone": full_phone,
            "whatsapp_opt_in": True,
            "address": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.customers.insert_one(customer)
    
    # Create rental contract (open-ended)
    rental_doc = {
        "id": str(uuid.uuid4()),
        "contract_no": generate_contract_no(),
        "customer_id": customer["id"],
        "equipment_id": rental_data.equipment_id,
        "start_date": datetime.now(timezone.utc).date().isoformat(),
        "end_date": None,  # Open-ended rental
        "daily_rate_snap": equipment["daily_rate"],
        "deposit": rental_data.deposit,
        "notes": rental_data.notes or "عقد سريع عبر QR Code",
        "status": RentalStatus.active,
        "actual_return_date": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_quick_rental": True  # Flag to identify quick rentals
    }
    
    await db.rental_contracts.insert_one(rental_doc)
    
    # Update equipment status
    await db.equipment.update_one(
        {"id": rental_data.equipment_id},
        {"$set": {"status": EquipmentStatus.rented}}
    )
    
    # Send WhatsApp notification to customer
    notification_service = NotificationService(db)
    await notification_service.notify_rental_activated(rental_doc, customer, equipment)
    
    return {
        "success": True,
        "message": "تم إنشاء عقد الإيجار بنجاح",
        "rental": {
            "id": rental_doc["id"],
            "contract_no": rental_doc["contract_no"],
            "customer_name": customer["full_name"],
            "equipment_name": equipment["name"],
            "daily_rate": equipment["daily_rate"],
            "start_date": rental_doc["start_date"]
        }
    }

@router.post("/return/{rental_id}")
async def return_equipment_quick(
    rental_id: str,
    return_data: QuickReturnRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> Dict:
    """
    إرجاع معدة وإنشاء فاتورة مسودة
    - يتم حساب الأيام من تاريخ الاستلام لتاريخ الإرجاع
    - الفاتورة تكون مسودة قابلة للتعديل
    """
    rental = await db.rental_contracts.find_one({"id": rental_id})
    if not rental:
        raise HTTPException(status_code=404, detail="عقد الإيجار غير موجود")
    
    if rental["status"] != RentalStatus.active:
        raise HTTPException(status_code=400, detail="العقد غير نشط")
    
    # Calculate return date and days
    return_date = datetime.now(timezone.utc)
    return_date_str = return_date.date().isoformat()
    
    start_date = datetime.fromisoformat(rental["start_date"])
    if start_date.tzinfo is None:
        start_date = start_date.replace(tzinfo=timezone.utc)
    
    rental_days = (return_date.date() - start_date.date()).days
    if rental_days < 1:
        rental_days = 1  # Minimum 1 day
    
    # Calculate amounts
    base_cost = rental_days * rental["daily_rate_snap"]
    subtotal = base_cost - rental.get("deposit", 0)
    tax_amount = subtotal * return_data.tax_rate
    total = subtotal + tax_amount - return_data.discount_amount
    
    # Update rental status
    await db.rental_contracts.update_one(
        {"id": rental_id},
        {"$set": {
            "status": RentalStatus.closed,
            "actual_return_date": return_date_str,
            "end_date": return_date_str  # Set end date on return
        }}
    )
    
    # Update equipment status
    await db.equipment.update_one(
        {"id": rental["equipment_id"]},
        {"$set": {"status": EquipmentStatus.available}}
    )
    
    # Create DRAFT invoice
    invoice_doc = {
        "id": str(uuid.uuid4()),
        "invoice_no": generate_invoice_no(),
        "contract_id": rental_id,
        "issue_date": return_date.isoformat(),
        "rental_days": rental_days,
        "daily_rate": rental["daily_rate_snap"],
        "base_cost": round(base_cost, 2),
        "deposit_deducted": rental.get("deposit", 0),
        "subtotal": round(subtotal, 2),
        "tax_rate": return_data.tax_rate,
        "tax_amount": round(tax_amount, 2),
        "discount_amount": return_data.discount_amount,
        "total": round(total, 2),
        "paid": False,
        "payment_method": None,
        "notes": return_data.notes or "فاتورة مسودة - قابلة للتعديل",
        "is_draft": True,  # Mark as draft
        "created_at": return_date.isoformat()
    }
    
    await db.invoices.insert_one(invoice_doc)
    
    # Get customer for notification
    customer = await db.customers.find_one({"id": rental["customer_id"]}, {"_id": 0})
    equipment = await db.equipment.find_one({"id": rental["equipment_id"]}, {"_id": 0})
    
    return {
        "success": True,
        "message": "تم إرجاع المعدة وإنشاء فاتورة مسودة",
        "invoice": {
            "id": invoice_doc["id"],
            "invoice_no": invoice_doc["invoice_no"],
            "rental_days": rental_days,
            "base_cost": base_cost,
            "subtotal": subtotal,
            "tax_amount": tax_amount,
            "discount_amount": return_data.discount_amount,
            "total": total,
            "is_draft": True
        },
        "rental_summary": {
            "contract_no": rental["contract_no"],
            "customer_name": customer["full_name"],
            "equipment_name": equipment["name"],
            "start_date": rental["start_date"],
            "return_date": return_date_str,
            "days": rental_days
        }
    }

@router.get("/active-rental/{equipment_id}")
async def get_active_rental_for_equipment(
    equipment_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    الحصول على العقد النشط للمعدة (للإرجاع)
    """
    rental = await db.rental_contracts.find_one({
        "equipment_id": equipment_id,
        "status": "active"
    }, {"_id": 0})
    
    if not rental:
        raise HTTPException(status_code=404, detail="لا يوجد عقد نشط لهذه المعدة")
    
    # Get customer and equipment details
    customer = await db.customers.find_one({"id": rental["customer_id"]}, {"_id": 0})
    equipment = await db.equipment.find_one({"id": equipment_id}, {"_id": 0})
    
    # Calculate days so far
    start_date = datetime.fromisoformat(rental["start_date"]).date()
    today = datetime.now(timezone.utc).date()
    days_elapsed = (today - start_date).days
    if days_elapsed < 1:
        days_elapsed = 1
    
    estimated_cost = days_elapsed * rental["daily_rate_snap"]
    
    return {
        "rental": rental,
        "customer": customer,
        "equipment": equipment,
        "days_elapsed": days_elapsed,
        "estimated_cost": estimated_cost
    }
