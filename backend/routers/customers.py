from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone
from typing import List
import uuid
import re
from models import Customer, CustomerCreate, CustomerUpdate

router = APIRouter(prefix="/customers", tags=["Customers"])

from server import get_db

OMANI_PHONE_REGEX = r'^\+968\d{8}$'

@router.get("", response_model=List[Customer])
async def get_customers(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get all customers"""
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    return customers

@router.get("/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get customer by ID"""
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.post("", response_model=Customer)
async def create_customer(customer: CustomerCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Create new customer"""
    # Validate phone
    if not re.match(OMANI_PHONE_REGEX, customer.phone):
        raise HTTPException(
            status_code=400,
            detail="Invalid phone number. Must start with +968 followed by 8 digits"
        )
    
    # Check for duplicate phone
    existing = await db.customers.find_one({"phone": customer.phone})
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already exists")
    
    # Create customer
    customer_doc = customer.model_dump()
    customer_doc["id"] = str(uuid.uuid4())
    customer_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.customers.insert_one(customer_doc)
    
    return Customer(**customer_doc)

@router.put("/{customer_id}", response_model=Customer)
async def update_customer(
    customer_id: str,
    customer_update: CustomerUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update customer"""
    # Check if customer exists
    existing = await db.customers.find_one({"id": customer_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Validate phone if provided
    update_data = customer_update.model_dump(exclude_unset=True)
    if "phone" in update_data:
        if not re.match(OMANI_PHONE_REGEX, update_data["phone"]):
            raise HTTPException(
                status_code=400,
                detail="Invalid phone number. Must start with +968 followed by 8 digits"
            )
        
        # Check for duplicate
        duplicate = await db.customers.find_one({
            "phone": update_data["phone"],
            "id": {"$ne": customer_id}
        })
        if duplicate:
            raise HTTPException(status_code=400, detail="Phone number already exists")
    
    # Update
    await db.customers.update_one({"id": customer_id}, {"$set": update_data})
    
    # Return updated customer
    updated_customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    return Customer(**updated_customer)

@router.delete("/{customer_id}")
async def delete_customer(customer_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Delete customer"""
    # Check if customer has active rentals
    active_rentals = await db.rental_contracts.find_one({
        "customer_id": customer_id,
        "status": {"$in": ["draft", "active"]}
    })
    
    if active_rentals:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete customer with active rentals"
        )
    
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return {"message": "Customer deleted successfully"}