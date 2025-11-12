import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from '../api/axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { BarChart3, Loader2 } from 'lucide-react';

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <Layout>
      <div className="space-y-6 fade-in" data-testid="reports-page">
        <div>
          <h2 className="text-3xl font-bold text-teal-700">التقارير</h2>
          <p className="text-gray-600 mt-1">تقارير الإيرادات والأداء</p>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-teal-600" />
          </div>
        ) : (
          <Card className="p-12 text-center">
            <BarChart3 size={48} className="mx-auto text-teal-600 mb-4" />
            <p className="text-gray-500">صفحة التقارير - قيد التطوير</p>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ReportsPage;