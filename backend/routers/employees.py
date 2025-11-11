from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone
from typing import List
import uuid
import re
from models import Employee, EmployeeCreate, EmployeeUpdate

router = APIRouter(prefix="/employees", tags=["Employees"])

from server import get_db

OMANI_PHONE_REGEX = r'^\+968\d{8}$'

@router.get("", response_model=List[Employee])
async def get_employees(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get all employees"""
    employees = await db.employees.find({}, {"_id": 0}).to_list(1000)
    return employees

@router.get("/{employee_id}", response_model=Employee)
async def get_employee(employee_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get employee by ID"""
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

@router.post("", response_model=Employee)
async def create_employee(employee: EmployeeCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Create new employee"""
    # Validate phone
    if not re.match(OMANI_PHONE_REGEX, employee.phone):
        raise HTTPException(
            status_code=400,
            detail="رقم الهاتف غير صحيح. يجب أن يبدأ بـ +968 ويتبعه 8 أرقام"
        )
    
    # Check for duplicate phone
    existing = await db.employees.find_one({"phone": employee.phone})
    if existing:
        raise HTTPException(status_code=400, detail="رقم الهاتف موجود مسبقاً")
    
    # Create employee
    employee_doc = employee.model_dump()
    employee_doc["id"] = str(uuid.uuid4())
    employee_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.employees.insert_one(employee_doc)
    
    return Employee(**employee_doc)

@router.put("/{employee_id}", response_model=Employee)
async def update_employee(
    employee_id: str,
    employee_update: EmployeeUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update employee"""
    # Check if employee exists
    existing = await db.employees.find_one({"id": employee_id})
    if not existing:
        raise HTTPException(status_code=404, detail="الموظف غير موجود")
    
    # Validate phone if provided
    update_data = employee_update.model_dump(exclude_unset=True)
    if "phone" in update_data:
        if not re.match(OMANI_PHONE_REGEX, update_data["phone"]):
            raise HTTPException(
                status_code=400,
                detail="رقم الهاتف غير صحيح. يجب أن يبدأ بـ +968 ويتبعه 8 أرقام"
            )
        
        # Check for duplicate
        duplicate = await db.employees.find_one({
            "phone": update_data["phone"],
            "id": {"$ne": employee_id}
        })
        if duplicate:
            raise HTTPException(status_code=400, detail="رقم الهاتف موجود مسبقاً")
    
    # Update
    await db.employees.update_one({"id": employee_id}, {"$set": update_data})
    
    # Return updated employee
    updated_employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    return Employee(**updated_employee)

@router.delete("/{employee_id}")
async def delete_employee(employee_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Delete employee"""
    result = await db.employees.delete_one({"id": employee_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="الموظف غير موجود")
    
    return {"message": "تم حذف الموظف بنجاح"}
