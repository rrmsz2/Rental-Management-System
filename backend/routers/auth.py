from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta, timezone
import os
import jwt
from models import LoginRequest, VerifyOtpRequest, TokenResponse, UserRole
import uuid
from services.otp_service import OtpService
from services.notification_service import NotificationService
import re

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Get database dependency
from server import get_db

# Phone validation regex for Oman
OMANI_PHONE_REGEX = r'^\+968\d{8}$'

def validate_omani_phone(phone: str) -> bool:
    """Validate Omani phone number format"""
    return bool(re.match(OMANI_PHONE_REGEX, phone))

def create_access_token(data: dict) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 43200)))
    to_encode.update({"exp": expire})
    
    secret = os.getenv("JWT_SECRET")
    algorithm = os.getenv("JWT_ALGORITHM", "HS256")
    
    return jwt.encode(to_encode, secret, algorithm=algorithm)

@router.post("/login")
async def login(request: LoginRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Send OTP to phone number via WhatsApp.
    Phone format: +968XXXXXXXX
    """
    # Validate phone format
    if not validate_omani_phone(request.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "رقم الهاتف غير صحيح. يجب أن يبدأ بـ +968 ويتبعه 8 أرقام",
                "message_en": "Invalid phone number. Must start with +968 followed by 8 digits"
            }
        )
    
    # Generate OTP
    otp_service = OtpService(db)
    result = await otp_service.create_otp(request.phone)
    
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"message": result["error"], "message_en": result.get("error_en")}
        )
    
    # Send OTP via WhatsApp
    notification_service = NotificationService(db)
    send_result = await notification_service.notify_otp(request.phone, result["code"])
    
    if not send_result["ok"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "فزل إرسال رمز التحقق. يرجى المحاولة مرة أخرى",
                "message_en": "Failed to send verification code. Please try again"
            }
        )
    
    return {
        "message": "تم إرسال رمز التحقق إلى واتساب",
        "message_en": "Verification code sent to WhatsApp",
        "phone": request.phone,
        "expires_in_minutes": OtpService.OTP_TTL_MINUTES
    }

@router.post("/verify", response_model=TokenResponse)
async def verify_otp(request: VerifyOtpRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Verify OTP and return access token.
    Creates/updates user and links to customer if exists.
    """
    # Verify OTP
    otp_service = OtpService(db)
    result = await otp_service.verify_otp(request.phone, request.code)
    
    if not result["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": result["error"], "message_en": result.get("error_en")}
        )
    
    # Check if user exists
    user = await db.users.find_one({"phone": request.phone})
    
    if not user:
        # Create new user
        is_manager = request.phone == os.getenv("MANAGER_PHONE")
        
        user_doc = {
            "id": str(uuid.uuid4()),
            "phone": request.phone,
            "full_name": request.phone,  # سيتم تحديثه لاحقاً
            "role": UserRole.admin.value if is_manager else UserRole.employee.value,
            "email": None,
            "is_active": True,
            "customer_id": None,
            "is_manager": is_manager,  # للتوافق مع النظام القديم
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Check if customer exists with this phone
        customer = await db.customers.find_one({"phone": request.phone})
        if customer:
            user_doc["customer_id"] = customer["id"]
        
        await db.users.insert_one(user_doc)
        user = user_doc
    
    # Create access token
    token_data = {
        "user_id": user.get("id", user["phone"]),  # استخدام ID إذا كان موجود
        "phone": user["phone"],
        "role": user.get("role", UserRole.admin.value if user.get("is_manager") else UserRole.employee.value),
        "customer_id": user.get("customer_id"),
        "is_manager": user.get("is_manager", False)
    }
    access_token = create_access_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        user={
            "id": user.get("id", user["phone"]),
            "phone": user["phone"],
            "full_name": user.get("full_name", user["phone"]),
            "role": user.get("role", UserRole.admin.value if user.get("is_manager") else UserRole.employee.value),
            "customer_id": user.get("customer_id"),
            "is_manager": user.get("is_manager", False)
        }
    )

@router.post("/logout")
async def logout():
    """
    Logout (client should remove token)
    """
    return {"message": "تم تسجيل الخروج بنجاح", "message_en": "Logged out successfully"}