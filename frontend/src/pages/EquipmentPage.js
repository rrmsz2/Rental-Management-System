import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from '../api/axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Package, Loader2, Plus, Edit, Trash2, CheckCircle2, XCircle, Wrench } from 'lucide-react';

const EquipmentPage = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    serial_no: '',
    daily_rate: '',
    status: 'available',
    purchase_date: '',
    notes: '',
    image_url: ''
  });

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await axios.get('/equipment');
      setEquipment(response.data);
    } catch (error) {
      toast.error('فشل في تحميل المعدات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (submitData.daily_rate) {
        submitData.daily_rate = parseFloat(submitData.daily_rate);
      }
      
      if (editingEquipment) {
        await axios.put(`/equipment/${editingEquipment.id}`, submitData);
        toast.success('تم تحديث المعدة بنجاح');
      } else {
        await axios.post('/equipment', submitData);
        toast.success('تم إضافة المعدة بنجاح');
      }
      setDialogOpen(false);
      fetchEquipment();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في حفظ المعدة');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه المعدة؟')) return;
    
    try {
      await axios.delete(`/equipment/${id}`);
      toast.success('تم حذف المعدة بنجاح');
      fetchEquipment();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في حذف المعدة');
    }
  };

  const handleEdit = (equipment) => {
    setEditingEquipment(equipment);
    setFormData({
      ...equipment,
      daily_rate: equipment.daily_rate?.toString() || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingEquipment(null);
    setFormData({
      name: '',
      category: '',
      serial_no: '',
      daily_rate: '',
      status: 'available',
      purchase_date: '',
      notes: '',
      image_url: ''
    });
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'available':
        return { label: 'متاحة', icon: CheckCircle2, color: 'bg-green-100 text-green-600' };
      case 'rented':
        return { label: 'مؤجرة', icon: XCircle, color: 'bg-red-100 text-red-600' };
      case 'maintenance':
        return { label: 'صيانة', icon: Wrench, color: 'bg-amber-100 text-amber-600' };
      default:
        return { label: status, icon: Package, color: 'bg-slate-100 text-slate-600' };
    }
  };

  return (
    <Layout>
      <div className="space-y-6 fade-in" data-testid="equipment-page">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">المعدات</h2>
            <p className="text-slate-600 mt-2">إدارة المعدات المتاحة للتأجير</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button data-testid="add-equipment-button" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-md">
                <Plus className="ml-2" size={20} />
                إضافة معدة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
              <DialogHeader>
                <DialogTitle className="text-2xl text-slate-800 font-bold">
                  {editingEquipment ? 'تحرير المعدة' : 'إضافة معدة جديدة'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5 mt-4" data-testid="equipment-form">
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <Label htmlFor="name" className="text-slate-700 font-medium text-sm mb-2 block">اسم المعدة *</Label>
                    <Input
                      id="name"
                      data-testid="input-name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-slate-700 font-medium text-sm mb-2 block">الفئة *</Label>
                    <Input
                      id="category"
                      data-testid="input-category"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      required
                      className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                      placeholder="مثال: أدوات كهربائية"
                    />
                  </div>
                  <div>
                    <Label htmlFor="serial_no" className="text-slate-700 font-medium text-sm mb-2 block">الرقم التسلسلي</Label>
                    <Input
                      id="serial_no"
                      data-testid="input-serial"
                      value={formData.serial_no}
                      onChange={(e) => setFormData({...formData, serial_no: e.target.value})}
                      className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="daily_rate" className="text-slate-700 font-medium text-sm mb-2 block">السعر اليومي (ريال) *</Label>
                    <Input
                      id="daily_rate"
                      data-testid="input-rate"
                      type="number"
                      step="0.01"
                      value={formData.daily_rate}
                      onChange={(e) => setFormData({...formData, daily_rate: e.target.value})}
                      required
                      className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status" className="text-slate-700 font-medium text-sm mb-2 block">الحالة *</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger className="h-11 border-slate-200 bg-slate-50/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">متاحة</SelectItem>
                        <SelectItem value="rented">مؤجرة</SelectItem>
                        <SelectItem value="maintenance">صيانة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="purchase_date" className="text-slate-700 font-medium text-sm mb-2 block">تاريخ الشراء</Label>
                    <Input
                      id="purchase_date"
                      data-testid="input-purchase-date"
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
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
                </div>
                <Button type="submit" data-testid="submit-equipment" className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-md">
                  {editingEquipment ? 'تحديث المعدة' : 'إضافة المعدة'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-cyan-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {equipment.map((item) => {
              const statusInfo = getStatusInfo(item.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div key={item.id} data-testid={`equipment-card-${item.id}`} className="modern-card p-5">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800">{item.name}</h3>
                        <p className="text-sm text-slate-500 mt-1">{item.category}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusInfo.color}`}>
                        <StatusIcon size={20} />
                      </div>
                    </div>
                    
                    <div className="bg-cyan-50 px-3 py-2 rounded-lg">
                      <p className="text-sm text-cyan-700 font-semibold">
                        {item.daily_rate} ريال / يوم
                      </p>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      {item.serial_no && (
                        <p className="text-slate-600">الرقم التسلسلي: {item.serial_no}</p>
                      )}
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon size={14} />
                        {statusInfo.label}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                      <Button
                        data-testid={`edit-equipment-${item.id}`}
                        size="sm"
                        onClick={() => handleEdit(item)}
                        className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200"
                      >
                        <Edit size={16} className="ml-1" />
                        تحرير
                      </Button>
                      <Button
                        data-testid={`delete-equipment-${item.id}`}
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item.id)}
                        className="bg-red-50 text-red-600 hover:bg-red-100 border-0"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && equipment.length === 0 && (
          <div className="modern-card p-12 text-center">
            <Package size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-500">لا يوجد معدات بعد. ابدأ بإضافة معدة جديدة!</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EquipmentPage;