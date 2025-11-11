import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from '../api/axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Receipt, Loader2, Plus, CheckCircle2, XCircle, Eye, DollarSign } from 'lucide-react';

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [closedRentals, setClosedRentals] = useState([]);
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
      const [invoicesRes, rentalsRes] = await Promise.all([
        axios.get('/invoices'),
        axios.get('/rentals')
      ]);
      setInvoices(invoicesRes.data);
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

  const resetForm = () => {
    setFormData({
      contract_id: '',
      tax_rate: '0.05',
      discount_amount: '0',
      payment_method: '',
      notes: ''
    });
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
                      onValueChange={(value) => setFormData({...formData, contract_id: value})} 
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
                        onChange={(e) => setFormData({...formData, tax_rate: e.target.value})}
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
                        onChange={(e) => setFormData({...formData, discount_amount: e.target.value})}
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
                      onValueChange={(value) => setFormData({...formData, payment_method: value})}
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
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
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

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-cyan-600" />
          </div>
        ) : (
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
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium mt-1 ${
                          invoice.paid 
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
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm text-slate-500">تاريخ الإصدار</p>
                    <p className="font-semibold text-slate-800">
                      {new Date(selectedInvoice.issue_date).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <div className={`px-4 py-2 rounded-lg font-semibold ${
                    selectedInvoice.paid 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {selectedInvoice.paid ? 'مدفوعة' : 'غير مدفوعة'}
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
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">{selectedInvoice.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default InvoicesPage;