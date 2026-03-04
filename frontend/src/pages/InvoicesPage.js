import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from '../api/axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Receipt, Loader2, Plus, CheckCircle2, XCircle, Eye, DollarSign, Printer, LayoutGrid, List as ListIcon } from 'lucide-react';

const InvoicesPage = () => {
  const [viewMode, setViewMode] = useState('kanban'); // 'list' or 'kanban'
  const [invoices, setInvoices] = useState([]);
  const [closedRentals, setClosedRentals] = useState([]);
  const [allRentals, setAllRentals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formData, setFormData] = useState({
    contract_id: '',
    tax_rate: '0.05',
    discount_amount: '0',
    payment_method: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invoicesRes, rentalsRes, customersRes, equipmentRes] = await Promise.all([
        axios.get('/invoices'),
        axios.get('/rentals'),
        axios.get('/customers'),
        axios.get('/equipment')
      ]);
      const sortedInvoices = invoicesRes.data.sort((a, b) => {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
      setInvoices(sortedInvoices);
      setAllRentals(rentalsRes.data);
      setCustomers(customersRes.data);
      setEquipment(equipmentRes.data);
      // Filter closed rentals that don't have invoices yet
      const closedWithoutInvoice = rentalsRes.data.filter(r =>
        r.status === 'closed' && !invoicesRes.data.some(inv => inv.contract_id === r.id)
      );
      setClosedRentals(closedWithoutInvoice);
    } catch (error) {
      toast.error('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        contract_id: formData.contract_id,
        tax_rate: parseFloat(formData.tax_rate),
        discount_amount: parseFloat(formData.discount_amount),
        payment_method: formData.payment_method || null,
        notes: formData.notes || null
      };

      await axios.post('/invoices', submitData);
      toast.success('تم إنشاء الفاتورة بنجاح');
      setDialogOpen(false);
      fetchData();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في إنشاء الفاتورة');
    }
  };

  const handleMarkPaid = async (invoiceId) => {
    if (!window.confirm('هل تريد تحديد هذه الفاتورة كمدفوعة؟')) return;

    try {
      await axios.post(`/invoices/${invoiceId}/mark-paid`, null, {
        params: { payment_method: 'cash' }
      });
      toast.success('تم تحديد الفاتورة كمدفوعة');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في تحديث الفاتورة');
    }
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const resetForm = () => {
    setFormData({
      contract_id: '',
      tax_rate: '0.05',
      discount_amount: '0',
      payment_method: '',
      notes: ''
    });
  };

  const getCustomerByInvoice = (invoice) => {
    const rental = allRentals.find(r => r.id === invoice.contract_id);
    if (!rental) return { full_name: 'غير محدد', phone: '' };
    const customer = customers.find(c => c.id === rental.customer_id);
    return customer || { full_name: 'غير محدد', phone: '' };
  };

  const getEquipmentByInvoice = (invoice) => {
    const rental = allRentals.find(r => r.id === invoice.contract_id);
    if (!rental) return { name: 'معدة غير معروفة', daily_rate: 0 };
    const equip = equipment.find(e => e.id === rental.equipment_id);
    return equip || { name: 'معدة غير معروفة', daily_rate: 0 };
  };

  return (
    <Layout>
      <div className="space-y-6 fade-in" data-testid="invoices-page">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">الفواتير</h2>
            <p className="text-slate-600 mt-2">إدارة فواتير العملاء والمدفوعات</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button
                data-testid="create-invoice-button"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-md"
                disabled={closedRentals.length === 0}
              >
                <Plus className="ml-2" size={20} />
                إنشاء فاتورة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white">
              <DialogHeader>
                <DialogTitle className="text-2xl text-slate-800 font-bold">
                  إنشاء فاتورة جديدة
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="contract_id" className="text-slate-700 font-medium text-sm mb-2 block">
                      العقد المغلق *
                    </Label>
                    <Select
                      value={formData.contract_id}
                      onValueChange={(value) => setFormData({ ...formData, contract_id: value })}
                      required
                    >
                      <SelectTrigger className="h-11 border-slate-200 bg-slate-50/50">
                        <SelectValue placeholder="اختر العقد" />
                      </SelectTrigger>
                      <SelectContent>
                        {closedRentals.map(rental => (
                          <SelectItem key={rental.id} value={rental.id}>
                            عقد #{rental.contract_no}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="tax_rate" className="text-slate-700 font-medium text-sm mb-2 block">
                        معدل الضريبة (%)
                      </Label>
                      <Input
                        id="tax_rate"
                        type="number"
                        step="0.01"
                        value={formData.tax_rate}
                        onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                        className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="discount_amount" className="text-slate-700 font-medium text-sm mb-2 block">
                        قيمة الخصم (ريال)
                      </Label>
                      <Input
                        id="discount_amount"
                        type="number"
                        step="0.01"
                        value={formData.discount_amount}
                        onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                        className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="payment_method" className="text-slate-700 font-medium text-sm mb-2 block">
                      طريقة الدفع
                    </Label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                    >
                      <SelectTrigger className="h-11 border-slate-200 bg-slate-50/50">
                        <SelectValue placeholder="اختر طريقة الدفع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">نقدي</SelectItem>
                        <SelectItem value="card">بطاقة</SelectItem>
                        <SelectItem value="transfer">تحويل بنكي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-slate-700 font-medium text-sm mb-2 block">
                      ملاحظات
                    </Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-md"
                >
                  إنشاء الفاتورة
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-end justify-end">
          <div className="bg-slate-100 p-1 rounded-lg inline-flex">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${viewMode === 'kanban'
                ? 'bg-white text-cyan-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <LayoutGrid size={16} />
              كانبان
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${viewMode === 'list'
                ? 'bg-white text-cyan-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <ListIcon size={16} />
              قائمة
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-cyan-600" />
          </div>
        ) : (
          viewMode === 'list' ? (
            <div className="grid grid-cols-1 gap-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} data-testid={`invoice-card-${invoice.id}`} className="modern-card p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                          <Receipt className="text-white" size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">فاتورة #{invoice.invoice_no}</h3>
                          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium mt-1 ${invoice.paid
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                            }`}>
                            {invoice.paid ? (
                              <>
                                <CheckCircle2 size={14} />
                                مدفوعة
                              </>
                            ) : (
                              <>
                                <XCircle size={14} />
                                غير مدفوعة
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500 text-xs mb-1">تاريخ الإصدار</p>
                          <p className="text-slate-800 font-medium">
                            {new Date(invoice.issue_date).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">المبلغ الفرعي</p>
                          <p className="text-slate-800 font-medium">{invoice.subtotal.toFixed(2)} ريال</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">الضريبة</p>
                          <p className="text-slate-800 font-medium">{invoice.tax_amount.toFixed(2)} ريال</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">الإجمالي</p>
                          <p className="text-cyan-600 font-bold text-lg">{invoice.total.toFixed(2)} ريال</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mr-4">
                      <Button
                        size="sm"
                        onClick={() => handleViewInvoice(invoice)}
                        className="bg-slate-100 text-slate-700 hover:bg-slate-200"
                      >
                        <Eye size={16} className="ml-1" />
                        عرض
                      </Button>

                      {!invoice.paid && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkPaid(invoice.id)}
                          className="bg-green-50 text-green-600 hover:bg-green-100 border-0"
                        >
                          <DollarSign size={16} className="ml-1" />
                          تحديد كمدفوعة
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center gap-8 pb-4 kanban-container min-h-[60vh]">
              {/* Unpaid Column */}
              <div className="flex-1 max-w-md bg-slate-100/50 rounded-xl flex flex-col border border-slate-200 shadow-sm">
                <div className="p-4 border-b border-slate-200 bg-white/50 rounded-t-xl flex justify-between items-center sticky top-0 backdrop-blur-sm z-10">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-100 text-red-600">
                      <XCircle size={18} />
                    </div>
                    <h3 className="font-bold text-slate-800">غير مدفوعة</h3>
                  </div>
                  <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-1 rounded-full">
                    {invoices.filter(i => !i.paid).length}
                  </span>
                </div>
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {invoices.filter(i => !i.paid).map(invoice => (
                    <div key={invoice.id} className="modern-card p-4 hover:-translate-y-1 transition-transform cursor-pointer border-l-4 border-l-red-500 group" onClick={() => handleViewInvoice(invoice)}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-bold text-slate-800 line-clamp-1">{getCustomerByInvoice(invoice).full_name}</p>
                          <p className="text-xs text-slate-500 font-medium">#{invoice.invoice_no}</p>
                        </div>
                        <p className="text-xs text-slate-500">{new Date(invoice.issue_date).toLocaleDateString('ar-SA')}</p>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 rounded p-2 mb-3">
                        <span className="text-xs text-slate-600">الإجمالي</span>
                        <span className="font-bold text-red-600">{invoice.total.toFixed(2)} ر.ع</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleMarkPaid(invoice.id); }}
                        className="w-full bg-green-50 text-green-600 hover:bg-green-100 border-0 text-xs h-8"
                      >
                        <DollarSign size={14} className="ml-1" />
                        تحديد كمدفوعة
                      </Button>
                    </div>
                  ))}
                  {invoices.filter(i => !i.paid).length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <p className="text-sm">لا توجد فواتير غير مدفوعة</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Paid Column */}
              <div className="flex-1 max-w-md bg-slate-100/50 rounded-xl flex flex-col border border-slate-200 shadow-sm">
                <div className="p-4 border-b border-slate-200 bg-white/50 rounded-t-xl flex justify-between items-center sticky top-0 backdrop-blur-sm z-10">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-green-100 text-green-600">
                      <CheckCircle2 size={18} />
                    </div>
                    <h3 className="font-bold text-slate-800">مدفوعة</h3>
                  </div>
                  <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-1 rounded-full">
                    {invoices.filter(i => i.paid).length}
                  </span>
                </div>
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {invoices.filter(i => i.paid).map(invoice => (
                    <div key={invoice.id} className="modern-card p-4 hover:-translate-y-1 transition-transform cursor-pointer border-l-4 border-l-green-500 group" onClick={() => handleViewInvoice(invoice)}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-bold text-slate-800 line-clamp-1">{getCustomerByInvoice(invoice).full_name}</p>
                          <p className="text-xs text-slate-500 font-medium">#{invoice.invoice_no}</p>
                        </div>
                        <p className="text-xs text-slate-500">{new Date(invoice.issue_date).toLocaleDateString('ar-SA')}</p>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 rounded p-2 mb-3">
                        <span className="text-xs text-slate-600">الإجمالي</span>
                        <span className="font-bold text-green-600">{invoice.total.toFixed(2)} ر.ع</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-green-500" /> تم الدفع
                        </span>
                        <span>{invoice.payment_method === 'cash' ? 'نقدي' : invoice.payment_method === 'card' ? 'بطاقة' : invoice.payment_method === 'transfer' ? 'تحويل' : ''}</span>
                      </div>
                    </div>
                  ))}
                  {invoices.filter(i => i.paid).length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <p className="text-sm">لا توجد فواتير مدفوعة</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {!loading && invoices.length === 0 && (
          <div className="modern-card p-12 text-center">
            <Receipt size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-500 mb-2">لا يوجد فواتير بعد</p>
            {closedRentals.length > 0 && (
              <p className="text-sm text-cyan-600">
                لديك {closedRentals.length} عقد مغلق يمكن إصدار فاتورة له
              </p>
            )}
          </div>
        )}

        {/* View Invoice Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl bg-white">
            <DialogHeader>
              <DialogTitle className="text-2xl text-slate-800 font-bold">
                تفاصيل الفاتورة #{selectedInvoice?.invoice_no}
              </DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">بيانات العميل</p>
                    <p className="font-semibold text-slate-800">{getCustomerByInvoice(selectedInvoice).full_name}</p>
                    <p className="text-sm text-slate-600">{getCustomerByInvoice(selectedInvoice).phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">تفاصيل الفاتورة</p>
                    <p className="font-medium text-slate-800 text-sm">التاريخ: {new Date(selectedInvoice.issue_date).toLocaleDateString('ar-SA')}</p>
                    <div className={`inline-flex px-2 py-0.5 mt-1 rounded text-xs font-semibold ${selectedInvoice.paid
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                      }`}>
                      {selectedInvoice.paid ? 'مدفوعة' : 'غير مدفوعة'}
                    </div>
                  </div>
                </div>

                {/* --- Line Items (Equipment) Section --- */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 mb-3">تفاصيل الإيجار</h4>
                  <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100">
                    <div>
                      <span className="block font-semibold text-slate-800">{getEquipmentByInvoice(selectedInvoice).name}</span>
                      <span className="block text-xs text-slate-500">سعر اليوم / الساعة: {getEquipmentByInvoice(selectedInvoice).daily_rate} ريال</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">المبلغ الفرعي</span>
                    <span className="font-semibold text-slate-800">{selectedInvoice.subtotal.toFixed(2)} ريال</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">الضريبة ({(selectedInvoice.tax_rate * 100).toFixed(0)}%)</span>
                    <span className="font-semibold text-slate-800">{selectedInvoice.tax_amount.toFixed(2)} ريال</span>
                  </div>
                  {selectedInvoice.discount_amount > 0 && (
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-green-600">الخصم</span>
                      <span className="font-semibold text-green-600">- {selectedInvoice.discount_amount.toFixed(2)} ريال</span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 bg-cyan-50 px-4 rounded-lg mt-2">
                    <span className="font-bold text-slate-800">الإجمالي</span>
                    <span className="font-bold text-cyan-600 text-xl">{selectedInvoice.total.toFixed(2)} ريال</span>
                  </div>
                </div>

                {selectedInvoice.payment_method && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">
                      طريقة الدفع: {
                        selectedInvoice.payment_method === 'cash' ? 'نقدي' :
                          selectedInvoice.payment_method === 'card' ? 'بطاقة' :
                            selectedInvoice.payment_method === 'transfer' ? 'تحويل بنكي' :
                              selectedInvoice.payment_method
                      }
                    </p>
                  </div>
                )}

                {selectedInvoice.notes && (
                  <div className="p-3 bg-slate-50 rounded-lg no-print">
                    <p className="text-sm text-slate-600">{selectedInvoice.notes}</p>
                  </div>
                )}

                <div className="pt-4 flex justify-end no-print">
                  <Button
                    onClick={handlePrint}
                    className="bg-slate-800 hover:bg-slate-900 text-white"
                  >
                    <Printer size={16} className="ml-2" />
                    طباعة إيصال (طابعة فواتير Thermal)
                  </Button>
                </div>

                {/* --- SEPARATE HIDDEN PRINT LAYOUT STRUCTURE (80mm) --- */}
                <div className="print-receipt-section hidden text-center" dir="rtl">
                  <h2 style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '5px' }}>نظام إدارة التأجير</h2>
                  <p style={{ fontSize: '10pt', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px dashed #000' }}>
                    فاتورة ضريبية مبسطة
                  </p>

                  <div style={{ textAlign: 'right', fontSize: '9pt', marginBottom: '10px' }}>
                    <p>رقم الفاتورة: <strong>{selectedInvoice.invoice_no}</strong></p>
                    <p>التاريخ: {new Date(selectedInvoice.issue_date).toLocaleDateString('ar-SA')}</p>
                    <p>العميل: <strong>{getCustomerByInvoice(selectedInvoice).full_name}</strong></p>
                    <p>الهاتف: {getCustomerByInvoice(selectedInvoice).phone}</p>
                  </div>

                  <table style={{ width: '100%', fontSize: '10pt', textAlign: 'right', borderCollapse: 'collapse', marginBottom: '10px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #000' }}>
                        <th style={{ padding: '4px 0' }}>البيان</th>
                        <th style={{ padding: '4px 0', textAlign: 'left' }}>ر.ع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Inject the exact Equipment item before subtotal */}
                      <tr>
                        <td style={{ padding: '4px 0', fontWeight: 'bold' }}>{getEquipmentByInvoice(selectedInvoice).name}</td>
                        <td style={{ padding: '4px 0', textAlign: 'left', fontSize: '9pt' }}>{getEquipmentByInvoice(selectedInvoice).daily_rate} / يوم</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 0' }}>المبلغ قبل الضريبة</td>
                        <td style={{ padding: '4px 0', textAlign: 'left' }}>{selectedInvoice.subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '4px 0' }}>الضريبة ({(selectedInvoice.tax_rate * 100).toFixed(0)}%)</td>
                        <td style={{ padding: '4px 0', textAlign: 'left' }}>{selectedInvoice.tax_amount.toFixed(2)}</td>
                      </tr>
                      {selectedInvoice.discount_amount > 0 && (
                        <tr>
                          <td style={{ padding: '4px 0' }}>الخصم</td>
                          <td style={{ padding: '4px 0', textAlign: 'left' }}>-{selectedInvoice.discount_amount.toFixed(2)}</td>
                        </tr>
                      )}
                      <tr style={{ borderTop: '1px solid #000', fontWeight: 'bold', fontSize: '11pt' }}>
                        <td style={{ padding: '8px 0' }}>الإجمالي</td>
                        <td style={{ padding: '8px 0', textAlign: 'left' }}>{selectedInvoice.total.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #000', textAlign: 'center', fontSize: '10pt' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      {selectedInvoice.paid ? 'تم الدفع - شكراً لتعاملكم معنا' : 'غير مدفوعة'}
                    </p>
                    {selectedInvoice.payment_method && selectedInvoice.paid && (
                      <p style={{ fontSize: '9pt' }}>طريقة الدفع: {
                        selectedInvoice.payment_method === 'cash' ? 'نقدي' :
                          selectedInvoice.payment_method === 'card' ? 'بطاقة' :
                            selectedInvoice.payment_method === 'transfer' ? 'تحويل بنكي' :
                              selectedInvoice.payment_method
                      }</p>
                    )}
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

export default InvoicesPage;