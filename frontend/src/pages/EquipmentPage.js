import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import axios from '../api/axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Package, Loader2, Plus, Edit, Trash2, CheckCircle2, XCircle, Wrench, QrCode, Printer } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

const EquipmentPage = () => {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedEquipmentForQR, setSelectedEquipmentForQR] = useState(null);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const qrRef = useRef(null);
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

  const handleShowQR = (equip) => {
    setSelectedEquipmentForQR(equip);
    setQrDialogOpen(true);
  };

  const handleRentNow = (equipment) => {
    navigate('/rentals', { state: { prefillEquipmentId: equipment.id } });
  };

  const handlePrintQR = () => {
    if (!qrRef.current) return;

    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;

    // Create print window
    const printWindow = window.open('', '_blank');
    const qrUrl = canvas.toDataURL('image/png');

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>طباعة QR Code - ${selectedEquipmentForQR.name}</title>
          <style>
            body {
              font-family: 'Tajawal', Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .container {
              text-align: center;
              border: 3px solid #0891b2;
              border-radius: 16px;
              padding: 30px;
              max-width: 400px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            h1 {
              color: #0f172a;
              font-size: 24px;
              margin: 0 0 10px 0;
            }
            h2 {
              color: #0891b2;
              font-size: 28px;
              margin: 0 0 20px 0;
              font-weight: bold;
            }
            img {
              width: 250px;
              height: 250px;
              margin: 20px 0;
            }
            .info {
              background: #f1f5f9;
              padding: 15px;
              border-radius: 8px;
              margin: 15px 0;
            }
            .info p {
              margin: 5px 0;
              font-size: 16px;
              color: #475569;
            }
            .info strong {
              color: #0f172a;
            }
            .instructions {
              background: #dbeafe;
              padding: 15px;
              border-radius: 8px;
              margin-top: 20px;
              font-size: 14px;
              color: #1e40af;
            }
            @media print {
              body {
                padding: 0;
              }
              .container {
                border: 2px solid #0891b2;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>نظام إدارة التأجير</h1>
            <h2>${selectedEquipmentForQR.name}</h2>
            <img src="${qrUrl}" alt="QR Code" />
            <div class="info">
              <p><strong>الفئة:</strong> ${selectedEquipmentForQR.category}</p>
              <p><strong>السعر اليومي:</strong> ${selectedEquipmentForQR.daily_rate} ريال</p>
              ${selectedEquipmentForQR.serial_no ? `<p><strong>الرقم التسلسلي:</strong> ${selectedEquipmentForQR.serial_no}</p>` : ''}
            </div>
            <div class="instructions">
              <strong>📱 للتأجير:</strong> امسح الكود ضوئياً
            </div>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, serial_no: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                      required
                      className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status" className="text-slate-700 font-medium text-sm mb-2 block">الحالة *</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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
                      onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                      className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="notes" className="text-slate-700 font-medium text-sm mb-2 block">ملاحظات</Label>
                    <Input
                      id="notes"
                      data-testid="input-notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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

                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 flex-wrap">
                      {item.status === 'available' && (
                        <Button
                          data-testid={`rent-direct-${item.id}`}
                          size="sm"
                          onClick={() => handleRentNow(item)}
                          className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                        >
                          تأجير
                        </Button>
                      )}
                      <Button
                        data-testid={`qr-equipment-${item.id}`}
                        size="sm"
                        onClick={() => handleShowQR(item)}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700"
                      >
                        <QrCode size={16} className="ml-1" />
                        QR
                      </Button>
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

        {/* QR Code Dialog */}
        <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-2xl text-slate-800 font-bold flex items-center gap-2">
                <QrCode className="text-cyan-600" size={28} />
                رمز QR للتأجير السريع
              </DialogTitle>
            </DialogHeader>
            {selectedEquipmentForQR && (
              <div className="space-y-4 mt-4">
                {/* Equipment Info */}
                <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{selectedEquipmentForQR.name}</h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-slate-600">
                      <span className="font-medium">الفئة:</span> {selectedEquipmentForQR.category}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium">السعر:</span> {selectedEquipmentForQR.daily_rate} ريال/يوم
                    </p>
                    {selectedEquipmentForQR.serial_no && (
                      <p className="text-slate-600">
                        <span className="font-medium">الرقم التسلسلي:</span> {selectedEquipmentForQR.serial_no}
                      </p>
                    )}
                  </div>
                </div>

                {/* QR Code */}
                <div ref={qrRef} className="flex justify-center p-6 bg-white border-2 border-slate-200 rounded-xl">
                  <QRCodeCanvas
                    value={`${window.location.origin}/qr-login/${selectedEquipmentForQR.id}`}
                    size={220}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium mb-2">📱 كيفية الاستخدام:</p>
                  <ol className="text-xs text-blue-700 space-y-1 mr-4 list-decimal">
                    <li>اطبع هذا الرمز والصقه على المعدة</li>
                    <li>عند التأجير، امسح الرمز بالكاميرا</li>
                    <li>أدخل بيانات العميل وأبرم العقد فوراً</li>
                    <li>يصل إشعار WhatsApp للعميل تلقائياً</li>
                  </ol>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handlePrintQR}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                  >
                    <Printer size={16} className="ml-1" />
                    طباعة QR Code
                  </Button>
                  <Button
                    onClick={() => setQrDialogOpen(false)}
                    variant="outline"
                    className="px-6"
                  >
                    إغلاق
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default EquipmentPage;