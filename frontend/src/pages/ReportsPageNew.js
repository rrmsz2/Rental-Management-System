import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import Layout from '../components/Layout';
import { Download, FileText, Users, DollarSign } from 'lucide-react';

const ReportsPageNew = () => {
  const [activeTab, setActiveTab] = useState('revenue');
  const [loading, setLoading] = useState(false);
  const [revenueReport, setRevenueReport] = useState(null);
  const [customersReport, setCustomersReport] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchRevenueReport = async () => {
    setLoading(true);
    try {
      const url = `/reports/revenue/detailed${
        startDate ? `?start_date=${startDate}` : ''
      }${endDate ? `${startDate ? '&' : '?'}end_date=${endDate}` : ''}`;
      
      const res = await axios.get(url);
      setRevenueReport(res.data);
    } catch (error) {
      console.error('Failed to fetch revenue report:', error);
    }
    setLoading(false);
  };

  const fetchCustomersReport = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/reports/customers/report?limit=50');
      setCustomersReport(res.data);
    } catch (error) {
      console.error('Failed to fetch customers report:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'revenue') {
      fetchRevenueReport();
    } else if (activeTab === 'customers') {
      fetchCustomersReport();
    }
  }, [activeTab]);

  const downloadInvoicePDF = async (invoiceId) => {
    try {
      const res = await axios.get(`/exports/invoice/${invoiceId}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('فشل تنزيل الفاتورة');
    }
  };

  const downloadRentalsExcel = async (status = null) => {
    try:
      const url = `/exports/rentals/excel${status ? `?status=${status}` : ''}`;
      const res = await axios.get(url, {
        responseType: 'blob'
      });
      
      const downloadUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `rentals_${status || 'all'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download Excel:', error);
      alert('فشل تنزيل الملف');
    }
  };

  const downloadCustomersExcel = async () => {
    try {
      const res = await axios.get('/exports/customers/excel', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'customers.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download Excel:', error);
      alert('فشل تنزيل الملف');
    }
  };

  const downloadEquipmentExcel = async () => {
    try {
      const res = await axios.get('/exports/equipment/excel', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'equipment.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download Excel:', error);
      alert('فشل تنزيل الملف');
    }
  };

  const downloadRevenueReportPDF = async () => {
    try {
      const url = `/exports/revenue/report/pdf${
        startDate ? `?start_date=${startDate}` : ''
      }${endDate ? `${startDate ? '&' : '?'}end_date=${endDate}` : ''}`;
      
      const res = await axios.get(url, {
        responseType: 'blob'
      });
      
      const downloadUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `revenue_report_${startDate || 'all'}_${endDate || 'all'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('فشل تنزيل التقرير');
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">التقارير والإحصائيات</h1>
          <p className="text-gray-600">تقارير مفصلة عن الإيرادات والعملاء والعقود</p>
        </div>

        {/* Quick Export Actions */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">تصدير سريع</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={downloadRentalsExcel}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Download className="w-5 h-5" />
              تصدير جميع العقود (Excel)
            </button>
            <button
              onClick={downloadCustomersExcel}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download className="w-5 h-5" />
              تصدير العملاء (Excel)
            </button>
            <button
              onClick={downloadEquipmentExcel}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Download className="w-5 h-5" />
              تصدير المعدات (Excel)
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 space-x-reverse px-6">
              <button
                onClick={() => setActiveTab('revenue')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'revenue'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DollarSign className="w-5 h-5 inline-block ml-2" />
                تقرير الإيرادات
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'customers'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-5 h-5 inline-block ml-2" />
                تقرير العملاء
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Revenue Report Tab */}
            {activeTab === 'revenue' && (
              <div>
                {/* Filters */}
                <div className="mb-6 flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      من تاريخ
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      إلى تاريخ
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={fetchRevenueReport}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    بحث
                  </button>
                  <button
                    onClick={downloadRevenueReportPDF}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    تصدير PDF
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : revenueReport ? (
                  <div>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">عدد الفواتير</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {revenueReport.summary.total_invoices}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">إجمالي الإيرادات</p>
                        <p className="text-2xl font-bold text-green-600">
                          {revenueReport.summary.total_revenue.toFixed(2)} ر.ع
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">الضريبة</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {revenueReport.summary.total_tax.toFixed(2)} ر.ع
                        </p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">الخصم</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {revenueReport.summary.total_discount.toFixed(2)} ر.ع
                        </p>
                      </div>
                    </div>

                    {/* Invoices Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الفاتورة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ الأساسي</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الضريبة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجمالي</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {revenueReport.invoices.map((invoice) => (
                            <tr key={invoice.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {invoice.invoice_no}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {new Date(invoice.issue_date).toLocaleDateString('ar')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {invoice.subtotal.toFixed(2)} ر.ع
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {invoice.tax_amount.toFixed(2)} ر.ع
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                {invoice.total.toFixed(2)} ر.ع
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  invoice.paid 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {invoice.paid ? 'مدفوع' : 'غير مدفوع'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                  onClick={() => downloadInvoicePDF(invoice.id)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <FileText className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Customers Report Tab */}
            {activeTab === 'customers' && (
              <div>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الاسم</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الهاتف</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">عدد العقود</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">عقود نشطة</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">عقود متأخرة</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجمالي الإنفاق</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {customersReport.map((customer) => (
                          <tr key={customer.customer_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {customer.full_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {customer.phone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {customer.total_rentals}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {customer.active_rentals}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {customer.overdue_rentals > 0 ? (
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                  {customer.overdue_rentals}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                              {customer.total_spent.toFixed(2)} ر.ع
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReportsPageNew;
