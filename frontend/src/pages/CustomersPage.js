import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from '../api/axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { Plus, Loader2, Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '+968',
    whatsapp_opt_in: true,
    email: '',
    national_id: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      toast.error('فشل في تحميل العملاء');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await axios.put(`/customers/${editingCustomer.id}`, formData);
        toast.success('تم تحديث العميل بنجاح');
      } else {
        await axios.post('/customers', formData);
        toast.success('تم إضافة العميل بنجاح');
      }
      setDialogOpen(false);
      fetchCustomers();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في حفظ العميل');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العميل؟')) return;
    
    try {
      await axios.delete(`/customers/${id}`);
      toast.success('تم حذف العميل بنجاح');
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في حذف العميل');
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData(customer);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCustomer(null);
    setFormData({
      full_name: '',
      phone: '+968',
      whatsapp_opt_in: true,
      email: '',
      national_id: '',
      address: '',
      notes: ''
    });
  };

  return (
    <Layout>
      <div className="space-y-6 fade-in" data-testid="customers-page">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">العملاء</h2>
            <p className="text-slate-600 mt-2">إدارة قاعدة بيانات العملاء</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button data-testid="add-customer-button" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-md">
                <Plus className="ml-2" size={20} />
                إضافة عميل جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
              <DialogHeader>
                <DialogTitle className="text-2xl text-slate-800 font-bold">
                  {editingCustomer ? 'تحرير العميل' : 'إضافة عميل جديد'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5 mt-4" data-testid="customer-form">
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <Label htmlFor="full_name" className="text-slate-700 font-medium text-sm mb-2 block">الاسم الكامل *</Label>
                    <Input
                      id="full_name"
                      data-testid="input-full-name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      required
                      className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-slate-700 font-medium text-sm mb-2 block">رقم الهاتف *</Label>
                    <Input
                      id="phone"
                      data-testid="input-phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                      dir="ltr"
                      className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-slate-700 font-medium text-sm mb-2 block">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      data-testid="input-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="national_id" className="text-slate-700 font-medium text-sm mb-2 block">الرقم الوطني</Label>
                    <Input
                      id="national_id"
                      data-testid="input-national-id"
                      value={formData.national_id}
                      onChange={(e) => setFormData({...formData, national_id: e.target.value})}
                      className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address" className="text-slate-700 font-medium text-sm mb-2 block">العنوان</Label>
                    <Input
                      id="address"
                      data-testid="input-address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="notes" className="text-slate-700 font-medium text-sm mb-2 block">ملاحظات</Label>
                    <Input
                      id="notes"
                      data-testid="input-notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <Label htmlFor="whatsapp_opt_in" className="text-slate-700 font-medium text-sm">تفعيل إشعارات واتساب</Label>
                    <Switch
                      id="whatsapp_opt_in"
                      data-testid="switch-whatsapp"
                      checked={formData.whatsapp_opt_in}
                      onCheckedChange={(checked) => setFormData({...formData, whatsapp_opt_in: checked})}
                    />
                  </div>
                </div>
                <Button type="submit" data-testid="submit-customer" className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-md">
                  {editingCustomer ? 'تحديث العميل' : 'إضافة العميل'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-teal-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {customers.map((customer) => (
              <div key={customer.id} data-testid={`customer-card-${customer.id}`} className="modern-card p-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold text-slate-800">{customer.full_name}</h3>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <Users size={20} className="text-white" />
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-600" dir="ltr">{customer.phone}</p>
                    {customer.email && <p className="text-slate-500">{customer.email}</p>}
                    {customer.national_id && <p className="text-slate-500">الرقم الوطني: {customer.national_id}</p>}
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    <Button
                      data-testid={`edit-customer-${customer.id}`}
                      size="sm"
                      onClick={() => handleEdit(customer)}
                      className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      <Edit size={16} className="ml-1" />
                      تحرير
                    </Button>
                    <Button
                      data-testid={`delete-customer-${customer.id}`}
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(customer.id)}
                      className="bg-red-50 text-red-600 hover:bg-red-100 border-0"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && customers.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-gray-500">لا يوجد عملاء بعد. ابدأ بإضافة عميل جديد!</p>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default CustomersPage;
