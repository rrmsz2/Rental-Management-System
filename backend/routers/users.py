from fastapi import APIRouter, HTTPException, Depends
from typing import List
from models import User, UserCreate, UserUpdate, UserRole
from server import get_db
from middleware.permissions import require_admin, require_any_role
from datetime import datetime
import uuid

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=List[dict])
async def get_users(
    current_user: dict = Depends(require_admin),
    db=Depends(get_db)
):
    """الحصول على جميع المستخدمين (Admin فقط)"""
    users = await db.users.find().to_list(1000)
    # Ensure IDs are stringified properly
    for u in users:
        if "_id" in u:
            u["_id"] = str(u["_id"])
    return users

@router.get("/me", response_model=User)
async def get_current_user_info(
    current_user: dict = Depends(require_any_role),
    db=Depends(get_db)
):
    """الحصول على معلومات المستخدم الحالي"""
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/{user_id}", response_model=User)
async def get_user(
    user_id: str,
    current_user: dict = Depends(require_admin),
    db=Depends(get_db)
):
    """الحصول على مستخدم محدد (Admin فقط)"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/", response_model=User)
async def create_user(
    user_data: UserCreate,
    current_user: dict = Depends(require_admin),
    db=Depends(get_db)
):
    """إنشاء مستخدم جديد (Admin فقط)"""
    # التحقق من عدم وجود المستخدم
    existing_user = await db.users.find_one({"phone": user_data.phone})
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this phone number already exists"
        )
    
    # إنشاء المستخدم
    new_user = {
        "id": str(uuid.uuid4()),
        "phone": user_data.phone,
        "full_name": user_data.full_name,
        "role": user_data.role.value,
        "email": user_data.email,
        "national_id": user_data.national_id,
        "position": user_data.position,
        "salary": user_data.salary,
        "hire_date": user_data.hire_date,
        "notes": user_data.notes,
        "is_active": user_data.is_active,
        "is_manager": user_data.role == UserRole.admin,  # للتوافق
        "is_customer_only": False,  # Explicitly false for dashboard staff users
        "customer_id": None,
        "created_at": datetime.utcnow().isoformat()
    }
    
    await db.users.insert_one(new_user)
    return new_user

@router.put("/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: dict = Depends(require_admin),
    db=Depends(get_db)
):
    """تحديث بيانات مستخدم (Admin فقط)"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # تحضير البيانات للتحديث
    update_data = {k: v for k, v in user_data.model_dump(exclude_unset=True).items() if v is not None}
    
    # إذا تم تحديث الدور، تحديث is_manager أيضاً
    if "role" in update_data:
        update_data["is_manager"] = update_data["role"] == UserRole.admin.value
        if update_data["role"] in ["admin", "sales", "rentals", "viewer"]:
             update_data["is_customer_only"] = False
    
    if update_data:
        await db.users.update_one(
            {"id": user_id},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"id": user_id})
    return updated_user

@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(require_admin),
    db=Depends(get_db)
):
    """حذف مستخدم (Admin فقط)"""
    # منع حذف الحساب الحالي
    if user_id == current_user["user_id"]:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete your own account"
        )
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}

@router.get("/stats/summary")
async def get_users_summary(
    current_user: dict = Depends(require_admin),
    db=Depends(get_db)
):
    """إحصائيات المستخدمين (Admin فقط)"""
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"is_active": True})
    
    # عدد المستخدمين حسب الدور
    admins = await db.users.count_documents({"role": UserRole.admin.value})
    sales = await db.users.count_documents({"role": UserRole.sales.value})
    rentals = await db.users.count_documents({"role": UserRole.rentals.value})
    viewers = await db.users.count_documents({"role": UserRole.viewer.value})
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users,
        "by_role": {
            "admins": admins,
            "sales": sales,
            "rentals": rentals,
            "viewers": viewers
        }
    }
