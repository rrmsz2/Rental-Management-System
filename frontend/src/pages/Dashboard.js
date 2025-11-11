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
      <div className="space-y-6 fade-in" data-testid="dashboard-page">
        <div>
          <h2 className="text-3xl font-bold text-teal-700">لوحة التحكم</h2>
          <p className="text-gray-600 mt-1">نظرة عامة على العمليات</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                data-testid={stat.testId}
                className={`card-hover border-2 ${
                  stat.highlight ? 'border-red-200 bg-red-50' : 'border-teal-100'
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </CardTitle>
                    <div
                      className={`p-2 rounded-lg bg-gradient-to-br ${stat.color} text-white`}
                    >
                      <Icon size={20} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {stats?.overdue_rentals > 0 && (
          <Card className="border-2 border-red-200 bg-red-50" data-testid="overdue-alert">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center gap-2">
                <AlertCircle size={24} />
                تنبيه: عقود متأخرة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">
                هناك {stats.overdue_rentals} عقد متأخر. الرجاء متابعة الإرجاع مع العملاء.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;