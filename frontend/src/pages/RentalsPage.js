import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from '../api/axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { FileText, Loader2, Plus, Eye, CheckCircle, XCircle, PlayCircle, AlertCircle, Search } from 'lucide-react';

const RentalsPage = () => {
  const [rentals, setRentals] = useState([]);
  const [filteredRentals, setFilteredRentals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [rentalSummary, setRentalSummary] = useState(null);
  const [createdInvoice, setCreatedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // Default: active only
  const [closeFormData, setCloseFormData] = useState({
    tax_rate: '0.05',
    discount_amount: '0',
    paid: false,
    payment_method: ''
  });
  const [formData, setFormData] = useState({
    customer_id: '',
    equipment_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    deposit: '0',
    notes: ''
  });

  // Helper function to extract error message
  const getErrorMessage = (error, defaultMessage) => {
    const errorDetail = error.response?.data?.detail;
    
    if (typeof errorDetail === 'string') {
      return errorDetail;
    } else if (Array.isArray(errorDetail)) {
      return errorDetail.map(err => err.msg || err).join(', ');
    } else if (typeof errorDetail === 'object' && errorDetail?.message) {
      return errorDetail.message;
    }
    
    return defaultMessage;
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and search rentals
  useEffect(() => {
    if (!rentals.length) {
      setFilteredRentals([]);
      return;
    }

    let filtered = [...rentals];

    // Sort by created_at (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA; // Descending order
    });

    // Filter by status
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(rental => rental.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(rental => {
        const customer = customers.find(c => c.id === rental.customer_id);
        const equip = equipment.find(e => e.id === rental.equipment_id);
        
        return (
          rental.contract_no?.toLowerCase().includes(term) ||
          customer?.full_name?.toLowerCase().includes(term) ||
          customer?.phone?.toLowerCase().includes(term) ||
          equip?.name?.toLowerCase().includes(term) ||
          equip?.category?.toLowerCase().includes(term)
        );
      });
    }

    setFilteredRentals(filtered);
  }, [rentals, searchTerm, statusFilter, customers, equipment]);

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
      const errorDetail = error.response?.data?.detail;
      let errorMessage = 'فشل في إنشاء العقد';
      
      if (typeof errorDetail === 'string') {
        errorMessage = errorDetail;
      } else if (Array.isArray(errorDetail)) {
        errorMessage = errorDetail.map(err => err.msg || err).join(', ');
      } else if (typeof errorDetail === 'object' && errorDetail?.message) {
        errorMessage = errorDetail.message;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleActivate = async (id) => {
    if (!window.confirm('هل تريد تفعيل هذا العقد؟')) return;
    
    try {
      await axios.post(`/rentals/${id}/activate`);
      toast.success('تم تفعيل العقد بنجاح');
      fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error, 'فشل في تفعيل العقد'));
    }
  };

  const handleOpenCloseDialog = async (rental) => {
    setSelectedRental(rental);
    // Set default return date to today
    const today = new Date().toISOString().split('T')[0];
    setCloseFormData({
      return_date: today,
      tax_rate: '0.05',
      discount_amount: '0',
      paid: false,
      payment_method: ''
    });
    setCloseDialogOpen(true);
  };

  const handleClose = async () => {
    try {
      // Validate return_date
      if (!closeFormData.return_date) {
        toast.error('يجب تحديد تاريخ الإرجاع');
        return;
      }

      // Validate payment method if paid
      if (closeFormData.paid && !closeFormData.payment_method) {
        toast.error('يجب تحديد طريقة الدفع');
        return;
      }
      
      // Convert return_date to ISO format with time
      const returnDateTime = new Date(closeFormData.return_date).toISOString();
      
      console.log('Closing rental with data:', {
        return_date: returnDateTime,
        tax_rate: closeFormData.tax_rate,
        discount_amount: closeFormData.discount_amount,
        paid: closeFormData.paid,
        payment_method: closeFormData.payment_method
      });
      
      const response = await axios.post(`/rentals/${selectedRental.id}/close`, null, {
        params: {
          return_date: returnDateTime,
          tax_rate: parseFloat(closeFormData.tax_rate),
          discount_amount: parseFloat(closeFormData.discount_amount),
          paid: closeFormData.paid,
          payment_method: closeFormData.paid ? closeFormData.payment_method : null
        }
      });
      
      toast.success('تم إغلاق العقد وإنشاء الفاتورة بنجاح');
      setCloseDialogOpen(false);
      
      // Show detailed invoice with rental info
      setCreatedInvoice({
        ...response.data.invoice,
        rental: response.data.rental
      });
      setInvoiceDialogOpen(true);
      
      fetchData();
    } catch (error) {
      console.error('Close rental error:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.detail || error.message || 'فشل في إغلاق العقد';
      toast.error(errorMsg);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('هل تريد إلغاء هذا العقد؟')) return;
    
    try {
      await axios.post(`/rentals/${id}/cancel`);
      toast.success('تم إلغاء العقد بنجاح');
      fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error, 'فشل في إلغاء العقد'));
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                    <Label htmlFor="end_date" className="text-slate-700 font-medium text-sm mb-2 block">
                      تاريخ النهاية (اختياري)
                    </Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                      placeholder="اترك فارغاً لعقد مفتوح"
                    />
                    <p className="text-xs text-slate-500 mt-1">اترك فارغاً للعقود المفتوحة (بدون تاريخ نهاية)</p>
                  </div>

                  <div>
                    <Label htmlFor="deposit" className="text-slate-700 font-medium text-sm mb-2 block">
                      الوديعة (ريال) - اختياري
                    </Label>
                    <Input
                      id="deposit"
                      type="number"
                      step="0.01"
                      value={formData.deposit}
                      onChange={(e) => setFormData({...formData, deposit: e.target.value})}
                      className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-slate-500 mt-1">الوديعة ستُخصم من الفاتورة النهائية</p>
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

        {/* Search and Filter Bar */}
        <div className="modern-card p-4 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <Label htmlFor="search" className="text-slate-700 font-medium text-sm mb-2 block">
                البحث
              </Label>
              <Input
                id="search"
                type="text"
                placeholder="ابحث برقم العقد، اسم العميل، رقم الهاتف، أو المعدة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
              />
            </div>

            {/* Status Filter */}
            <div>
              <Label htmlFor="status-filter" className="text-slate-700 font-medium text-sm mb-2 block">
                الحالة
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 border-slate-200 bg-slate-50/50">
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط فقط</SelectItem>
                  <SelectItem value="closed">مغلق فقط</SelectItem>
                  <SelectItem value="cancelled">ملغي فقط</SelectItem>
                  <SelectItem value="draft">مسودة فقط</SelectItem>
                  <SelectItem value="all">الكل</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3 pt-3 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              عرض <span className="font-semibold text-cyan-600">{filteredRentals.length}</span> من أصل <span className="font-semibold">{rentals.length}</span> عقد
              {statusFilter !== 'all' && (
                <span className="mr-2 text-slate-500">
                  ({statusFilter === 'active' ? 'النشطة' : statusFilter === 'closed' ? 'المغلقة' : statusFilter === 'cancelled' ? 'الملغية' : 'المسودات'})
                </span>
              )}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-cyan-600" />
          </div>
        ) : filteredRentals.length === 0 ? (
          <div className="modern-card p-12 text-center">
            <FileText size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-500 text-lg mb-2">لا توجد عقود مطابقة</p>
            <p className="text-slate-400 text-sm">جرّب تغيير معايير البحث أو الفلترة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredRentals.map((rental) => {
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
                          onClick={() => handleOpenCloseDialog(rental)}
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

        {/* Close Rental Dialog */}
        <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-2xl text-slate-800 font-bold">
                إغلاق العقد وإنشاء الفاتورة
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <CheckCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm text-blue-800 font-semibold mb-1">
                      سيتم إنشاء الفاتورة تلقائياً
                    </p>
                    <p className="text-xs text-blue-700">
                      عند الضغط على "إغلاق وإنشاء الفاتورة"، سيتم:
                    </p>
                    <ul className="text-xs text-blue-700 mt-1 mr-4 list-disc space-y-0.5">
                      <li>حساب عدد أيام الإيجار من تاريخ الإرجاع</li>
                      <li>حساب غرامات التأخير (إن وجدت)</li>
                      <li>إنشاء الفاتورة تلقائياً وعرضها</li>
                      <li>إرسال إشعار للعميل عبر WhatsApp</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="return_date" className="text-slate-700 font-medium text-sm mb-2 block">
                  تاريخ الإرجاع الفعلي <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="return_date"
                  type="date"
                  value={closeFormData.return_date}
                  onChange={(e) => setCloseFormData({...closeFormData, return_date: e.target.value})}
                  className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">سيتم حساب عدد أيام الإيجار بناءً على هذا التاريخ</p>
              </div>

              <div>
                <Label htmlFor="tax_rate" className="text-slate-700 font-medium text-sm mb-2 block">
                  نسبة الضريبة (%)
                </Label>
                <Input
                  id="tax_rate"
                  type="number"
                  step="0.01"
                  value={closeFormData.tax_rate}
                  onChange={(e) => setCloseFormData({...closeFormData, tax_rate: e.target.value})}
                  className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                  placeholder="0.05 = 5%"
                />
                <p className="text-xs text-slate-500 mt-1">مثال: 0.05 تعني 5%</p>
              </div>

              <div>
                <Label htmlFor="discount_amount" className="text-slate-700 font-medium text-sm mb-2 block">
                  مبلغ الخصم (ريال)
                </Label>
                <Input
                  id="discount_amount"
                  type="number"
                  step="0.01"
                  value={closeFormData.discount_amount}
                  onChange={(e) => setCloseFormData({...closeFormData, discount_amount: e.target.value})}
                  className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                  placeholder="0.00"
                />
              </div>

              <div className="border-t border-slate-200 pt-4 mt-4">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    id="paid_checkbox"
                    type="checkbox"
                    checked={closeFormData.paid}
                    onChange={(e) => setCloseFormData({...closeFormData, paid: e.target.checked})}
                    className="w-5 h-5 text-green-600 border-slate-300 rounded focus:ring-green-500"
                  />
                  <Label htmlFor="paid_checkbox" className="text-slate-700 font-medium cursor-pointer">
                    تم الدفع الآن
                  </Label>
                </div>

                {closeFormData.paid && (
                  <div>
                    <Label htmlFor="payment_method" className="text-slate-700 font-medium text-sm mb-2 block">
                      طريقة الدفع
                    </Label>
                    <select
                      id="payment_method"
                      value={closeFormData.payment_method}
                      onChange={(e) => setCloseFormData({...closeFormData, payment_method: e.target.value})}
                      className="w-full h-11 px-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">اختر طريقة الدفع</option>
                      <option value="نقدي">نقدي</option>
                      <option value="بطاقة">بطاقة</option>
                      <option value="تحويل بنكي">تحويل بنكي</option>
                      <option value="شيك">شيك</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setCloseDialogOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleClose}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  <CheckCircle size={16} className="ml-1" />
                  إغلاق وإنشاء الفاتورة
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Invoice Created Dialog - Mini Invoice */}
        <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
          <DialogContent className="max-w-2xl bg-white">
            <DialogHeader>
              <DialogTitle className="text-2xl text-slate-800 font-bold flex items-center gap-2">
                <CheckCircle className="text-green-600" size={28} />
                فاتورة إرجاع المعدة
              </DialogTitle>
            </DialogHeader>
            {createdInvoice && createdInvoice.rental && (
              <div className="space-y-4 mt-4">
                {/* Success Messages */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="text-green-600" size={20} />
                    <p className="text-sm text-green-800 font-semibold">
                      تم إغلاق العقد وإنشاء الفاتورة بنجاح
                    </p>
                  </div>
                  <p className="text-sm text-green-700">
                    رقم الفاتورة: <span className="font-bold">{createdInvoice.invoice_no}</span> | 
                    رقم العقد: <span className="font-bold">{createdInvoice.rental.contract_no}</span>
                  </p>
                </div>

                {/* Rental Summary - Mini Invoice */}
                <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 text-white">
                    <h3 className="text-lg font-bold">ملخص الإيجار والفاتورة</h3>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    {/* Equipment & Customer Info */}
                    <div className="grid md:grid-cols-2 gap-4 pb-4 border-b-2 border-slate-200">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">المعدة</p>
                        <p className="text-lg font-bold text-slate-800">{createdInvoice.rental.equipment_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">العميل</p>
                        <p className="text-lg font-bold text-slate-800">{createdInvoice.rental.customer_name}</p>
                      </div>
                    </div>

                    {/* Rental Details */}
                    <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-700">قيمة الإيجار اليومي:</span>
                        <span className="font-semibold text-slate-800">{createdInvoice.rental.daily_rate.toFixed(2)} ر.ع</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-700">عدد الأيام:</span>
                        <span className="font-semibold text-slate-800">{createdInvoice.rental.rental_days} يوم</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-blue-200">
                        <span className="text-sm font-semibold text-slate-700">تكلفة الإيجار:</span>
                        <span className="font-bold text-blue-700">{createdInvoice.rental.base_cost.toFixed(2)} ر.ع</span>
                      </div>
                      
                      {createdInvoice.rental.late_days > 0 && (
                        <>
                          <div className="flex justify-between text-red-600">
                            <span className="text-sm">أيام التأخير:</span>
                            <span className="font-semibold">{createdInvoice.rental.late_days} يوم</span>
                          </div>
                          <div className="flex justify-between text-red-600">
                            <span className="text-sm">غرامة التأخير:</span>
                            <span className="font-semibold">{createdInvoice.rental.late_fee.toFixed(2)} ر.ع</span>
                          </div>
                        </>
                      )}

                      {createdInvoice.rental.deposit > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span className="text-sm">التأمين المسترد:</span>
                          <span className="font-semibold">- {createdInvoice.rental.deposit.toFixed(2)} ر.ع</span>
                        </div>
                      )}
                    </div>

                    {/* Financial Summary */}
                    <div className="space-y-2 p-4 bg-slate-50 rounded-xl">
                      <div className="flex justify-between py-2">
                        <span className="text-slate-600">المبلغ الأساسي:</span>
                        <span className="font-semibold text-slate-800">{createdInvoice.subtotal.toFixed(2)} ر.ع</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-slate-600">الضريبة ({(createdInvoice.tax_rate * 100).toFixed(0)}%):</span>
                        <span className="font-semibold text-slate-800">{createdInvoice.tax_amount.toFixed(2)} ر.ع</span>
                      </div>
                      {createdInvoice.discount_amount > 0 && (
                        <div className="flex justify-between py-2 text-green-600">
                          <span>الخصم:</span>
                          <span className="font-semibold">- {createdInvoice.discount_amount.toFixed(2)} ر.ع</span>
                        </div>
                      )}
                      <div className="flex justify-between py-3 bg-gradient-to-r from-cyan-600 to-blue-600 px-4 rounded-lg mt-2">
                        <span className="font-bold text-white text-lg">المبلغ الإجمالي:</span>
                        <span className="font-bold text-white text-2xl">{createdInvoice.total.toFixed(2)} ر.ع</span>
                      </div>
                    </div>

                    {/* Payment Status */}
                    {createdInvoice.paid ? (
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="text-green-600" size={24} />
                          <p className="font-bold text-green-800">تم الدفع ✓</p>
                        </div>
                        {createdInvoice.payment_method && (
                          <p className="text-sm text-green-700">
                            طريقة الدفع: <span className="font-semibold">{createdInvoice.payment_method}</span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="text-orange-600" size={24} />
                          <p className="font-bold text-orange-800">في انتظار الدفع</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-700">
                    💡 يمكنك الآن الانتقال إلى صفحة الفواتير لطباعة أو تحديث حالة الدفع
                  </p>
                </div>

                <Button
                  onClick={() => {
                    setInvoiceDialogOpen(false);
                    setCreatedInvoice(null);
                  }}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  حسناً
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default RentalsPage;
