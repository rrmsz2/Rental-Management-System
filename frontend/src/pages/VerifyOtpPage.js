import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const VerifyOtpPage = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { verifyOtp, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone;

  useEffect(() => {
    if (!phone) {
      navigate('/login');
    }
  }, [phone, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      toast.error('يرجى إدخال الرمز المكون من 6 أرقام');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(phone, code);
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/dashboard');
    } catch (error) {
      const errorMsg = error.response?.data?.detail?.message || 'رمز خاطئ';
      toast.error(errorMsg);
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    try {
      await login(phone);
      toast.success('تم إرسال رمز جديد');
      setResendCooldown(30);
      setCode('');
    } catch (error) {
      const errorMsg = error.response?.data?.detail?.message || 'فشل في إعادة الإرسال';
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/40 relative overflow-hidden" data-testid="verify-page" dir="rtl">
      {/* Decorative Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-200/40 to-blue-200/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-100/20 to-blue-100/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md fade-in">
        <Card className="modern-card shadow-xl border-0" data-testid="verify-card">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-slate-800">
              التحقق من الرمز
            </CardTitle>
            <CardDescription className="text-center text-slate-600">
              أدخل الرمز المرسل إلى
              <br />
              <span className="font-semibold text-cyan-600" dir="ltr">{phone}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="flex justify-center" data-testid="otp-input-container">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={(value) => setCode(value)}
                  data-testid="otp-input"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} data-testid="otp-slot-0" className="h-14 w-12 text-lg border-slate-200 bg-slate-50/50" />
                    <InputOTPSlot index={1} data-testid="otp-slot-1" className="h-14 w-12 text-lg border-slate-200 bg-slate-50/50" />
                    <InputOTPSlot index={2} data-testid="otp-slot-2" className="h-14 w-12 text-lg border-slate-200 bg-slate-50/50" />
                    <InputOTPSlot index={3} data-testid="otp-slot-3" className="h-14 w-12 text-lg border-slate-200 bg-slate-50/50" />
                    <InputOTPSlot index={4} data-testid="otp-slot-4" className="h-14 w-12 text-lg border-slate-200 bg-slate-50/50" />
                    <InputOTPSlot index={5} data-testid="otp-slot-5" className="h-14 w-12 text-lg border-slate-200 bg-slate-50/50" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                type="submit"
                data-testid="verify-button"
                className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold btn-primary"
                disabled={loading || code.length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    جاري التحقق...
                  </>
                ) : (
                  'تحقق'
                )}
              </Button>

              <div className="text-center">
                {resendCooldown > 0 ? (
                  <p className="text-sm text-slate-500">
                    يمكنك إعادة الإرسال بعد {resendCooldown} ثانية
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResend}
                    data-testid="resend-button"
                    className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                  >
                    إعادة إرسال الرمز
                  </Button>
                )}
              </div>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={() => navigate('/login')}
                data-testid="back-to-login-button"
                className="text-slate-600 hover:text-cyan-600"
              >
                <ArrowRight className="ml-2 h-4 w-4" />
                العودة لتسجيل الدخول
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyOtpPage;