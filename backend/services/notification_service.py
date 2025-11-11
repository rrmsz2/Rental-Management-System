import os
import json
from datetime import datetime, timezone
from typing import Dict, Optional
import logging
from integrations.whatsapp_client import WhatsAppClient

logger = logging.getLogger(__name__)

# Arabic message templates
MESSAGE_TEMPLATES = {
    "otp_login": "رمز الدخول إلى نظام التأجير: {code} (صالح لمدة ٥ دقائق). لا تشارك هذا الرمز مع أحد.",
    
    "rental_created_manager": "عقد جديد (مسودة) #{contract_no} للعميل {customer} على المعدة {equipment} من {start} إلى {end}.",
    
    "rental_activated_customer": "تم تفعيل عقد #{contract_no}. المعدة: {equipment}. الفترة: {start} → {end}. السعر اليومي: {rate} ريال.",
    
    "return_reminder_customer": "تذكير: إرجاع {equipment} غدًا ({end}). للتواصل: {shop_phone}.",
    
    "overdue_customer": "تنبيه: تأخر إرجاع {equipment}. قد تُطبق رسوم تأخير. الرجاء التواصل.",
    
    "invoice_issued_customer": "صدرت فاتورة #{invoice_no} بمبلغ {total} ريال. رابط الفاتورة: {url}",
    
    "payment_received_customer": "تم استلام الدفعة لفاتورة #{invoice_no}. شكرًا لك!",
    
    "daily_overdue_manager": "ملخص اليوم: {count} عقود متأخرة. أعلى عقد: #{contract_no} متأخر {days} يوم.",
    
    "rental_cancelled_manager": "تم إلغاء عقد #{contract_no} للعميل {customer}."
}

class NotificationService:
    """Handle WhatsApp notifications with Arabic templates"""
    
    def __init__(self, db):
        self.db = db
        self.whatsapp = WhatsAppClient()
        self.manager_phone = os.getenv("MANAGER_PHONE")
        
    async def send_notification(
        self,
        to_phone: str,
        template_key: str,
        payload: Dict,
        check_opt_in: bool = True
    ) -> Dict:
        """
        Send WhatsApp notification using template.
        Returns: {ok: bool, log_id: str}
        """
        # Check if customer has opted in (if checking)
        if check_opt_in and to_phone != self.manager_phone:
            customer = await self.db.customers.find_one({"phone": to_phone})
            if customer and not customer.get("whatsapp_opt_in", True):
                logger.info(f"Customer {to_phone} has opted out of WhatsApp notifications")
                return {"ok": False, "log_id": None, "error": "Customer opted out"}
        
        # Get template and format message
        template = MESSAGE_TEMPLATES.get(template_key, "")
        if not template:
            logger.error(f"Template {template_key} not found")
            return {"ok": False, "log_id": None, "error": "Template not found"}
        
        try:
            message = template.format(**payload)
        except KeyError as e:
            logger.error(f"Missing template variable: {e}")
            return {"ok": False, "log_id": None, "error": f"Missing variable: {e}"}
        
        # Create notification log
        log_doc = {
            "to_phone": to_phone,
            "template_key": template_key,
            "payload_json": json.dumps(payload, ensure_ascii=False),
            "status": "queued",
            "provider_message_id": None,
            "error": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        result = await self.db.notification_logs.insert_one(log_doc)
        log_id = str(result.inserted_id)
        
        # Send via WhatsApp
        send_result = await self.whatsapp.send(to_phone, message)
        
        # Update log
        await self.db.notification_logs.update_one(
            {"_id": result.inserted_id},
            {"$set": {
                "status": "sent" if send_result["ok"] else "failed",
                "provider_message_id": send_result.get("provider_id"),
                "error": send_result.get("error")
            }}
        )
        
        return {"ok": send_result["ok"], "log_id": log_id}
    
    async def notify_otp(self, phone: str, code: str):
        """Send OTP code"""
        return await self.send_notification(
            to_phone=phone,
            template_key="otp_login",
            payload={"code": code},
            check_opt_in=False  # Always send OTP
        )
    
    async def notify_rental_created(self, rental: Dict, customer: Dict, equipment: Dict):
        """Notify manager of new rental (draft)"""
        return await self.send_notification(
            to_phone=self.manager_phone,
            template_key="rental_created_manager",
            payload={
                "contract_no": rental["contract_no"],
                "customer": customer["full_name"],
                "equipment": equipment["name"],
                "start": rental["start_date"],
                "end": rental["end_date"]
            },
            check_opt_in=False
        )
    
    async def notify_rental_activated(self, rental: Dict, customer: Dict, equipment: Dict):
        """Notify customer and manager of rental activation"""
        # Notify customer
        await self.send_notification(
            to_phone=customer["phone"],
            template_key="rental_activated_customer",
            payload={
                "contract_no": rental["contract_no"],
                "equipment": equipment["name"],
                "start": rental["start_date"],
                "end": rental["end_date"],
                "rate": str(rental["daily_rate_snap"])
            }
        )
        
        # Notify manager
        return await self.send_notification(
            to_phone=self.manager_phone,
            template_key="rental_created_manager",
            payload={
                "contract_no": rental["contract_no"],
                "customer": customer["full_name"],
                "equipment": equipment["name"],
                "start": rental["start_date"],
                "end": rental["end_date"]
            },
            check_opt_in=False
        )
    
    async def notify_invoice_issued(self, invoice: Dict, customer: Dict):
        """Notify customer of invoice issuance"""
        app_url = os.getenv("APP_BASE_URL", "http://localhost:3000")
        invoice_url = f"{app_url}/invoices/{invoice['invoice_no']}"
        
        return await self.send_notification(
            to_phone=customer["phone"],
            template_key="invoice_issued_customer",
            payload={
                "invoice_no": invoice["invoice_no"],
                "total": str(invoice["total"]),
                "url": invoice_url
            }
        )
    
    async def notify_payment_received(self, invoice: Dict, customer: Dict):
        """Notify customer of payment receipt"""
        return await self.send_notification(
            to_phone=customer["phone"],
            template_key="payment_received_customer",
            payload={
                "invoice_no": invoice["invoice_no"]
            }
        )