import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from '../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Users, 
  Package, 
  FileText, 
  AlertCircle, 
  Receipt, 
  TrendingUp,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/reports/dashboard');
      setStats(response.data);
    } catch (error) {
      toast.error('فشل في تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    {
      title: 'إجمالي العملاء',
      value: stats.total_customers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      testId: 'stat-customers'
    },
    {
      title: 'إجمالي الموظفين',
      value: stats.total_employees,
      subtitle: `${stats.active_employees} نشط`,
      icon: Users,
      color: 'from-cyan-500 to-cyan-600',
      testId: 'stat-employees'
    },
    {
      title: 'إجمالي المعدات',
      value: stats.total_equipment,
      subtitle: `${stats.rented_equipment} مؤجرة | ${stats.available_equipment} متاحة`,
      icon: Package,
      color: 'from-teal-500 to-teal-600',
      testId: 'stat-equipment'
    },
    {
      title: 'عقود نشطة',
      value: stats.active_rentals,
      icon: FileText,
      color: 'from-emerald-500 to-emerald-600',
      testId: 'stat-active-rentals'
    },
    {
      title: 'عقود متأخرة',
      value: stats.overdue_rentals,
      icon: AlertCircle,
      color: 'from-red-500 to-red-600',
      testId: 'stat-overdue-rentals',
      highlight: stats.overdue_rentals > 0
    },
    {
      title: 'فواتير غير مدفوعة',
      value: stats.unpaid_invoices,
      subtitle: `${stats.unpaid_total.toFixed(2)} ريال`,
      icon: Receipt,
      color: 'from-amber-500 to-amber-600',
      testId: 'stat-unpaid-invoices'
    },
    {
      title: 'إيرادات اليوم',
      value: `${stats.today_revenue.toFixed(2)} ريال`,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      testId: 'stat-today-revenue'
    },
    {
      title: 'إيرادات الشهر',
      value: `${stats.month_revenue.toFixed(2)} ريال`,
      icon: CheckCircle2,
      color: 'from-purple-500 to-purple-600',
      testId: 'stat-month-revenue'
    },
    {
      title: 'نسبة الاستخدام',
      value: `${stats.utilization_rate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'from-indigo-500 to-indigo-600',
      testId: 'stat-utilization'
    },
  ] : [];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96" data-testid="dashboard-loading">
          <Loader2 className="h-12 w-12 animate-spin text-teal-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 fade-in" data-testid="dashboard-page">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">لوحة التحكم</h2>
          <p className="text-slate-600 mt-2">نظرة عامة شاملة على العمليات والإحصائيات</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                data-testid={stat.testId}
                className={`modern-card p-5 rounded-xl transform hover:scale-105 transition-all duration-300 ${
                  stat.highlight ? 'ring-2 ring-red-400 bg-red-50/90' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">
                      {stat.title}
                    </p>
                    <div className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <Icon size={24} className="text-white" />
                  </div>
                </div>
                {stat.subtitle && (
                  <p className="text-sm text-slate-500 mt-2">{stat.subtitle}</p>
                )}
              </div>
            );
          })}
        </div>

        {stats?.overdue_rentals > 0 && (
          <div className="modern-card bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 p-6" data-testid="overdue-alert">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertCircle size={24} className="text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-800 mb-1">
                  تنبيه: عقود متأخرة
                </h3>
                <p className="text-red-700">
                  هناك {stats.overdue_rentals} عقد متأخر. الرجاء متابعة الإرجاع مع العملاء.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;