import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from '../api/axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { FileText, Loader2, Plus, Eye, CheckCircle, XCircle, PlayCircle, AlertCircle } from 'lucide-react';

const RentalsPage = () => {
  const [rentals, setRentals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [rentalSummary, setRentalSummary] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    equipment_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    deposit: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rentalsRes, customersRes, equipmentRes] = await Promise.all([
        axios.get('/rentals'),
        axios.get('/customers'),
        axios.get('/equipment')
      ]);
      setRentals(rentalsRes.data);
      setCustomers(customersRes.data);
      setEquipment(equipmentRes.data);
    } catch (error) {
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (submitData.deposit) {
        submitData.deposit = parseFloat(submitData.deposit);
      }
      
      await axios.post('/rentals', submitData);
      toast.success('تم إنشاء عقد التأجير بنجاح');
      setDialogOpen(false);
      fetchData();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في إنشاء العقد');
    }
  };

  const handleActivate = async (id) => {
    if (!window.confirm('هل تريد تفعيل هذا العقد؟')) return;
    
    try {
      await axios.post(`/rentals/${id}/activate`);
      toast.success('تم تفعيل العقد بنجاح');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في تفعيل العقد');
    }
  };

  const handleClose = async (id) => {
    if (!window.confirm('هل تريد إغلاق هذا العقد؟')) return;
    
    try {
      await axios.post(`/rentals/${id}/close`);
      toast.success('تم إغلاق العقد بنجاح');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في إغلاق العقد');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('هل تريد إلغاء هذا العقد؟')) return;
    
    try {
      await axios.post(`/rentals/${id}/cancel`);
      toast.success('تم إلغاء العقد بنجاح');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في إلغاء العقد');
    }
  };

  const handleViewDetails = async (rental) => {
    try {
      const response = await axios.get(`/rentals/${rental.id}/summary`);
      setRentalSummary(response.data);
      setSelectedRental(rental);
      setViewDialogOpen(true);
    } catch (error) {
      toast.error('فشل في تحميل تفاصيل العقد');
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      equipment_id: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      deposit: '',
      notes: ''
    });
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'draft':
        return { label: 'مسودة', color: 'bg-slate-100 text-slate-600', icon: FileText };
      case 'active':
        return { label: 'نشط', color: 'bg-green-100 text-green-600', icon: CheckCircle };
      case 'closed':
        return { label: 'مغلق', color: 'bg-blue-100 text-blue-600', icon: XCircle };
      case 'cancelled':
        return { label: 'ملغي', color: 'bg-red-100 text-red-600', icon: AlertCircle };
      default:
        return { label: status, color: 'bg-slate-100 text-slate-600', icon: FileText };
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.full_name || 'غير معروف';
  };

  const getEquipmentName = (equipmentId) => {
    const equip = equipment.find(e => e.id === equipmentId);
    return equip?.name || 'غير معروف';
  };

  return (
    <Layout>
      <div className="space-y-6 fade-in" data-testid="rentals-page">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">عقود التأجير</h2>
            <p className="text-slate-600 mt-2">إدارة عقود التأجير النشطة والمكتملة</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button data-testid="add-rental-button" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-md">
                <Plus className="ml-2" size={20} />
                إنشاء عقد جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
              <DialogHeader>
                <DialogTitle className="text-2xl text-slate-800 font-bold">
                  إنشاء عقد تأجير جديد
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5 mt-4" data-testid="rental-form">
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <Label htmlFor="customer_id" className="text-slate-700 font-medium text-sm mb-2 block">العميل *</Label>
                    <Select value={formData.customer_id} onValueChange={(value) => setFormData({...formData, customer_id: value})} required>
                      <SelectTrigger className="h-11 border-slate-200 bg-slate-50/50">
                        <SelectValue placeholder="اختر العميل" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.full_name} - {customer.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="equipment_id" className="text-slate-700 font-medium text-sm mb-2 block">المعدة *</Label>
                    <Select value={formData.equipment_id} onValueChange={(value) => setFormData({...formData, equipment_id: value})} required>
                      <SelectTrigger className="h-11 border-slate-200 bg-slate-50/50">
                        <SelectValue placeholder="اختر المعدة" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipment.filter(e => e.status === 'available').map(equip => (
                          <SelectItem key={equip.id} value={equip.id}>
                            {equip.name} - {equip.daily_rate} ريال/يوم
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="start_date" className="text-slate-700 font-medium text-sm mb-2 block">تاريخ البداية *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      required
                      className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="end_date" className="text-slate-700 font-medium text-sm mb-2 block">تاريخ النهاية *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      required
                      className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="deposit" className="text-slate-700 font-medium text-sm mb-2 block">الوديعة (ريال)</Label>
                    <Input
                      id="deposit"
                      type="number"
                      step="0.01"
                      value={formData.deposit}
                      onChange={(e) => setFormData({...formData, deposit: e.target.value})}
                      className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="notes" className="text-slate-700 font-medium text-sm mb-2 block">ملاحظات</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-md">
                  إنشاء العقد
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
          <div className="grid grid-cols-1 gap-4">
            {rentals.map((rental) => {
              const statusInfo = getStatusInfo(rental.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div key={rental.id} data-testid={`rental-card-${rental.id}`} className="modern-card p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                          <FileText className="text-white" size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">عقد #{rental.contract_no}</h3>
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${statusInfo.color} mt-1`}>
                            <StatusIcon size={14} />
                            {statusInfo.label}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500 text-xs mb-1">العميل</p>
                          <p className="text-slate-800 font-medium">{getCustomerName(rental.customer_id)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">المعدة</p>
                          <p className="text-slate-800 font-medium">{getEquipmentName(rental.equipment_id)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">الفترة</p>
                          <p className="text-slate-800 font-medium" style={{fontSize: '11px'}}>{rental.start_date} → {rental.end_date}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">السعر اليومي</p>
                          <p className="text-cyan-600 font-semibold">{rental.daily_rate_snap} ريال</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mr-4">
                      <Button
                        size="sm"
                        onClick={() => handleViewDetails(rental)}
                        className="bg-slate-100 text-slate-700 hover:bg-slate-200"
                      >
                        <Eye size={16} className="ml-1" />
                        عرض
                      </Button>
                      
                      {rental.status === 'active' && (
                        <Button
                          size="sm"
                          onClick={() => handleClose(rental.id)}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-0"
                        >
                          <CheckCircle size={16} className="ml-1" />
                          إرجاع وإغلاق
                        </Button>
                      )}
                      
                      {rental.status === 'active' && (
                        <Button
                          size="sm"
                          onClick={() => handleCancel(rental.id)}
                          variant="destructive"
                          className="bg-red-50 text-red-600 hover:bg-red-100 border-0"
                        >
                          <XCircle size={16} className="ml-1" />
                          إلغاء
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && rentals.length === 0 && (
          <div className="modern-card p-12 text-center">
            <FileText size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-500">لا يوجد عقود بعد. ابدأ بإنشاء عقد جديد!</p>
          </div>
        )}

        {/* View Rental Details Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl bg-white">
            <DialogHeader>
              <DialogTitle className="text-2xl text-slate-800 font-bold">
                تفاصيل العقد #{selectedRental?.contract_no}
              </DialogTitle>
            </DialogHeader>
            {rentalSummary && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">العميل</p>
                    <p className="font-semibold text-slate-800">{rentalSummary.customer?.full_name}</p>
                    <p className="text-sm text-slate-600">{rentalSummary.customer?.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">المعدة</p>
                    <p className="font-semibold text-slate-800">{rentalSummary.equipment?.name}</p>
                    <p className="text-sm text-slate-600">{rentalSummary.equipment?.category}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">عدد الأيام</span>
                    <span className="font-semibold text-slate-800">{rentalSummary.rental_days} يوم</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">التكلفة الأساسية</span>
                    <span className="font-semibold text-slate-800">{rentalSummary.base_cost?.toFixed(2)} ريال</span>
                  </div>
                  {rentalSummary.late_fee > 0 && (
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-red-600">رسوم التأخير ({rentalSummary.days_late} يوم)</span>
                      <span className="font-semibold text-red-600">{rentalSummary.late_fee?.toFixed(2)} ريال</span>
                    </div>
                  )}
                  {rentalSummary.rental?.deposit > 0 && (
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-600">الوديعة</span>
                      <span className="font-semibold text-green-600">- {rentalSummary.rental?.deposit} ريال</span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 bg-cyan-50 px-4 rounded-lg mt-2">
                    <span className="font-bold text-slate-800">الإجمالي</span>
                    <span className="font-bold text-cyan-600 text-lg">{rentalSummary.total_cost?.toFixed(2)} ريال</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default RentalsPage;
