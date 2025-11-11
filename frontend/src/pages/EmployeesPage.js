import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from '../api/axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { Plus, Loader2, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '+968',
    email: '',
    national_id: '',
    position: '',
    salary: '',
    hire_date: new Date().toISOString().split('T')[0],
    is_active: true,
    notes: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      toast.error('فشل في تحميل الموظفين');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (submitData.salary) {
        submitData.salary = parseFloat(submitData.salary);
      }
      
      if (editingEmployee) {
        await axios.put(`/employees/${editingEmployee.id}`, submitData);
        toast.success('تم تحديث الموظف بنجاح');
      } else {
        await axios.post('/employees', submitData);
        toast.success('تم إضافة الموظف بنجاح');
      }
      setDialogOpen(false);
      fetchEmployees();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في حفظ الموظف');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;
    
    try {
      await axios.delete(`/employees/${id}`);
      toast.success('تم حذف الموظف بنجاح');
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في حذف الموظف');
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      ...employee,
      salary: employee.salary?.toString() || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingEmployee(null);
    setFormData({
      full_name: '',
      phone: '+968',
      email: '',
      national_id: '',
      position: '',
      salary: '',
      hire_date: new Date().toISOString().split('T')[0],
      is_active: true,
      notes: ''
    });
  };

  return (
    <Layout>
      <div className="space-y-6 fade-in" data-testid="employees-page">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">الموظفين</h2>
            <p className="text-slate-600 mt-2">إدارة بيانات الموظفين</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button data-testid="add-employee-button" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-md">
                <Plus className="ml-2" size={20} />
                إضافة موظف جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl text-teal-700">
                  {editingEmployee ? 'تحرير الموظف' : 'إضافة موظف جديد'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="employee-form">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="full_name">الاسم الكامل *</Label>
                    <Input
                      id="full_name"
                      data-testid="input-full-name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">رقم الهاتف *</Label>
                    <Input
                      id="phone"
                      data-testid="input-phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                      dir="ltr"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      data-testid="input-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="national_id">الرقم الوطني</Label>
                    <Input
                      id="national_id"
                      data-testid="input-national-id"
                      value={formData.national_id}
                      onChange={(e) => setFormData({...formData, national_id: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">المنصب *</Label>
                    <Input
                      id="position"
                      data-testid="input-position"
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="salary">الراتب (ريال)</Label>
                    <Input
                      id="salary"
                      data-testid="input-salary"
                      type="number"
                      step="0.01"
                      value={formData.salary}
                      onChange={(e) => setFormData({...formData, salary: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hire_date">تاريخ التوظيف *</Label>
                    <Input
                      id="hire_date"
                      data-testid="input-hire-date"
                      type="date"
                      value={formData.hire_date}
                      onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="notes">ملاحظات</Label>
                    <Input
                      id="notes"
                      data-testid="input-notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-between">
                    <Label htmlFor="is_active">نشط</Label>
                    <Switch
                      id="is_active"
                      data-testid="switch-active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                    />
                  </div>
                </div>
                <Button type="submit" data-testid="submit-employee" className="w-full bg-teal-600 hover:bg-teal-700">
                  {editingEmployee ? 'تحديث' : 'إضافة'}
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
            {employees.map((employee) => (
              <div key={employee.id} data-testid={`employee-card-${employee.id}`} className="modern-card p-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800">{employee.full_name}</h3>
                      <p className="text-sm font-medium text-cyan-600 mt-1">{employee.position}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      employee.is_active 
                        ? 'bg-green-100' 
                        : 'bg-slate-100'
                    }`}>
                      {employee.is_active ? (
                        <UserCheck className="text-green-600" size={20} />
                      ) : (
                        <UserX className="text-slate-400" size={20} />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-600" dir="ltr">{employee.phone}</p>
                    {employee.email && <p className="text-slate-500">{employee.email}</p>}
                    {employee.salary && (
                      <div className="bg-cyan-50 px-3 py-2 rounded-lg">
                        <p className="text-sm text-cyan-700 font-semibold">
                          الراتب: {employee.salary} ريال
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-slate-400">
                      تاريخ التوظيف: {new Date(employee.hire_date).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                    <Button
                      data-testid={`edit-employee-${employee.id}`}
                      size="sm"
                      onClick={() => handleEdit(employee)}
                      className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      <Edit size={16} className="ml-1" />
                      تحرير
                    </Button>
                    <Button
                      data-testid={`delete-employee-${employee.id}`}
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(employee.id)}
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

        {!loading && employees.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-gray-500">لا يوجد موظفين بعد. ابدأ بإضافة موظف جديد!</p>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default EmployeesPage;
