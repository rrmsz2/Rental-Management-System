from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone
from typing import List
import uuid
from models import Equipment, EquipmentCreate, EquipmentUpdate, EquipmentStatus

router = APIRouter(prefix="/equipment", tags=["Equipment"])

from server import get_db

from middleware.permissions import require_rentals

@router.get("", response_model=List[Equipment])
async def get_equipment_list(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(require_rentals)
):
    """Get all equipment"""
    equipment = await db.equipment.find({}, {"_id": 0}).to_list(1000)
    return equipment

@router.get("/{equipment_id}", response_model=Equipment)
async def get_equipment(
    equipment_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(require_rentals)
):
    """Get equipment by ID"""
    equipment = await db.equipment.find_one({"id": equipment_id}, {"_id": 0})
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return equipment

@router.post("", response_model=Equipment)
async def create_equipment(
    equipment: EquipmentCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(require_rentals)
):
    """Create new equipment"""
    equipment_doc = equipment.model_dump()
    equipment_doc["id"] = str(uuid.uuid4())
    equipment_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.equipment.insert_one(equipment_doc)
    
    return Equipment(**equipment_doc)

@router.put("/{equipment_id}", response_model=Equipment)
async def update_equipment(
    equipment_id: str,
    equipment_update: EquipmentUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(require_rentals)
):
    """Update equipment"""
    existing = await db.equipment.find_one({"id": equipment_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    update_data = equipment_update.model_dump(exclude_unset=True)
    
    await db.equipment.update_one({"id": equipment_id}, {"$set": update_data})
    
    updated_equipment = await db.equipment.find_one({"id": equipment_id}, {"_id": 0})
    return Equipment(**updated_equipment)

@router.delete("/{equipment_id}")
async def delete_equipment(
    equipment_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(require_rentals)
):
    """Delete equipment"""
    # Check if equipment has active rentals
    active_rentals = await db.rental_contracts.find_one({
        "equipment_id": equipment_id,
        "status": {"$in": ["draft", "active"]}
    })
    
    if active_rentals:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete equipment with active rentals"
        )
    
    result = await db.equipment.delete_one({"id": equipment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    return {"message": "Equipment deleted successfully"}

@router.get("/{equipment_id}/availability")
async def check_availability(
    equipment_id: str,
    start_date: str,
    end_date: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(require_rentals)
):
    """Check equipment availability for date range"""
    # Check for overlapping rentals
    overlapping = await db.rental_contracts.find_one({
        "equipment_id": equipment_id,
        "status": {"$in": ["draft", "active"]},
        "$or": [
            {"start_date": {"$lte": end_date}, "end_date": {"$gte": start_date}}
        ]
    })
    
    return {
        "available": overlapping is None,
        "equipment_id": equipment_id,
        "start_date": start_date,
        "end_date": end_date
    }