import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center p-4" data-testid="verify-page">
      <div className="w-full max-w-md fade-in">
        <Card className="glass border-2 border-teal-100 shadow-xl" data-testid="verify-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-teal-700">
              التحقق من الرمز
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              أدخل الرمز المرسل إلى
              <br />
              <span className="font-semibold text-teal-600" dir="ltr">{phone}</span>
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
                    <InputOTPSlot index={0} className="h-14 w-12 text-lg border-teal-300" />
                    <InputOTPSlot index={1} className="h-14 w-12 text-lg border-teal-300" />
                    <InputOTPSlot index={2} className="h-14 w-12 text-lg border-teal-300" />
                    <InputOTPSlot index={3} className="h-14 w-12 text-lg border-teal-300" />
                    <InputOTPSlot index={4} className="h-14 w-12 text-lg border-teal-300" />
                    <InputOTPSlot index={5} className="h-14 w-12 text-lg border-teal-300" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                type="submit"
                data-testid="verify-button"
                className="w-full h-12 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold btn-primary"
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
                  <p className="text-sm text-gray-500">
                    يمكنك إعادة الإرسال بعد {resendCooldown} ثانية
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResend}
                    data-testid="resend-button"
                    className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
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
                className="text-gray-600 hover:text-teal-600"
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