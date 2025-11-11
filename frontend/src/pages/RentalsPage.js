import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from '../api/axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { FileText, Loader2 } from 'lucide-react';

const RentalsPage = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      const response = await axios.get('/rentals');
      setRentals(response.data);
    } catch (error) {
      toast.error('فشل في تحميل العقود');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 fade-in" data-testid="rentals-page">
        <div>
          <h2 className="text-3xl font-bold text-teal-700">عقود التأجير</h2>
          <p className="text-gray-600 mt-1">إدارة عقود التأجير النشطة</p>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-teal-600" />
          </div>
        ) : (
          <Card className="p-12 text-center">
            <FileText size={48} className="mx-auto text-teal-600 mb-4" />
            <p className="text-gray-500">صفحة العقود - قيد التطوير</p>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default RentalsPage;