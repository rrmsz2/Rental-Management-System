from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone, timedelta
from typing import Dict, Optional
from services.reports_service import ReportsService
from middleware.permissions import require_any_role, require_admin

router = APIRouter(prefix="/reports", tags=["Reports"])

from server import get_db

@router.get("/dashboard")
async def get_dashboard_stats(
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> Dict:
    """Get dashboard statistics"""
    # Total customers
    total_customers = await db.customers.count_documents({})
    
    # Total equipment
    total_equipment = await db.equipment.count_documents({})
    available_equipment = await db.equipment.count_documents({"status": "available"})
    rented_equipment = await db.equipment.count_documents({"status": "rented"})
    
    # Active rentals
    active_rentals = await db.rental_contracts.count_documents({"status": "active"})
    
    # Overdue rentals
    now = datetime.now(timezone.utc).isoformat()
    overdue_rentals = await db.rental_contracts.count_documents({
        "status": "active",
        "end_date": {"$lt": now}
    })
    
    # Unpaid invoices
    unpaid_invoices = await db.invoices.count_documents({"paid": False})
    unpaid_invoices_list = await db.invoices.find({"paid": False}, {"_id": 0}).to_list(100)
    unpaid_total = sum(inv["total"] for inv in unpaid_invoices_list)
    
    # Today's revenue (paid invoices)
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    today_invoices = await db.invoices.find({
        "paid": True,
        "issue_date": {"$gte": today_start}
    }, {"_id": 0}).to_list(100)
    today_revenue = sum(inv["total"] for inv in today_invoices)
    
    # This month's revenue
    month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    month_invoices = await db.invoices.find({
        "paid": True,
        "issue_date": {"$gte": month_start}
    }, {"_id": 0}).to_list(1000)
    month_revenue = sum(inv["total"] for inv in month_invoices)
    
    # Equipment utilization
    utilization_rate = (rented_equipment / total_equipment * 100) if total_equipment > 0 else 0
    
    # Total employees
    total_employees = await db.employees.count_documents({})
    active_employees = await db.employees.count_documents({"is_active": True})
    
    return {
        "total_customers": total_customers,
        "total_equipment": total_equipment,
        "available_equipment": available_equipment,
        "rented_equipment": rented_equipment,
        "active_rentals": active_rentals,
        "overdue_rentals": overdue_rentals,
        "unpaid_invoices": unpaid_invoices,
        "unpaid_total": round(unpaid_total, 2),
        "today_revenue": round(today_revenue, 2),
        "month_revenue": round(month_revenue, 2),
        "utilization_rate": round(utilization_rate, 2),
        "total_employees": total_employees,
        "active_employees": active_employees
    }

@router.get("/overdue-rentals")
async def get_overdue_rentals(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get list of overdue rentals with details"""
    now = datetime.now(timezone.utc).isoformat()
    
    overdue_rentals = await db.rental_contracts.find({
        "status": "active",
        "end_date": {"$lt": now}
    }, {"_id": 0}).to_list(100)
    
    # Enrich with customer and equipment details
    enriched = []
    for rental in overdue_rentals:
        customer = await db.customers.find_one({"id": rental["customer_id"]}, {"_id": 0})
        equipment = await db.equipment.find_one({"id": rental["equipment_id"]}, {"_id": 0})
        
        # Calculate days late
        end_date = datetime.fromisoformat(rental["end_date"])
        days_late = (datetime.now(timezone.utc) - end_date).days
        late_fee = days_late * rental["daily_rate_snap"] * 1.2
        
        enriched.append({
            "rental": rental,
            "customer": customer,
            "equipment": equipment,
            "days_late": days_late,
            "late_fee": round(late_fee, 2)
        })
    
    return enriched

@router.get("/revenue")
async def get_revenue_report(
    start_date: str = None,
    end_date: str = None,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get revenue report for date range"""
    # Default to last 30 days
    if not start_date:
        start_date = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    if not end_date:
        end_date = datetime.now(timezone.utc).isoformat()
    
    # Get paid invoices in range
    invoices = await db.invoices.find({
        "paid": True,
        "issue_date": {"$gte": start_date, "$lte": end_date}
    }, {"_id": 0}).to_list(1000)
    
    total_revenue = sum(inv["total"] for inv in invoices)
    total_tax = sum(inv["tax_amount"] for inv in invoices)
    total_discount = sum(inv["discount_amount"] for inv in invoices)
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "total_invoices": len(invoices),


# ========== New Advanced Reports ==========

@router.get("/dashboard/v2")
async def get_dashboard_stats_v2(
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """إحصائيات لوحة التحكم المتقدمة"""
    reports_service = ReportsService(db)
    return await reports_service.get_dashboard_stats()

@router.get("/revenue/chart")
async def get_revenue_chart(
    period: str = Query("year", enum=["year", "month"]),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """بيانات الرسم البياني للإيرادات"""
    reports_service = ReportsService(db)
    return await reports_service.get_revenue_chart_data(period)

@router.get("/rentals/chart")
async def get_rentals_chart(
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """بيانات الرسم البياني للعقود"""
    reports_service = ReportsService(db)
    return await reports_service.get_rentals_chart_data()

@router.get("/equipment/performance")
async def get_equipment_performance(
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """أداء المعدات - الأكثر إيجاراً"""
    reports_service = ReportsService(db)
    return await reports_service.get_equipment_performance(limit)

@router.get("/customers/report")
async def get_customers_report(
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """تقرير العملاء - الأكثر نشاطاً والمتأخرين"""
    reports_service = ReportsService(db)
    return await reports_service.get_customers_report(limit)

@router.get("/revenue/detailed")
async def get_revenue_detailed(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(require_any_role),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """تقرير الإيرادات المفصل"""
    reports_service = ReportsService(db)
    return await reports_service.get_revenue_report(start_date, end_date)

        "total_revenue": round(total_revenue, 2),
        "total_tax": round(total_tax, 2),
        "total_discount": round(total_discount, 2),
        "invoices": invoices
    }