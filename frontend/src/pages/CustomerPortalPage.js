import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FileText, Package, DollarSign, Calendar, LogOut, User } from 'lucide-react';
import { toast } from 'sonner';

const CustomerPortalPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rentals, setRentals] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rentals');

  useEffect(() => {
    if (!user?.customer_id) {
      toast.error('لا يمكن الوصول إلى هذه الصفحة');
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch customer rentals
      const rentalsRes = await axios.get('/rentals');
      const myRentals = rentalsRes.data.filter(r => r.customer_id === user.customer_id);
      setRentals(myRentals);

      // Fetch customer invoices
      const invoicesRes = await axios.get('/invoices');
      const myInvoices = invoicesRes.data.filter(inv => {
        const rental = myRentals.find(r => r.id === inv.contract_id);
        return rental !== undefined;
      });
      setInvoices(myInvoices);

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('تم تسجيل الخروج');
    navigate('/login');
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'نشط',
      closed: 'مغلق',
      cancelled: 'ملغي'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/40" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">مرحباً بك</h1>
                <p className="text-sm text-gray-600">{user?.full_name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut size={20} />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">إجمالي العقود</h3>
              <Package className="text-blue-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{rentals.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">العقود النشطة</h3>
              <Calendar className="text-green-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {rentals.filter(r => r.status === 'active').length}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">الفواتير</h3>
              <FileText className="text-purple-600" size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900">{invoices.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('rentals')}
                className={`flex-1 py-4 px-6 text-center font-medium transition ${
                  activeTab === 'rentals'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Package className="inline-block ml-2" size={20} />
                عقود الإيجار
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`flex-1 py-4 px-6 text-center font-medium transition ${
                  activeTab === 'invoices'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="inline-block ml-2" size={20} />
                الفواتير
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Rentals Tab */}
            {activeTab === 'rentals' && (
              <div>
                {rentals.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600">لا توجد عقود</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rentals.map((rental) => (
                      <div
                        key={rental.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {rental.equipment_name || 'معدة'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              رقم العقد: {rental.contract_no}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rental.status)}`}>
                            {getStatusLabel(rental.status)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">تاريخ البدء:</span>
                            <p className="font-medium text-gray-900">
                              {new Date(rental.start_date).toLocaleDateString('ar')}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">تاريخ الانتهاء:</span>
                            <p className="font-medium text-gray-900">
                              {rental.end_date ? new Date(rental.end_date).toLocaleDateString('ar') : '-'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">الأجرة اليومية:</span>
                            <p className="font-medium text-green-600">
                              {rental.daily_rate_snap} ر.ع
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">التأمين:</span>
                            <p className="font-medium text-blue-600">
                              {rental.deposit || 0} ر.ع
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              <div>
                {invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600">لا توجد فواتير</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">
                              فاتورة #{invoice.invoice_no}
                            </h3>
                            <p className="text-sm text-gray-600">
                              تاريخ الإصدار: {new Date(invoice.issue_date).toLocaleDateString('ar')}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            invoice.paid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {invoice.paid ? 'مدفوع' : 'غير مدفوع'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">المبلغ الأساسي:</span>
                            <p className="font-medium text-gray-900">
                              {invoice.subtotal.toFixed(2)} ر.ع
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">الضريبة:</span>
                            <p className="font-medium text-gray-900">
                              {invoice.tax_amount.toFixed(2)} ر.ع
                            </p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-600">المبلغ الإجمالي:</span>
                            <p className="font-bold text-blue-600 text-lg">
                              {invoice.total.toFixed(2)} ر.ع
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPortalPage;
