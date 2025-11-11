"""
Reminders API endpoints
For checking and sending rental reminders
"""
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from services.reminder_service import ReminderService
from typing import Dict

router = APIRouter(prefix="/reminders", tags=["Reminders"])

from server import get_db

@router.post("/check-return-reminders")
async def check_return_reminders(db: AsyncIOMotorDatabase = Depends(get_db)) -> Dict:
    """
    Check for rentals ending tomorrow and send return reminders.
    Can be called manually or via cron job.
    """
    reminder_service = ReminderService(db)
    sent_reminders = await reminder_service.check_and_send_return_reminders()
    
    return {
        "message": f"Checked and sent {len(sent_reminders)} return reminders",
        "count": len(sent_reminders),
        "reminders": sent_reminders
    }

@router.post("/check-overdue")
async def check_overdue(db: AsyncIOMotorDatabase = Depends(get_db)) -> Dict:
    """
    Check for overdue rentals and send notifications.
    Can be called manually or via cron job.
    """
    reminder_service = ReminderService(db)
    overdue_rentals = await reminder_service.check_and_send_overdue_notifications()
    
    return {
        "message": f"Found {len(overdue_rentals)} overdue rentals",
        "count": len(overdue_rentals),
        "overdue_rentals": overdue_rentals
    }

@router.post("/daily-summary")
async def send_daily_summary(db: AsyncIOMotorDatabase = Depends(get_db)) -> Dict:
    """
    Send daily summary of overdue rentals to manager.
    Should be called once per day via cron job.
    """
    reminder_service = ReminderService(db)
    result = await reminder_service.send_daily_summary_to_manager()
    
    return {
        "message": f"Daily summary sent: {result['overdue_count']} overdue rentals",
        "overdue_count": result["overdue_count"],
        "overdue_rentals": result["overdue_rentals"]
    }

@router.get("/status")
async def get_reminders_status(db: AsyncIOMotorDatabase = Depends(get_db)) -> Dict:
    """
    Get current status of rentals that need attention.
    """
    reminder_service = ReminderService(db)
    
    # Get overdue rentals (without sending notifications)
    from datetime import datetime, timezone
    today = datetime.now(timezone.utc).date()
    
    rentals = await db.rental_contracts.find({
        "status": "active"
    }).to_list(1000)
    
    overdue_count = 0
    ending_soon_count = 0
    
    for rental in rentals:
        try:
            end_date = datetime.fromisoformat(rental["end_date"]).date()
            
            if end_date < today:
                overdue_count += 1
            elif (end_date - today).days <= 1:
                ending_soon_count += 1
        except:
            pass
    
    return {
        "overdue_rentals": overdue_count,
        "ending_soon": ending_soon_count,
        "active_rentals": len(rentals)
    }
