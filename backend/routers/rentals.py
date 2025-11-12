from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone
from typing import List
import uuid
from models import RentalContract, RentalContractCreate, RentalContractUpdate, RentalStatus, EquipmentStatus
from services.notification_service import NotificationService

router = APIRouter(prefix="/rentals", tags=["Rentals"])

from server import get_db

def generate_contract_no() -> str:
    """Generate unique contract number"""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"RC-{timestamp}"

def calculate_rental_days(start_date: str, end_date: str) -> int:
    """Calculate rental days (minimum 1)"""
    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)
    days = (end - start).days
    return max(1, days)

@router.get("", response_model=List[RentalContract])
async def get_rentals(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get all rental contracts"""
    rentals = await db.rental_contracts.find({}, {"_id": 0}).to_list(1000)
    return rentals

@router.get("/{rental_id}", response_model=RentalContract)
async def get_rental(rental_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get rental contract by ID"""
    rental = await db.rental_contracts.find_one({"id": rental_id}, {"_id": 0})
    if not rental:
        raise HTTPException(status_code=404, detail="Rental contract not found")
    return rental

@router.get("/{rental_id}/summary")
async def get_rental_summary(rental_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get rental contract summary with customer and equipment details"""
    rental = await db.rental_contracts.find_one({"id": rental_id}, {"_id": 0})
    if not rental:
        raise HTTPException(status_code=404, detail="Rental contract not found")
    
    customer = await db.customers.find_one({"id": rental["customer_id"]}, {"_id": 0})
    equipment = await db.equipment.find_one({"id": rental["equipment_id"]}, {"_id": 0})
    
    # Calculate days and costs
    rental_days = calculate_rental_days(rental["start_date"], rental["end_date"])
    base_cost = rental_days * rental["daily_rate_snap"]
    
    # Calculate late fee if applicable
    late_fee = 0.0
    days_late = 0
    if rental.get("actual_return_date"):
        actual_return = datetime.fromisoformat(rental["actual_return_date"])
        expected_return = datetime.fromisoformat(rental["end_date"])
        if actual_return > expected_return:
            days_late = (actual_return - expected_return).days
            late_fee = days_late * rental["daily_rate_snap"] * 1.2
    
    return {
        "rental": rental,
        "customer": customer,
        "equipment": equipment,
        "rental_days": rental_days,
        "base_cost": base_cost,
        "days_late": days_late,
        "late_fee": late_fee,
        "total_cost": base_cost + late_fee - rental.get("deposit", 0)
    }

@router.post("", response_model=RentalContract)
async def create_rental(rental: RentalContractCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Create new rental contract (active status immediately)"""
    # Validate customer exists
    customer = await db.customers.find_one({"id": rental.customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Validate equipment exists
    equipment = await db.equipment.find_one({"id": rental.equipment_id})
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    # Check equipment is available
    if equipment["status"] != "available":
        raise HTTPException(
            status_code=400,
            detail="المعدة غير متاحة حالياً"
        )
    
    # Check for overlapping rentals
    overlapping = await db.rental_contracts.find_one({
        "equipment_id": rental.equipment_id,
        "status": {"$in": ["draft", "active"]},
        "$or": [
            {"start_date": {"$lte": rental.end_date}, "end_date": {"$gte": rental.start_date}}
        ]
    })
    
    if overlapping:
        raise HTTPException(
            status_code=400,
            detail="Equipment is not available for the selected dates"
        )
    
    # Create rental contract as ACTIVE immediately
    rental_doc = rental.model_dump()
    rental_doc["id"] = str(uuid.uuid4())
    rental_doc["contract_no"] = generate_contract_no()
    rental_doc["daily_rate_snap"] = equipment["daily_rate"]
    rental_doc["status"] = RentalStatus.active  # Active immediately
    rental_doc["actual_return_date"] = None
    rental_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.rental_contracts.insert_one(rental_doc)
    
    # Update equipment status to rented
    await db.equipment.update_one(
        {"id": rental.equipment_id},
        {"$set": {"status": EquipmentStatus.rented}}
    )
    
    # Send notification to customer and manager
    notification_service = NotificationService(db)
    await notification_service.notify_rental_activated(rental_doc, customer, equipment)
    
    return RentalContract(**rental_doc)

@router.put("/{rental_id}", response_model=RentalContract)
async def update_rental(
    rental_id: str,
    rental_update: RentalContractUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update rental contract"""
    existing = await db.rental_contracts.find_one({"id": rental_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Rental contract not found")
    
    update_data = rental_update.model_dump(exclude_unset=True)
    
    await db.rental_contracts.update_one({"id": rental_id}, {"$set": update_data})
    
    updated_rental = await db.rental_contracts.find_one({"id": rental_id}, {"_id": 0})
    return RentalContract(**updated_rental)

@router.post("/{rental_id}/activate")
async def activate_rental(rental_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Activate rental contract"""
    rental = await db.rental_contracts.find_one({"id": rental_id})
    if not rental:
        raise HTTPException(status_code=404, detail="Rental contract not found")
    
    if rental["status"] != RentalStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft rentals can be activated")
    
    # Update rental status
    await db.rental_contracts.update_one(
        {"id": rental_id},
        {"$set": {"status": RentalStatus.active}}
    )
    
    # Update equipment status
    await db.equipment.update_one(
        {"id": rental["equipment_id"]},
        {"$set": {"status": EquipmentStatus.rented}}
    )
    
    # Get customer and equipment for notification
    customer = await db.customers.find_one({"id": rental["customer_id"]})
    equipment = await db.equipment.find_one({"id": rental["equipment_id"]})
    
    # Send notifications
    rental["status"] = RentalStatus.active
    notification_service = NotificationService(db)
    await notification_service.notify_rental_activated(rental, customer, equipment)
    
    return {"message": "Rental activated successfully"}

@router.post("/{rental_id}/close")
async def close_rental(
    rental_id: str, 
    return_date: str = None,
    tax_rate: float = 0.05,
    discount_amount: float = 0.0,
    paid: bool = False,
    payment_method: str = None,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Close rental contract and auto-create invoice with payment status"""
    rental = await db.rental_contracts.find_one({"id": rental_id})
    if not rental:
        raise HTTPException(status_code=404, detail="Rental contract not found")
    
    if rental["status"] != RentalStatus.active:
        raise HTTPException(status_code=400, detail="Only active rentals can be closed")
    
    # Get customer and equipment details
    customer = await db.customers.find_one({"id": rental["customer_id"]})
    equipment = await db.equipment.find_one({"id": rental["equipment_id"]})
    
    # Set return date
    actual_return = return_date or datetime.now(timezone.utc).isoformat()
    
    # Update rental status
    await db.rental_contracts.update_one(
        {"id": rental_id},
        {"$set": {
            "status": RentalStatus.closed,
            "actual_return_date": actual_return
        }}
    )
    
    # Update equipment status
    await db.equipment.update_one(
        {"id": rental["equipment_id"]},
        {"$set": {"status": EquipmentStatus.available}}
    )
    
    # Auto-create invoice
    from routers.invoices import generate_invoice_no, calculate_rental_days
    
    # Calculate amounts
    rental_days = calculate_rental_days(rental["start_date"], rental["end_date"])
    base_cost = rental_days * rental["daily_rate_snap"]
    
    # Calculate late fee if applicable
    late_fee = 0.0
    days_late = 0
    actual_return_dt = datetime.fromisoformat(actual_return)
    expected_return_dt = datetime.fromisoformat(rental["end_date"])
    
    # Ensure both datetimes are timezone-aware for comparison
    if actual_return_dt.tzinfo is None:
        actual_return_dt = actual_return_dt.replace(tzinfo=timezone.utc)
    if expected_return_dt.tzinfo is None:
        expected_return_dt = expected_return_dt.replace(tzinfo=timezone.utc)
    
    if actual_return_dt > expected_return_dt:
        days_late = (actual_return_dt - expected_return_dt).days
        late_fee = days_late * rental["daily_rate_snap"] * 1.2
    
    subtotal = base_cost + late_fee - rental.get("deposit", 0)
    tax_amount = subtotal * tax_rate
    total = subtotal + tax_amount - discount_amount
    
    # Create invoice
    invoice_doc = {
        "id": str(uuid.uuid4()),
        "invoice_no": generate_invoice_no(),
        "contract_id": rental_id,
        "issue_date": datetime.now(timezone.utc).isoformat(),
        "subtotal": round(subtotal, 2),
        "tax_rate": tax_rate,
        "tax_amount": round(tax_amount, 2),
        "discount_amount": discount_amount,
        "total": round(total, 2),
        "paid": paid,
        "payment_method": payment_method if paid else None,
        "notes": "تم إنشاء الفاتورة تلقائياً عند إغلاق العقد",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.invoices.insert_one(invoice_doc)
    
    # Send notifications
    notification_service = NotificationService(db)
    
    # Send invoice notification to customer
    await notification_service.notify_invoice_issued(invoice_doc, customer, rental, equipment)
    
    # If paid, send payment confirmation
    if paid:
        await notification_service.notify_payment_received(invoice_doc, customer)
    
    # Send notification to customer
    customer = await db.customers.find_one({"id": rental["customer_id"]}, {"_id": 0})
    from services.notification_service import NotificationService
    notification_service = NotificationService(db)
    await notification_service.notify_invoice_issued(invoice_doc, customer)
    
    # Remove _id from invoice_doc before returning
    invoice_response = {k: v for k, v in invoice_doc.items() if k != '_id'}
    
    return {
        "message": "Rental closed successfully and invoice created",
        "actual_return_date": actual_return,
        "invoice": invoice_response
    }

@router.post("/{rental_id}/cancel")
async def cancel_rental(rental_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Cancel rental contract"""
    rental = await db.rental_contracts.find_one({"id": rental_id})
    if not rental:
        raise HTTPException(status_code=404, detail="Rental contract not found")
    
    if rental["status"] in [RentalStatus.closed, RentalStatus.cancelled]:
        raise HTTPException(status_code=400, detail="Cannot cancel closed or already cancelled rental")
    
    # Update rental status
    await db.rental_contracts.update_one(
        {"id": rental_id},
        {"$set": {"status": RentalStatus.cancelled}}
    )
    
    # Update equipment status if it was rented
    if rental["status"] == RentalStatus.active:
        await db.equipment.update_one(
            {"id": rental["equipment_id"]},
            {"$set": {"status": EquipmentStatus.available}}
        )
    
    # Notify manager
    customer = await db.customers.find_one({"id": rental["customer_id"]})
    notification_service = NotificationService(db)
    await notification_service.send_notification(
        to_phone=notification_service.manager_phone,
        template_key="rental_cancelled_manager",
        payload={
            "contract_no": rental["contract_no"],
            "customer": customer["full_name"]
        },
        check_opt_in=False
    )
    
    return {"message": "Rental cancelled successfully"}