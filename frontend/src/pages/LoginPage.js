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
    <div className="min-h-screen flex items-center justify-center p-4" data-testid="login-page">
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-teal-700 mb-2" data-testid="app-title">
            نظام إدارة التأجير
          </h1>
          <p className="text-gray-600">Rental Management System</p>
        </div>

        <Card className="glass border-2 border-teal-100 shadow-xl" data-testid="login-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-teal-700">
              تسجيل الدخول
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              أدخل رقم هاتفك للحصول على رمز التحقق
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700 font-medium">
                  رقم الهاتف
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500" size={20} />
                  <Input
                    id="phone"
                    data-testid="phone-input"
                    type="tel"
                    placeholder="+968XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 h-12 border-teal-200 focus:border-teal-500 focus:ring-teal-500"
                    dir="ltr"
                    required
                  />
                </div>
                <p className="text-sm text-gray-500 text-right">
                  مثال: +96894780842
                </p>
              </div>

              <Button
                type="submit"
                data-testid="submit-button"
                className="w-full h-12 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold btn-primary"
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

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>سيتم إرسال رمز التحقق عبر واتساب</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;