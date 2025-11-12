from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone
from typing import List
import uuid
from models import Invoice, InvoiceCreate, InvoiceUpdate
from services.notification_service import NotificationService

router = APIRouter(prefix="/invoices", tags=["Invoices"])

from server import get_db

def generate_invoice_no() -> str:
    """Generate unique invoice number"""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"INV-{timestamp}"

def calculate_rental_days(start_date: str, end_date: str) -> int:
    """Calculate rental days (minimum 1)"""
    start = datetime.fromisoformat(start_date)
    
    # Handle empty or None end_date
    if not end_date or end_date == "":
        end = datetime.now(timezone.utc)
    else:
        end = datetime.fromisoformat(end_date)
    
    days = (end.date() - start.date()).days
    return max(1, days)

@router.get("", response_model=List[Invoice])
async def get_invoices(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get all invoices"""
    invoices = await db.invoices.find({}, {"_id": 0}).to_list(1000)
    return invoices

@router.get("/{invoice_id}", response_model=Invoice)
async def get_invoice(invoice_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get invoice by ID"""
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.get("/by-invoice-no/{invoice_no}", response_model=Invoice)
async def get_invoice_by_number(invoice_no: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get invoice by invoice number"""
    invoice = await db.invoices.find_one({"invoice_no": invoice_no}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.post("", response_model=Invoice)
async def create_invoice(invoice_create: InvoiceCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Create invoice from rental contract"""
    # Get rental contract
    rental = await db.rental_contracts.find_one({"id": invoice_create.contract_id})
    if not rental:
        raise HTTPException(status_code=404, detail="Rental contract not found")
    
    if rental["status"] != "closed":
        raise HTTPException(status_code=400, detail="Can only create invoice for closed rentals")
    
    # Check if invoice already exists for this contract
    existing_invoice = await db.invoices.find_one({"contract_id": invoice_create.contract_id})
    if existing_invoice:
        raise HTTPException(status_code=400, detail="Invoice already exists for this contract")
    
    # Calculate amounts based on actual return date
    actual_return_date = rental.get("actual_return_date")
    if actual_return_date:
        # Use actual return date for calculation
        rental_days = calculate_rental_days(rental["start_date"], actual_return_date)
    else:
        # Fallback to end_date or current date
        end_date = rental.get("end_date") or datetime.now(timezone.utc).isoformat()
        rental_days = calculate_rental_days(rental["start_date"], end_date)
    
    base_cost = rental_days * rental["daily_rate_snap"]
    
    # Calculate late fee if applicable
    late_fee = 0.0
    if rental.get("actual_return_date") and rental.get("end_date") and rental["end_date"]:
        actual_return = datetime.fromisoformat(rental["actual_return_date"])
        expected_return = datetime.fromisoformat(rental["end_date"])
        
        # Ensure timezone-aware
        if actual_return.tzinfo is None:
            actual_return = actual_return.replace(tzinfo=timezone.utc)
        if expected_return.tzinfo is None:
            expected_return = expected_return.replace(tzinfo=timezone.utc)
            
        if actual_return > expected_return:
            days_late = (actual_return.date() - expected_return.date()).days
            late_fee = days_late * rental["daily_rate_snap"] * 1.2
    
    subtotal = base_cost + late_fee - rental.get("deposit", 0)
    tax_amount = subtotal * invoice_create.tax_rate
    total = subtotal + tax_amount - invoice_create.discount_amount
    
    # Create invoice
    invoice_doc = {
        "id": str(uuid.uuid4()),
        "invoice_no": generate_invoice_no(),
        "contract_id": invoice_create.contract_id,
        "issue_date": datetime.now(timezone.utc).isoformat(),
        "subtotal": round(subtotal, 2),
        "tax_rate": invoice_create.tax_rate,
        "tax_amount": round(tax_amount, 2),
        "discount_amount": invoice_create.discount_amount,
        "total": round(total, 2),
        "paid": False,
        "payment_method": invoice_create.payment_method,
        "notes": invoice_create.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.invoices.insert_one(invoice_doc)
    
    # Send notification to customer
    customer = await db.customers.find_one({"id": rental["customer_id"]})
    notification_service = NotificationService(db)
    await notification_service.notify_invoice_issued(invoice_doc, customer)
    
    return Invoice(**invoice_doc)

@router.put("/{invoice_id}", response_model=Invoice)
async def update_invoice(
    invoice_id: str,
    invoice_update: InvoiceUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update invoice"""
    existing = await db.invoices.find_one({"id": invoice_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    update_data = invoice_update.model_dump(exclude_unset=True)
    
    await db.invoices.update_one({"id": invoice_id}, {"$set": update_data})
    
    updated_invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    return Invoice(**updated_invoice)

@router.post("/{invoice_id}/mark-paid")
async def mark_invoice_paid(invoice_id: str, payment_method: str = None, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Mark invoice as paid"""
    invoice = await db.invoices.find_one({"id": invoice_id})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice["paid"]:
        raise HTTPException(status_code=400, detail="Invoice is already marked as paid")
    
    # Update invoice
    update_data = {"paid": True}
    if payment_method:
        update_data["payment_method"] = payment_method
    
    await db.invoices.update_one({"id": invoice_id}, {"$set": update_data})
    
    # Send notification to customer
    rental = await db.rental_contracts.find_one({"id": invoice["contract_id"]})
    customer = await db.customers.find_one({"id": rental["customer_id"]})
    
    invoice["paid"] = True
    notification_service = NotificationService(db)
    await notification_service.notify_payment_received(invoice, customer)
    
    return {"message": "Invoice marked as paid successfully"}