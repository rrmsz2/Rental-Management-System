from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from services.export_service import ExportService
from middleware.permissions import require_any_role
from server import get_db

router = APIRouter(prefix="/exports", tags=["Exports"])

@router.get("/invoice/{invoice_id}/pdf")
async def export_invoice_pdf(
    invoice_id: str,
    current_user: dict = Depends(require_any_role),
    db=Depends(get_db)
):
    """تصدير فاتورة بصيغة PDF"""
    try:
        export_service = ExportService(db)
        pdf_buffer = await export_service.export_invoice_pdf(invoice_id)
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=invoice_{invoice_id}.pdf"
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.get("/rentals/excel")
async def export_rentals_excel(
    status: str = None,
    current_user: dict = Depends(require_any_role),
    db=Depends(get_db)
):
    """تصدير قائمة العقود بصيغة Excel"""
    try:
        export_service = ExportService(db)
        excel_buffer = await export_service.export_rentals_excel(status)
        
        filename = f"rentals_{status if status else 'all'}.xlsx"
        return StreamingResponse(
            excel_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.get("/customers/excel")
async def export_customers_excel(
    current_user: dict = Depends(require_any_role),
    db=Depends(get_db)
):
    """تصدير قائمة العملاء بصيغة Excel"""
    try:
        export_service = ExportService(db)
        excel_buffer = await export_service.export_customers_excel()
        
        return StreamingResponse(
            excel_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": "attachment; filename=customers.xlsx"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.get("/equipment/excel")
async def export_equipment_excel(
    current_user: dict = Depends(require_any_role),
    db=Depends(get_db)
):
    """تصدير قائمة المعدات بصيغة Excel"""
    try:
        export_service = ExportService(db)
        excel_buffer = await export_service.export_equipment_excel()
        
        return StreamingResponse(
            excel_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": "attachment; filename=equipment.xlsx"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.get("/revenue/report/pdf")
async def export_revenue_report_pdf(
    start_date: str = None,
    end_date: str = None,
    current_user: dict = Depends(require_any_role),
    db=Depends(get_db)
):
    """تصدير تقرير الإيرادات بصيغة PDF"""
    try:
        export_service = ExportService(db)
        pdf_buffer = await export_service.export_revenue_report_pdf(start_date, end_date)
        
        filename = f"revenue_report_{start_date or 'all'}_{end_date or 'all'}.pdf"
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")
