import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { QrCode, Loader2, Phone, Lock, Package } from 'lucide-react';

const QRScanLoginPage = () => {
  const { equipmentId } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check if already logged in via session
    const qrSession = localStorage.getItem('qr_session');
    if (qrSession) {
      const session = JSON.parse(qrSession);
      if (session.phone && session.token) {
        // Already logged in, redirect to main QR page
        navigate(`/qr-scan/${equipmentId}`, { state: { session } });
        return;
      }
    }

    fetchEquipment();
  }, [equipmentId]);

  const fetchEquipment = async () => {
    try {
      const response = await axios.get(`/quick-rental/equipment/${equipmentId}`);
      setEquipment(response.data);
    } catch (error) {
      toast.error('فشل في تحميل بيانات المعدة');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    
    // Validate phone (8 digits)
    if (!/^\d{8}$/.test(phone)) {
      toast.error('رقم الهاتف يجب أن يكون 8 أرقام');
      return;
    }

    setSubmitting(true);
    try {
      const fullPhone = `+968${phone}`;
      await axios.post('/auth/login', { phone: fullPhone });
      toast.success('تم إرسال رمز التحقق');
      setStep('otp');
    } catch (error) {
      toast.error('فشل في إرسال رمز التحقق');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('رمز التحقق يجب أن يكون 6 أرقام');
      return;
    }

    setSubmitting(true);
    try {
      const fullPhone = `+968${phone}`;
      const response = await axios.post('/auth/verify', {
        phone: fullPhone,
        code: otp
      });

      // Save session
      const session = {
        phone: fullPhone,
        token: response.data.access_token,
        user: response.data.user,
        timestamp: Date.now()
      };
      localStorage.setItem('qr_session', JSON.stringify(session));

      toast.success('تم تسجيل الدخول بنجاح');
      
      // Redirect to main QR page
      navigate(`/qr-scan/${equipmentId}`, { state: { session } });
      
    } catch (error) {
      toast.error('رمز التحقق غير صحيح');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 py-8 px-4" dir="rtl">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg mb-4">
            <QrCode className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">مسح QR Code</h1>
          <p className="text-slate-600">سجل دخولك للمتابعة</p>
        </div>

        {/* Equipment Info */}
        {equipment && (
          <Card className="mb-6 border-2 border-cyan-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <Package className="text-cyan-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{equipment.equipment.name}</h3>
                  <p className="text-sm text-slate-600">{equipment.equipment.category}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Login Card */}
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
              <Lock size={20} className="text-cyan-600" />
              تسجيل الدخول
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 'phone' ? (
              <form onSubmit={handleRequestOTP} className="space-y-5">
                <div>
                  <Label htmlFor="phone" className="text-slate-700 font-medium flex items-center gap-2 mb-2">
                    <Phone size={16} className="text-cyan-600" />
                    رقم الهاتف (8 أرقام)
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg px-3 text-slate-600 font-semibold">
                      +968
                    </div>
                    <Input
                      id="phone"
                      required
                      type="tel"
                      maxLength="8"
                      pattern="\d{8}"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 h-12 border-slate-200 bg-slate-50/50 focus:bg-white text-lg"
                      placeholder="12345678"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">سيتم إرسال رمز التحقق عبر WhatsApp</p>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    'إرسال رمز التحقق'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div className="text-center mb-4">
                  <p className="text-sm text-slate-600">
                    تم إرسال رمز التحقق إلى
                  </p>
                  <p className="text-lg font-bold text-slate-800">+968{phone}</p>
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="text-sm text-cyan-600 hover:underline mt-1"
                  >
                    تغيير الرقم
                  </button>
                </div>

                <div>
                  <Label htmlFor="otp" className="text-slate-700 font-medium mb-2 block text-center">
                    رمز التحقق (6 أرقام)
                  </Label>
                  <Input
                    id="otp"
                    required
                    type="text"
                    maxLength="6"
                    pattern="\d{6}"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="h-14 border-slate-200 bg-slate-50/50 focus:bg-white text-2xl text-center tracking-widest"
                    placeholder="000000"
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                      جاري التحقق...
                    </>
                  ) : (
                    'تحقق'
                  )}
                </Button>

                <button
                  type="button"
                  onClick={handleRequestOTP}
                  disabled={submitting}
                  className="w-full text-sm text-cyan-600 hover:underline"
                >
                  إعادة إرسال الرمز
                </button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Security Note */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800 text-center">
            🔒 رقم الهاتف يجب أن يكون مسجلاً في النظام
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRScanLoginPage;
