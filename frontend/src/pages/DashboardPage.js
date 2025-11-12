import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  DollarSign, ShoppingCart, Package, Users, 
  TrendingUp, AlertTriangle, CheckCircle, Clock 
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
  <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-full bg-${color}-100`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
    </div>
    {trend && (
      <div className="mt-3 flex items-center text-sm">
        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
        <span className="text-green-500">{trend}</span>
      </div>
    )}
  </div>
);

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [rentalsData, setRentalsData] = useState([]);
  const [equipmentPerformance, setEquipmentPerformance] = useState([]);
  const [period, setPeriod] = useState('year');

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch dashboard stats
      const statsRes = await axios.get(`${API_URL}/reports/dashboard/v2`, { headers });
      setStats(statsRes.data);

      // Fetch revenue chart data
      const revenueRes = await axios.get(`${API_URL}/reports/revenue/chart?period=${period}`, { headers });
      setRevenueData(revenueRes.data);

      // Fetch rentals chart data
      const rentalsRes = await axios.get(`${API_URL}/reports/rentals/chart`, { headers });
      setRentalsData(rentalsRes.data.by_status);

      // Fetch equipment performance
      const equipmentRes = await axios.get(`${API_URL}/reports/equipment/performance?limit=5`, { headers });
      setEquipmentPerformance(equipmentRes.data);

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة التحكم</h1>
          <p className="text-gray-600">نظرة عامة على نظام إدارة الإيجارات</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="إجمالي الإيرادات"
            value={`${stats?.revenue?.total?.toFixed(2) || 0} ر.ع`}
            subtitle={`اليوم: ${stats?.revenue?.today?.toFixed(2) || 0} ر.ع`}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="العقود النشطة"
            value={stats?.rentals?.active || 0}
            subtitle={`إجمالي: ${stats?.rentals?.total || 0} عقد`}
            icon={ShoppingCart}
            color="blue"
          />
          <StatCard
            title="المعدات المتاحة"
            value={stats?.equipment?.available || 0}
            subtitle={`من أصل ${stats?.equipment?.total || 0} معدة`}
            icon={Package}
            color="purple"
          />
          <StatCard
            title="إجمالي العملاء"
            value={stats?.customers?.total || 0}
            icon={Users}
            color="orange"
          />
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">معدل الإشغال</h3>
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {stats?.equipment?.occupancy_rate?.toFixed(1) || 0}%
            </div>
            <p className="text-sm text-gray-600">
              {stats?.equipment?.rented || 0} معدة مؤجرة من أصل {stats?.equipment?.total || 0}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">العقود المتأخرة</h3>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-red-600 mb-2">
              {stats?.rentals?.overdue || 0}
            </div>
            <p className="text-sm text-gray-600">عقد متأخر عن الموعد</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">الفواتير غير المدفوعة</h3>
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {stats?.invoices?.unpaid_count || 0}
            </div>
            <p className="text-sm text-gray-600">
              مبلغ: {stats?.invoices?.unpaid_amount?.toFixed(2) || 0} ر.ع
            </p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">الإيرادات</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setPeriod('month')}
                  className={`px-3 py-1 rounded text-sm ${
                    period === 'month' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  30 يوم
                </button>
                <button
                  onClick={() => setPeriod('year')}
                  className={`px-3 py-1 rounded text-sm ${
                    period === 'year' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  12 شهر
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={period === 'year' ? 'month_name' : 'date_name'} 
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  name="الإيرادات (ر.ع)"
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Rentals Chart */}
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">حالة العقود</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rentalsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="العدد" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Equipment Performance */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">أداء المعدات - الأكثر إيجاراً</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المعدة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الفئة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">عدد الإيجارات</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجمالي الإيرادات</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {equipmentPerformance.map((equipment, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {equipment.equipment_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {equipment.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {equipment.rental_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                      {equipment.total_revenue.toFixed(2)} ر.ع
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        equipment.status === 'available' 
                          ? 'bg-green-100 text-green-800' 
                          : equipment.status === 'rented'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {equipment.status === 'available' ? 'متاح' : 
                         equipment.status === 'rented' ? 'مؤجر' : 'صيانة'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {equipmentPerformance.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              لا توجد بيانات متاحة
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
