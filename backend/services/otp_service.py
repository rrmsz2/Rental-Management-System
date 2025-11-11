import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)

class OtpService:
    """Handle OTP generation, validation, and rate limiting"""
    
    OTP_LENGTH = 6
    OTP_TTL_MINUTES = 5
    MAX_ATTEMPTS = 5
    RESEND_COOLDOWN_SECONDS = 30
    LOCKOUT_MINUTES = 10
    
    def __init__(self, db):
        self.db = db
        
    def generate_code(self) -> str:
        """Generate 6-digit OTP code"""
        return ''.join(random.choices(string.digits, k=self.OTP_LENGTH))
    
    async def create_otp(self, phone: str, purpose: str = "login") -> Dict:
        """
        Create new OTP for phone number.
        Invalidates previous OTPs for same phone/purpose.
        Returns: {code: str, expires_at: datetime}
        """
        # Check for recent OTP (resend cooldown)
        recent_otp = await self.db.otp_tokens.find_one({
            "phone": phone,
            "purpose": purpose,
            "created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(seconds=self.RESEND_COOLDOWN_SECONDS)).isoformat()}
        })
        
        if recent_otp:
            seconds_left = self.RESEND_COOLDOWN_SECONDS - (datetime.now(timezone.utc) - datetime.fromisoformat(recent_otp["created_at"])).seconds
            return {
                "error": f"يرجى الانتظار {seconds_left} ثانية قبل طلب رمز جديد",
                "error_en": f"Please wait {seconds_left} seconds before requesting a new code"
            }
        
        # Invalidate previous OTPs
        await self.db.otp_tokens.update_many(
            {"phone": phone, "purpose": purpose, "is_used": False},
            {"$set": {"is_used": True}}
        )
        
        # Generate new OTP
        code = self.generate_code()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=self.OTP_TTL_MINUTES)
        
        otp_doc = {
            "phone": phone,
            "code": code,
            "purpose": purpose,
            "expires_at": expires_at.isoformat(),
            "attempts": 0,
            "is_used": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.otp_tokens.insert_one(otp_doc)
        
        logger.info(f"OTP created for {phone}: {code}")
        return {"code": code, "expires_at": expires_at}
    
    async def verify_otp(self, phone: str, code: str, purpose: str = "login") -> Dict:
        """
        Verify OTP code.
        Returns: {valid: bool, error: str|None, user_phone: str|None}
        """
        # Find active OTP
        otp = await self.db.otp_tokens.find_one({
            "phone": phone,
            "purpose": purpose,
            "is_used": False
        })
        
        if not otp:
            return {"valid": False, "error": "رمز غير صالح أو منتهي الصلاحية", "error_en": "Invalid or expired code"}
        
        # Check expiry
        expires_at = datetime.fromisoformat(otp["expires_at"])
        if datetime.now(timezone.utc) > expires_at:
            await self.db.otp_tokens.update_one(
                {"_id": otp["_id"]},
                {"$set": {"is_used": True}}
            )
            return {"valid": False, "error": "الرمز منتهي الصلاحية", "error_en": "Code has expired"}
        
        # Check attempts
        if otp["attempts"] >= self.MAX_ATTEMPTS:
            return {"valid": False, "error": "تم تجاوز عدد المحاولات المسموحة", "error_en": "Maximum attempts exceeded"}
        
        # Verify code
        if otp["code"] != code:
            # Increment attempts
            await self.db.otp_tokens.update_one(
                {"_id": otp["_id"]},
                {"$inc": {"attempts": 1}}
            )
            remaining = self.MAX_ATTEMPTS - (otp["attempts"] + 1)
            return {
                "valid": False,
                "error": f"رمز خاطئ. المحاولات المتبقية: {remaining}",
                "error_en": f"Incorrect code. Attempts remaining: {remaining}"
            }
        
        # Success - mark as used
        await self.db.otp_tokens.update_one(
            {"_id": otp["_id"]},
            {"$set": {"is_used": True}}
        )
        
        logger.info(f"OTP verified successfully for {phone}")
        return {"valid": True, "error": None, "user_phone": phone}