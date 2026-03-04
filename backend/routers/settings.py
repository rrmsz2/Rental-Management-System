from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone
import uuid
import os
import base64
from models import Settings, SettingsUpdate
from middleware.permissions import require_admin, require_any_role

router = APIRouter(prefix="/settings", tags=["Settings"])

from server import get_db

@router.get("/public", response_model=Settings)
async def get_public_settings(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get public settings (without sensitive data) - متاح للجميع"""
    # إرجاع الإعدادات العامة فقط بدون المفاتيح الحساسة
    settings = await db.settings.find_one({}, {
        "_id": 0,
        "whatsapp_api_key": 0,  # إخفاء مفتاح واتساب
        "whatsapp_instance_id": 0  # إخفاء معرف واتساب
    })
    if not settings:
        # Create default settings if none exist
        default_settings = {
            "id": str(uuid.uuid4()),
            "header_logo": None,
            "header_title": "نظام إدارة التأجير",
            "header_subtitle": "Rental Management System",
            "footer_text": "جميع الحقوق محفوظة © 2025",
            "footer_phone": None,
            "footer_email": None,
            "footer_address": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.settings.insert_one(default_settings)
        return Settings(**default_settings)
    return Settings(**settings)

@router.get("", response_model=Settings)
async def get_settings(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(require_any_role)  # يتطلب أي مستخدم مسجل
):
    """Get system settings - للمستخدمين المسجلين فقط"""
    # إخفاء المفاتيح الحساسة للمستخدمين غير المدراء
    if current_user.get("role") != "admin":
        settings = await db.settings.find_one({}, {
            "_id": 0,
            "whatsapp_api_key": 0,  # إخفاء مفتاح واتساب
            "whatsapp_instance_id": 0  # إخفاء معرف واتساب
        })
    else:
        settings = await db.settings.find_one({}, {"_id": 0})
    if not settings:
        # Create default settings if none exist
        default_settings = {
            "id": str(uuid.uuid4()),
            "header_logo": None,
            "header_title": "نظام إدارة التأجير",
            "header_subtitle": "Rental Management System",
            "footer_text": "جميع الحقوق محفوظة © 2025",
            "footer_phone": None,
            "footer_email": None,
            "footer_address": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.settings.insert_one(default_settings)
        return Settings(**default_settings)
    return Settings(**settings)

@router.put("", response_model=Settings)
async def update_settings(
    settings_update: SettingsUpdate,
    current_user: dict = Depends(require_admin),  # يتطلب صلاحية مدير
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update system settings - للمدير فقط"""
    # Get existing settings
    existing = await db.settings.find_one({})
    
    update_data = settings_update.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if existing:
        # Update existing
        await db.settings.update_one({"id": existing["id"]}, {"$set": update_data})
        updated_settings = await db.settings.find_one({"id": existing["id"]}, {"_id": 0})
    else:
        # Create new
        update_data["id"] = str(uuid.uuid4())
        await db.settings.insert_one(update_data)
        updated_settings = update_data
    
    return Settings(**updated_settings)

@router.post("/upload-logo")
async def upload_logo(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_admin),  # يتطلب صلاحية مدير
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Upload logo image - للمدير فقط"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="نوع الملف غير مدعوم. الرجاء استخدام صورة (JPG, PNG, WebP, SVG)")
    
    # Read file content
    contents = await file.read()
    
    # Convert to base64
    base64_image = base64.b64encode(contents).decode('utf-8')
    data_url = f"data:{file.content_type};base64,{base64_image}"
    
    # Update settings with logo
    settings = await db.settings.find_one({})
    if settings:
        await db.settings.update_one(
            {"id": settings["id"]},
            {"$set": {"header_logo": data_url, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        # Create new settings
        new_settings = {
            "id": str(uuid.uuid4()),
            "header_logo": data_url,
            "header_title": "نظام إدارة التأجير",
            "header_subtitle": "Rental Management System",
            "footer_text": "جميع الحقوق محفوظة © 2025",
            "footer_phone": None,
            "footer_email": None,
            "footer_address": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.settings.insert_one(new_settings)
    
    return {"message": "تم رفع الشعار بنجاح", "logo_url": data_url}

@router.post("/test-whatsapp")
async def test_whatsapp(
    payload: dict,
    current_user: dict = Depends(require_admin),  # يتطلب صلاحية مدير
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Test WhatsApp configuration - للمدير فقط"""
    phone = payload.get("phone")
    if not phone:
         raise HTTPException(status_code=400, detail="رقم الهاتف مطلوب")

    # Get settings
    settings = await db.settings.find_one({})
    if not settings or not settings.get("whatsapp_api_key"):
        raise HTTPException(status_code=400, detail="إعدادات واتساب غير مضبوطة")
        
    api_key = settings.get("whatsapp_api_key")
    
    # Init client
    from integrations.whatsapp_client import WhatsAppClient
    client = WhatsAppClient()
    
    # Send test message
    result = await client.send(phone, "تجربة إعدادات واتساب من نظام التأجير ✅", api_key=api_key)
    
    if result["ok"]:
        return {"message": "تم إرسال الرسالة التجريبية بنجاح"}
    else:
        raise HTTPException(status_code=500, detail=f"فشل الإرسال: {result.get('error')}")
