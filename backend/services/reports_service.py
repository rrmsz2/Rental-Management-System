from datetime import datetime, timedelta
from typing import Dict, List, Any
from motor.motor_asyncio import AsyncIOMotorDatabase

class ReportsService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def get_dashboard_stats(self) -> Dict[str, Any]:
        """إحصائيات لوحة التحكم الرئيسية"""
        now = datetime.utcnow()
        today_start = datetime(now.year, now.month, now.day)
        month_start = datetime(now.year, now.month, 1)
        year_start = datetime(now.year, 1, 1)
        
        # إحصائيات الإيرادات
        all_invoices = await self.db.invoices.find({"paid": True}).to_list(10000)
        
        today_revenue = sum(inv["total"] for inv in all_invoices if datetime.fromisoformat(inv["created_at"]) >= today_start)
        month_revenue = sum(inv["total"] for inv in all_invoices if datetime.fromisoformat(inv["created_at"]) >= month_start)
        year_revenue = sum(inv["total"] for inv in all_invoices if datetime.fromisoformat(inv["created_at"]) >= year_start)
        total_revenue = sum(inv["total"] for inv in all_invoices)
        
        # إحصائيات العقود
        total_rentals = await self.db.rental_contracts.count_documents({})
        active_rentals = await self.db.rental_contracts.count_documents({"status": "active"})
        closed_rentals = await self.db.rental_contracts.count_documents({"status": "closed"})
        
        # العقود المتأخرة
        overdue_rentals = await self.db.rental_contracts.count_documents({
            "status": "active",
            "end_date": {"$lt": now.isoformat()}
        })
        
        # إحصائيات المعدات
        total_equipment = await self.db.equipment.count_documents({})
        available_equipment = await self.db.equipment.count_documents({"status": "available"})
        rented_equipment = await self.db.equipment.count_documents({"status": "rented"})
        maintenance_equipment = await self.db.equipment.count_documents({"status": "maintenance"})
        
        # معدل الإشغال
        occupancy_rate = (rented_equipment / total_equipment * 100) if total_equipment > 0 else 0
        
        # إحصائيات العملاء
        total_customers = await self.db.customers.count_documents({})
        
        # الفواتير غير المدفوعة
        unpaid_invoices = await self.db.invoices.count_documents({"paid": False})
        unpaid_amount = sum(inv["total"] for inv in await self.db.invoices.find({"paid": False}).to_list(1000))
        
        return {
            "revenue": {
                "today": round(today_revenue, 2),
                "month": round(month_revenue, 2),
                "year": round(year_revenue, 2),
                "total": round(total_revenue, 2)
            },
            "rentals": {
                "total": total_rentals,
                "active": active_rentals,
                "closed": closed_rentals,
                "overdue": overdue_rentals
            },
            "equipment": {
                "total": total_equipment,
                "available": available_equipment,
                "rented": rented_equipment,
                "maintenance": maintenance_equipment,
                "occupancy_rate": round(occupancy_rate, 2)
            },
            "customers": {
                "total": total_customers
            },
            "invoices": {
                "unpaid_count": unpaid_invoices,
                "unpaid_amount": round(unpaid_amount, 2)
            }
        }
    
    async def get_revenue_chart_data(self, period: str = "year") -> List[Dict[str, Any]]:
        """بيانات الرسم البياني للإيرادات"""
        now = datetime.utcnow()
        
        if period == "year":
            # آخر 12 شهر
            months_data = []
            for i in range(11, -1, -1):
                month_date = now - timedelta(days=30 * i)
                month_start = datetime(month_date.year, month_date.month, 1)
                
                # حساب نهاية الشهر
                if month_date.month == 12:
                    month_end = datetime(month_date.year + 1, 1, 1)
                else:
                    month_end = datetime(month_date.year, month_date.month + 1, 1)
                
                # الإيرادات في هذا الشهر
                invoices = await self.db.invoices.find({
                    "paid": True,
                    "created_at": {
                        "$gte": month_start.isoformat(),
                        "$lt": month_end.isoformat()
                    }
                }).to_list(1000)
                
                revenue = sum(inv["total"] for inv in invoices)
                
                months_data.append({
                    "month": month_start.strftime("%Y-%m"),
                    "month_name": month_start.strftime("%b %Y"),
                    "revenue": round(revenue, 2),
                    "invoices_count": len(invoices)
                })
            
            return months_data
        
        elif period == "month":
            # آخر 30 يوم
            days_data = []
            for i in range(29, -1, -1):
                day_date = now - timedelta(days=i)
                day_start = datetime(day_date.year, day_date.month, day_date.day)
                day_end = day_start + timedelta(days=1)
                
                invoices = await self.db.invoices.find({
                    "paid": True,
                    "created_at": {
                        "$gte": day_start.isoformat(),
                        "$lt": day_end.isoformat()
                    }
                }).to_list(1000)
                
                revenue = sum(inv["total"] for inv in invoices)
                
                days_data.append({
                    "date": day_start.strftime("%Y-%m-%d"),
                    "date_name": day_start.strftime("%d %b"),
                    "revenue": round(revenue, 2),
                    "invoices_count": len(invoices)
                })
            
            return days_data
        
        return []
    
    async def get_rentals_chart_data(self) -> Dict[str, Any]:
        """بيانات الرسم البياني للعقود"""
        active = await self.db.rental_contracts.count_documents({"status": "active"})
        closed = await self.db.rental_contracts.count_documents({"status": "closed"})
        cancelled = await self.db.rental_contracts.count_documents({"status": "cancelled"})
        
        now = datetime.utcnow()
        overdue = await self.db.rental_contracts.count_documents({
            "status": "active",
            "end_date": {"$lt": now.isoformat()}
        })
        
        return {
            "by_status": [
                {"status": "active", "count": active, "label": "نشط"},
                {"status": "closed", "count": closed, "label": "مغلق"},
                {"status": "cancelled", "count": cancelled, "label": "ملغي"},
                {"status": "overdue", "count": overdue, "label": "متأخر"}
            ]
        }
    
    async def get_equipment_performance(self, limit: int = 10) -> List[Dict[str, Any]]:
        """أداء المعدات - الأكثر إيجاراً"""
        # الحصول على جميع العقود
        rentals = await self.db.rental_contracts.find({}).to_list(10000)
        
        # حساب عدد الإيجارات والإيرادات لكل معدة
        equipment_stats = {}
        
        for rental in rentals:
            eq_id = rental["equipment_id"]
            
            if eq_id not in equipment_stats:
                equipment_stats[eq_id] = {
                    "equipment_id": eq_id,
                    "rental_count": 0,
                    "total_revenue": 0
                }
            
            equipment_stats[eq_id]["rental_count"] += 1
            
            # الحصول على الفواتير المرتبطة
            invoices = await self.db.invoices.find({
                "contract_id": rental["id"],
                "paid": True
            }).to_list(100)
            
            equipment_stats[eq_id]["total_revenue"] += sum(inv["total"] for inv in invoices)
        
        # ترتيب حسب عدد الإيجارات
        sorted_equipment = sorted(
            equipment_stats.values(),
            key=lambda x: x["rental_count"],
            reverse=True
        )[:limit]
        
        # إضافة بيانات المعدة
        result = []
        for stat in sorted_equipment:
            equipment = await self.db.equipment.find_one({"id": stat["equipment_id"]})
            if equipment:
                result.append({
                    "equipment_id": stat["equipment_id"],
                    "equipment_name": equipment["name"],
                    "category": equipment["category"],
                    "rental_count": stat["rental_count"],
                    "total_revenue": round(stat["total_revenue"], 2),
                    "status": equipment["status"]
                })
        
        return result
    
    async def get_customers_report(self, limit: int = 50) -> List[Dict[str, Any]]:
        """تقرير العملاء - الأكثر نشاطاً والمتأخرين"""
        customers = await self.db.customers.find({}).to_list(limit)
        
        result = []
        for customer in customers:
            # عدد العقود
            total_rentals = await self.db.rental_contracts.count_documents({
                "customer_id": customer["id"]
            })
            active_rentals = await self.db.rental_contracts.count_documents({
                "customer_id": customer["id"],
                "status": "active"
            })
            
            # العقود المتأخرة
            now = datetime.utcnow()
            overdue_rentals = await self.db.rental_contracts.count_documents({
                "customer_id": customer["id"],
                "status": "active",
                "end_date": {"$lt": now.isoformat()}
            })
            
            # إجمالي الإنفاق
            customer_contracts = await self.db.rental_contracts.find({
                "customer_id": customer["id"]
            }).to_list(1000)
            
            total_spent = 0
            for contract in customer_contracts:
                invoices = await self.db.invoices.find({
                    "contract_id": contract["id"],
                    "paid": True
                }).to_list(100)
                total_spent += sum(inv["total"] for inv in invoices)
            
            result.append({
                "customer_id": customer["id"],
                "full_name": customer["full_name"],
                "phone": customer["phone"],
                "total_rentals": total_rentals,
                "active_rentals": active_rentals,
                "overdue_rentals": overdue_rentals,
                "total_spent": round(total_spent, 2),
                "created_at": customer["created_at"]
            })
        
        # ترتيب حسب إجمالي الإنفاق
        result.sort(key=lambda x: x["total_spent"], reverse=True)
        
        return result
    
    async def get_revenue_report(self, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        """تقرير الإيرادات المفصل"""
        query = {"paid": True}
        
        if start_date:
            query["created_at"] = {"$gte": start_date}
        if end_date:
            if "created_at" in query:
                query["created_at"]["$lte"] = end_date
            else:
                query["created_at"] = {"$lte": end_date}
        
        invoices = await self.db.invoices.find(query).to_list(10000)
        
        total_revenue = sum(inv["total"] for inv in invoices)
        total_subtotal = sum(inv["subtotal"] for inv in invoices)
        total_tax = sum(inv["tax_amount"] for inv in invoices)
        total_discount = sum(inv["discount_amount"] for inv in invoices)
        
        # تجميع حسب طريقة الدفع
        by_payment_method = {}
        for inv in invoices:
            method = inv.get("payment_method", "غير محدد")
            if method not in by_payment_method:
                by_payment_method[method] = {
                    "count": 0,
                    "total": 0
                }
            by_payment_method[method]["count"] += 1
            by_payment_method[method]["total"] += inv["total"]
        
        return {
            "period": {
                "start_date": start_date,
                "end_date": end_date
            },
            "summary": {
                "total_invoices": len(invoices),
                "total_revenue": round(total_revenue, 2),
                "total_subtotal": round(total_subtotal, 2),
                "total_tax": round(total_tax, 2),
                "total_discount": round(total_discount, 2)
            },
            "by_payment_method": {
                method: {
                    "count": data["count"],
                    "total": round(data["total"], 2)
                }
                for method, data in by_payment_method.items()
            },
            "invoices": invoices
        }
