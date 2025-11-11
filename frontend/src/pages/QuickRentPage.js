import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Package, Loader2, CheckCircle, AlertCircle, QrCode, User, Phone, Wallet, FileText } from 'lucide-react';

const QuickRentPage = () => {
  const { equipmentId } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    deposit: '0',
    notes: ''
  });

  useEffect(() => {
    // Check if coming from QR scan with session
    const qrSession = localStorage.getItem('qr_session');
    if (!qrSession) {
      // No session, redirect to QR login
      navigate(`/qr-login/${equipmentId}`);
      return;
    }
    
    fetchEquipment();
  }, [equipmentId]);

  const fetchEquipment = async () => {
    try {
      const response = await axios.get(`/quick-rental/equipment/${equipmentId}`);
      setEquipment(response.data);
      
      if (!response.data.is_available) {
        toast.error('هذه المعدة غير متاحة حالياً');
      }
    } catch (error) {
      toast.error('فشل في تحميل بيانات المعدة');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate phone number (8 digits)
    if (!/^\d{8}$/.test(formData.customer_phone)) {
      toast.error('رقم الهاتف يجب أن يكون 8 أرقام');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post('/quick-rental/create', {
        equipment_id: equipmentId,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        deposit: parseFloat(formData.deposit) || 0,
        notes: formData.notes
      });

      toast.success('تم إبرام العقد بنجاح! تم إرسال إشعار للعميل');
      
      // Show success message and redirect after 3 seconds
      setTimeout(() => {
        navigate(`/quick-return/${equipmentId}`);
      }, 2000);
      
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'فشل في إنشاء العقد';
      toast.error(errorMessage);
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

  if (!equipment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">المعدة غير موجودة</h2>
            <p className="text-slate-600">تحقق من الرمز وحاول مرة أخرى</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!equipment.is_available) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">المعدة مؤجرة حالياً</h2>
            <p className="text-slate-600 mb-4">هذه المعدة غير متاحة في الوقت الحالي</p>
            <Button
              onClick={() => navigate(`/quick-return/${equipmentId}`)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              إرجاع المعدة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg mb-4">
            <QrCode className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">تأجير سريع</h1>
          <p className="text-slate-600">أدخل بيانات العميل لإبرام عقد التأجير</p>
        </div>

        {/* Equipment Card */}
        <Card className="mb-6 border-2 border-cyan-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <CardTitle className="flex items-center gap-3">
              <Package className="text-cyan-600" size={24} />
              <span className="text-slate-800">{equipment.equipment.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">الفئة</p>
                <p className="text-sm font-semibold text-slate-800">{equipment.equipment.category}</p>
              </div>
              <div className="bg-cyan-50 p-3 rounded-lg">
                <p className="text-xs text-cyan-700 mb-1">السعر اليومي</p>
                <p className="text-lg font-bold text-cyan-600">{equipment.equipment.daily_rate} ريال</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rental Form */}
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">بيانات العميل</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Customer Name */}
              <div>
                <Label htmlFor="customer_name" className="text-slate-700 font-medium flex items-center gap-2 mb-2">
                  <User size={16} className="text-cyan-600" />
                  اسم العميل *
                </Label>
                <Input
                  id="customer_name"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  className="h-12 border-slate-200 bg-slate-50/50 focus:bg-white text-lg"
                  placeholder="أدخل اسم العميل الكامل"
                />
              </div>

              {/* Customer Phone */}
              <div>
                <Label htmlFor="customer_phone" className="text-slate-700 font-medium flex items-center gap-2 mb-2">
                  <Phone size={16} className="text-cyan-600" />
                  رقم الهاتف (8 أرقام) *
                </Label>
                <div className="flex gap-2">
                  <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg px-3 text-slate-600 font-semibold">
                    +968
                  </div>
                  <Input
                    id="customer_phone"
                    required
                    type="tel"
                    maxLength="8"
                    pattern="\d{8}"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({...formData, customer_phone: e.target.value.replace(/\D/g, '')})}
                    className="flex-1 h-12 border-slate-200 bg-slate-50/50 focus:bg-white text-lg"
                    placeholder="12345678"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">سيتم إرسال إشعار WhatsApp على هذا الرقم</p>
              </div>

              {/* Deposit */}
              <div>
                <Label htmlFor="deposit" className="text-slate-700 font-medium flex items-center gap-2 mb-2">
                  <Wallet size={16} className="text-cyan-600" />
                  الوديعة (ريال)
                </Label>
                <Input
                  id="deposit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.deposit}
                  onChange={(e) => setFormData({...formData, deposit: e.target.value})}
                  className="h-12 border-slate-200 bg-slate-50/50 focus:bg-white text-lg"
                  placeholder="0.00"
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-slate-700 font-medium flex items-center gap-2 mb-2">
                  <FileText size={16} className="text-cyan-600" />
                  ملاحظات (اختياري)
                </Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="h-12 border-slate-200 bg-slate-50/50 focus:bg-white"
                  placeholder="أي ملاحظات إضافية"
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>
                    سيتم إبرام العقد فوراً وإرسال إشعار WhatsApp للعميل. الفاتورة سيتم احتسابها عند الإرجاع.
                  </span>
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-14 text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    جاري الإبرام...
                  </>
                ) : (
                  <>
                    <CheckCircle className="ml-2" size={20} />
                    إبرام العقد وإرسال الإشعار
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuickRentPage;
