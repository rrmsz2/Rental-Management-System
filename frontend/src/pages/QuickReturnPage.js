import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Package, Loader2, CheckCircle, AlertCircle, Calendar, User, Receipt, DollarSign } from 'lucide-react';

const QuickReturnPage = () => {
  const { equipmentId } = useParams();
  const navigate = useNavigate();
  const [rentalData, setRentalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [returnData, setReturnData] = useState({
    tax_rate: '0.05',
    discount_amount: '0',
    notes: ''
  });
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    fetchActiveRental();
  }, [equipmentId]);

  const fetchActiveRental = async () => {
    try {
      const response = await axios.get(`/quick-rental/active-rental/${equipmentId}`);
      setRentalData(response.data);
    } catch (error) {
      toast.error('لا يوجد عقد نشط لهذه المعدة');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    setSubmitting(true);
    try {
      const response = await axios.post(`/quick-rental/return/${rentalData.rental.id}`, {
        tax_rate: parseFloat(returnData.tax_rate),
        discount_amount: parseFloat(returnData.discount_amount),
        notes: returnData.notes
      });

      setInvoice(response.data.invoice);
      toast.success('تم إرجاع المعدة وإنشاء فاتورة مسودة');
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في إرجاع المعدة');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!rentalData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">لا يوجد عقد نشط</h2>
            <p className="text-slate-600 mb-4">هذه المعدة غير مؤجرة حالياً</p>
            <Button
              onClick={() => navigate(`/quick-rent/${equipmentId}`)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              تأجير المعدة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If invoice was created, show success screen
  if (invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 py-8 px-4" dir="rtl">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center bg-gradient-to-r from-green-50 to-emerald-50 pb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl text-slate-800">تم إرجاع المعدة بنجاح</CardTitle>
              <p className="text-slate-600 mt-2">تم إنشاء فاتورة مسودة - رقم الفاتورة: {invoice.invoice_no}</p>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Invoice Summary */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-600">عدد الأيام</span>
                  <span className="font-semibold text-slate-800">{invoice.rental_days} يوم</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-600">التكلفة الأساسية</span>
                  <span className="font-semibold text-slate-800">{invoice.base_cost.toFixed(2)} ريال</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-600">المبلغ الخاضع للضريبة</span>
                  <span className="font-semibold text-slate-800">{invoice.subtotal.toFixed(2)} ريال</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-600">الضريبة (5%)</span>
                  <span className="font-semibold text-slate-800">{invoice.tax_amount.toFixed(2)} ريال</span>
                </div>
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between pb-2 border-b border-slate-200">
                    <span className="text-green-600">الخصم</span>
                    <span className="font-semibold text-green-600">- {invoice.discount_amount.toFixed(2)} ريال</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 bg-cyan-600 -mx-4 -mb-4 px-4 py-3 rounded-b-xl">
                  <span className="font-bold text-white text-lg">الإجمالي</span>
                  <span className="font-bold text-white text-2xl">{invoice.total.toFixed(2)} ريال</span>
                </div>
              </div>

              {/* Draft Notice */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800 flex items-start gap-2">
                  <Receipt size={18} className="flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>فاتورة مسودة:</strong> يمكن تعديل هذه الفاتورة أو اعتمادها أو تسجيلها كمدفوعة من خلال لوحة التحكم.
                  </span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => navigate(`/quick-rent/${equipmentId}`)}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600"
                >
                  تأجير جديد
                </Button>
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  className="px-6"
                >
                  طباعة
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg mb-4">
            <Package className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">إرجاع المعدة</h1>
          <p className="text-slate-600">أكمل بيانات الإرجاع لإنشاء الفاتورة</p>
        </div>

        {/* Rental Info Card */}
        <Card className="mb-6 border-2 border-orange-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
            <CardTitle className="text-slate-800">معلومات العقد</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <User size={14} />
                  العميل
                </p>
                <p className="text-sm font-semibold text-slate-800">{rentalData.customer.full_name}</p>
                <p className="text-xs text-slate-600">{rentalData.customer.phone}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Package size={14} />
                  المعدة
                </p>
                <p className="text-sm font-semibold text-slate-800">{rentalData.equipment.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-cyan-50 p-3 rounded-lg">
                <p className="text-xs text-cyan-700 mb-1 flex items-center gap-1">
                  <Calendar size={14} />
                  تاريخ الاستلام
                </p>
                <p className="text-sm font-bold text-cyan-600">{rentalData.rental.start_date}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-xs text-orange-700 mb-1">عدد الأيام حتى الآن</p>
                <p className="text-2xl font-bold text-orange-600">{rentalData.days_elapsed} يوم</p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-800">التكلفة التقديرية:</span>
                <span className="text-xl font-bold text-blue-600">{rentalData.estimated_cost.toFixed(2)} ريال</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Return Form */}
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">تفاصيل الفاتورة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Tax Rate */}
            <div>
              <Label htmlFor="tax_rate" className="text-slate-700 font-medium flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-cyan-600" />
                نسبة الضريبة (%)
              </Label>
              <Input
                id="tax_rate"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={returnData.tax_rate}
                onChange={(e) => setReturnData({...returnData, tax_rate: e.target.value})}
                className="h-12 border-slate-200 bg-slate-50/50 focus:bg-white"
                placeholder="0.05 = 5%"
              />
            </div>

            {/* Discount */}
            <div>
              <Label htmlFor="discount" className="text-slate-700 font-medium flex items-center gap-2 mb-2">
                <Receipt size={16} className="text-cyan-600" />
                مبلغ الخصم (ريال)
              </Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                min="0"
                value={returnData.discount_amount}
                onChange={(e) => setReturnData({...returnData, discount_amount: e.target.value})}
                className="h-12 border-slate-200 bg-slate-50/50 focus:bg-white"
                placeholder="0.00"
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="text-slate-700 font-medium mb-2 block">
                ملاحظات على الفاتورة
              </Label>
              <Input
                id="notes"
                value={returnData.notes}
                onChange={(e) => setReturnData({...returnData, notes: e.target.value})}
                className="h-12 border-slate-200 bg-slate-50/50 focus:bg-white"
                placeholder="أي ملاحظات إضافية"
              />
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>ملاحظة:</strong> سيتم إنشاء فاتورة مسودة قابلة للتعديل. يمكنك تعديل البيانات أو اعتمادها أو تسجيلها كمدفوعة من لوحة التحكم.
              </p>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleReturn}
              disabled={submitting}
              className="w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جاري الإرجاع...
                </>
              ) : (
                <>
                  <CheckCircle className="ml-2" size={20} />
                  إرجاع المعدة وإنشاء الفاتورة
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuickReturnPage;
