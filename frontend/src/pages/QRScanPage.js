import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from '../api/axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Package, Loader2, User, Calendar, DollarSign, FileText, LogOut, ArrowRight } from 'lucide-react';

const QRScanPage = () => {
  const { equipmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [equipment, setEquipment] = useState(null);
  const [userType, setUserType] = useState(null); // 'customer' or 'employee'
  const [activeRental, setActiveRental] = useState(null);
  const [estimatedInvoice, setEstimatedInvoice] = useState(null);

  useEffect(() => {
    // Check session
    const qrSession = localStorage.getItem('qr_session');
    if (!qrSession && !location.state?.session) {
      // No session, redirect to login
      navigate(`/qr-login/${equipmentId}`);
      return;
    }

    const sessionData = location.state?.session || JSON.parse(qrSession);
    
    // Check if session is expired (24 hours)
    const now = Date.now();
    if (now - sessionData.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('qr_session');
      navigate(`/qr-login/${equipmentId}`);
      return;
    }

    setSession(sessionData);
    checkUserTypeAndLoadData(sessionData);
  }, [equipmentId]);

  const checkUserTypeAndLoadData = async (sessionData) => {
    try {
      // Get equipment info
      const equipResponse = await axios.get(`/quick-rental/equipment/${equipmentId}`);
      setEquipment(equipResponse.data);

      // Check if user has active rental for this equipment
      try {
        const rentalResponse = await axios.get(`/quick-rental/active-rental/${equipmentId}`);
        
        // User has active rental for this equipment
        const rental = rentalResponse.data;
        
        // Check if the logged-in user is the customer
        if (rental.customer.phone === sessionData.phone) {
          setUserType('customer');
          setActiveRental(rental);
          
          // Calculate estimated invoice
          const days = rental.days_elapsed;
          const baseAmount = days * rental.rental.daily_rate_snap;
          const deposit = rental.rental.deposit || 0;
          const subtotal = baseAmount - deposit;
          const taxAmount = subtotal * 0.05; // 5% tax
          const total = subtotal + taxAmount;
          
          setEstimatedInvoice({
            days,
            baseAmount,
            deposit,
            subtotal,
            taxAmount,
            total
          });
        } else {
          // Logged in user is not the customer, must be employee
          setUserType('employee');
        }
      } catch (error) {
        // No active rental, check if user is customer or employee
        // Try to find if phone belongs to customer or employee
        const response = await axios.get(`/customers?phone=${sessionData.phone}`);
        if (response.data && response.data.length > 0) {
          setUserType('customer_no_rental');
        } else {
          setUserType('employee');
        }
      }
    } catch (error) {
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('qr_session');
    navigate(`/qr-login/${equipmentId}`);
  };

  const handleReturn = () => {
    navigate(`/quick-return/${equipmentId}`);
  };

  const handleRent = () => {
    navigate(`/quick-rent/${equipmentId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-600" />
      </div>
    );
  }

  // Customer View - Has Active Rental
  if (userType === 'customer' && activeRental) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 py-8 px-4" dir="rtl">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">عقد الإيجار</h1>
              <p className="text-slate-600">مرحباً، {activeRental.customer.full_name}</p>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut size={16} className="ml-1" />
              خروج
            </Button>
          </div>

          {/* Equipment Card */}
          <Card className="mb-6 border-2 border-cyan-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
              <CardTitle className="flex items-center gap-3">
                <Package className="text-cyan-600" size={24} />
                <span className="text-slate-800">{activeRental.equipment.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">الفئة</p>
                  <p className="text-sm font-semibold text-slate-800">{activeRental.equipment.category}</p>
                </div>
                <div className="bg-cyan-50 p-3 rounded-lg">
                  <p className="text-xs text-cyan-700 mb-1">السعر اليومي</p>
                  <p className="text-lg font-bold text-cyan-600">{activeRental.rental.daily_rate_snap} ريال</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rental Details */}
          <Card className="mb-6 shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                <FileText className="text-cyan-600" size={20} />
                معلومات العقد
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Calendar size={14} />
                    تاريخ الاستلام
                  </p>
                  <p className="text-sm font-bold text-slate-800">{activeRental.rental.start_date}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-xs text-orange-700 mb-1">عدد الأيام</p>
                  <p className="text-2xl font-bold text-orange-600">{activeRental.days_elapsed} يوم</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">رقم العقد</p>
                <p className="text-sm font-bold text-slate-800">{activeRental.rental.contract_no}</p>
              </div>
            </CardContent>
          </Card>

          {/* Estimated Invoice */}
          <Card className="shadow-xl border-0 border-t-4 border-t-cyan-500">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                <DollarSign className="text-cyan-600" size={20} />
                الفاتورة المقدرة لهذا اليوم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-600">التكلفة الأساسية</span>
                  <span className="font-semibold text-slate-800">{estimatedInvoice.baseAmount.toFixed(2)} ريال</span>
                </div>
                {estimatedInvoice.deposit > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-green-600">الوديعة</span>
                    <span className="font-semibold text-green-600">- {estimatedInvoice.deposit.toFixed(2)} ريال</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-600">المبلغ الخاضع للضريبة</span>
                  <span className="font-semibold text-slate-800">{estimatedInvoice.subtotal.toFixed(2)} ريال</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-slate-600">الضريبة (5%)</span>
                  <span className="font-semibold text-slate-800">{estimatedInvoice.taxAmount.toFixed(2)} ريال</span>
                </div>
                <div className="flex justify-between pt-2 bg-gradient-to-r from-cyan-500 to-blue-600 -mx-6 -mb-6 px-6 py-4 rounded-b-xl">
                  <span className="font-bold text-white text-lg">الإجمالي المقدر</span>
                  <span className="font-bold text-white text-2xl">{estimatedInvoice.total.toFixed(2)} ریال</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 text-center">
              💡 هذه فاتورة تقديرية بناءً على عدد الأيام حتى الآن. الفاتورة النهائية ستُحسب عند الإرجاع.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Employee View - Can Rent or Return
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 py-8 px-4" dir="rtl">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">إدارة المعدة</h1>
            <p className="text-slate-600">أنت مسجل كموظف</p>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut size={16} className="ml-1" />
            خروج
          </Button>
        </div>

        {/* Equipment Card */}
        <Card className="mb-6 border-2 border-cyan-200 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-100 rounded-2xl mb-3">
                <Package className="text-cyan-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">{equipment.equipment.name}</h3>
              <p className="text-slate-600 mb-2">{equipment.equipment.category}</p>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-50 rounded-lg">
                <span className="text-sm text-cyan-700">السعر اليومي:</span>
                <span className="text-lg font-bold text-cyan-600">{equipment.equipment.daily_rate} ریال</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          {equipment.is_available ? (
            <Button
              onClick={handleRent}
              className="w-full h-14 text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg"
            >
              <ArrowRight size={20} className="ml-2" />
              تأجير المعدة
            </Button>
          ) : (
            <Button
              onClick={handleReturn}
              className="w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg"
            >
              <ArrowRight size={20} className="ml-2" />
              إرجاع المعدة
            </Button>
          )}
        </div>

        {/* Status Info */}
        <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-700 text-center">
            <strong>حالة المعدة:</strong>{' '}
            {equipment.is_available ? (
              <span className="text-green-600">متاحة للتأجير</span>
            ) : (
              <span className="text-orange-600">مؤجرة حالياً</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRScanPage;
