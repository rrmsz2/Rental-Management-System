"""
Rental Reminder Service
Handles return reminders and overdue notifications
"""
from datetime import datetime, timezone, timedelta
from typing import List, Dict
import logging
from services.notification_service import NotificationService

logger = logging.getLogger(__name__)

class ReminderService:
    """Service to check and send rental reminders"""
    
    def __init__(self, db):
        self.db = db
        self.notification_service = NotificationService(db)
    
    async def check_and_send_return_reminders(self) -> List[Dict]:
        """
        Check for rentals ending tomorrow and send return reminders.
        Returns list of sent reminders.
        """
        tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).date()
        tomorrow_str = tomorrow.isoformat()
        
        # Find active rentals ending tomorrow
        rentals = await self.db.rental_contracts.find({
            "status": "active",
            "end_date": {"$regex": f"^{tomorrow_str}"}
        }).to_list(100)
        
        sent_reminders = []
        
        for rental in rentals:
            try:
                # Get customer and equipment
                customer = await self.db.customers.find_one(
                    {"id": rental["customer_id"]},
                    {"_id": 0}
                )
                equipment = await self.db.equipment.find_one(
                    {"id": rental["equipment_id"]},
                    {"_id": 0}
                )
                
                if not customer or not equipment:
                    logger.warning(f"Missing customer or equipment for rental {rental['id']}")
                    continue
                
                # Send reminder
                result = await self.notification_service.notify_return_reminder(
                    rental, customer, equipment
                )
                
                if result["ok"]:
                    sent_reminders.append({
                        "rental_id": rental["id"],
                        "contract_no": rental["contract_no"],
                        "customer": customer["full_name"],
                        "equipment": equipment["name"]
                    })
                    logger.info(f"Return reminder sent for rental {rental['contract_no']}")
                
            except Exception as e:
                logger.error(f"Error sending reminder for rental {rental.get('id')}: {e}")
        
        return sent_reminders
    
    async def check_and_send_overdue_notifications(self) -> List[Dict]:
        """
        Check for overdue rentals and send notifications.
        Returns list of overdue rentals.
        """
        today = datetime.now(timezone.utc).date()
        
        # Find active rentals that are past end date
        rentals = await self.db.rental_contracts.find({
            "status": "active"
        }).to_list(1000)
        
        overdue_rentals = []
        
        for rental in rentals:
            try:
                end_date = datetime.fromisoformat(rental["end_date"]).date()
                
                # Check if overdue
                if end_date < today:
                    days_late = (today - end_date).days
                    
                    # Get customer and equipment
                    customer = await self.db.customers.find_one(
                        {"id": rental["customer_id"]},
                        {"_id": 0}
                    )
                    equipment = await self.db.equipment.find_one(
                        {"id": rental["equipment_id"]},
                        {"_id": 0}
                    )
                    
                    if not customer or not equipment:
                        continue
                    
                    # Check if we already sent notification today
                    today_str = today.isoformat()
                    existing_log = await self.db.notification_logs.find_one({
                        "to_phone": customer["phone"],
                        "template_key": "overdue_customer",
                        "created_at": {"$regex": f"^{today_str}"}
                    })
                    
                    # Send notification only once per day
                    if not existing_log:
                        result = await self.notification_service.notify_overdue(
                            rental, customer, equipment
                        )
                        
                        if result["ok"]:
                            logger.info(f"Overdue notification sent for rental {rental['contract_no']}")
                    
                    overdue_rentals.append({
                        "rental_id": rental["id"],
                        "contract_no": rental["contract_no"],
                        "customer": customer["full_name"],
                        "equipment": equipment["name"],
                        "days_late": days_late
                    })
            
            except Exception as e:
                logger.error(f"Error checking overdue for rental {rental.get('id')}: {e}")
        
        return overdue_rentals
    
    async def send_daily_summary_to_manager(self) -> Dict:
        """
        Send daily summary of overdue rentals to manager.
        Should be called once per day (e.g., via cron job).
        """
        overdue_rentals = await self.check_and_send_overdue_notifications()
        
        if overdue_rentals:
            result = await self.notification_service.send_daily_overdue_summary(
                overdue_rentals
            )
            logger.info(f"Daily summary sent to manager: {len(overdue_rentals)} overdue rentals")
            return {
                "ok": result["ok"],
                "overdue_count": len(overdue_rentals),
                "overdue_rentals": overdue_rentals
            }
        else:
            logger.info("No overdue rentals today")
            return {
                "ok": True,
                "overdue_count": 0,
                "overdue_rentals": []
            }
