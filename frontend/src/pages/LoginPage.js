import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Phone, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate phone format
    if (!phone.startsWith('+968') || phone.length !== 12) {
      toast.error('رقم الهاتف غير صحيح', {
        description: 'يجب أن يبدأ بـ +968 ويتبعه 8 أرقام'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await login(phone);
      toast.success(response.message || 'تم إرسال رمز التحقق');
      navigate('/verify', { state: { phone } });
    } catch (error) {
      const errorMsg = error.response?.data?.detail?.message || 'فشل في إرسال الرمز';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/30" data-testid="login-page">
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg mb-4">
            <Phone className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2" data-testid="app-title">
            نظام إدارة التأجير
          </h1>
          <p className="text-slate-600">Rental Management System</p>
        </div>

        <Card className="modern-card shadow-xl border-0" data-testid="login-card">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-slate-800">
              تسجيل الدخول
            </CardTitle>
            <CardDescription className="text-center text-slate-600">
              أدخل رقم هاتفك للحصول على رمز التحقق
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700 font-medium text-sm">
                  رقم الهاتف
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500" size={20} />
                  <Input
                    id="phone"
                    data-testid="phone-input"
                    type="tel"
                    placeholder="+968XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 h-12 border-slate-200 bg-slate-50/50 focus:bg-white"
                    dir="ltr"
                    required
                  />
                </div>
                <p className="text-xs text-slate-500 text-right">
                  مثال: +96894780842
                </p>
              </div>

              <Button
                type="submit"
                data-testid="submit-button"
                className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  'إرسال رمز التحقق'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-slate-600 bg-white px-4 py-2 rounded-full shadow-sm">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.707 6.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
            </svg>
            <span>سيتم إرسال رمز التحقق عبر واتساب</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;