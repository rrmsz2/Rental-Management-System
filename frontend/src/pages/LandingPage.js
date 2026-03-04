import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Phone, Package, Users, CheckCircle, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001/api';

const LandingPage = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/settings/public`);
      setSettings(res.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/40 relative overflow-hidden" dir="rtl">
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-200/40 to-blue-200/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
      </div>

      <Header />

      {/* Hero Section */}
      <main className="flex-1 relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
          {/* Main Hero */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              {settings?.landing_title || 'نظام إدارة الإيجارات'}
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {settings?.landing_subtitle || 'حل متكامل لإدارة تأجير المعدات بكفاءة واحترافية'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg"
              >
                <Phone className="ml-2" size={24} />
                تسجيل الدخول
              </Button>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <Package className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {settings?.feature1_title || 'إدارة المعدات'}
              </h3>
              <p className="text-gray-600">
                {settings?.feature1_description || 'نظام شامل لإدارة جميع معداتك وتتبع حالتها وصيانتها'}
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4">
                <Users className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {settings?.feature2_title || 'إدارة العملاء'}
              </h3>
              <p className="text-gray-600">
                {settings?.feature2_description || 'تنظيم بيانات العملاء ومتابعة عقودهم بسهولة'}
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                <CheckCircle className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {settings?.feature3_title || 'تقارير متقدمة'}
              </h3>
              <p className="text-gray-600">
                {settings?.feature3_description || 'احصل على رؤى شاملة عن أداء أعمالك من خلال تقارير تفصيلية'}
              </p>
            </div>
          </div>

          {/* About Section */}
          {settings?.about_business && (
            <div className="bg-white/80 backdrop-blur-sm p-8 sm:p-12 rounded-2xl shadow-lg border border-gray-100 mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                عن خدماتنا
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed max-w-4xl mx-auto text-center whitespace-pre-line">
                {settings.about_business}
              </p>
            </div>
          )}

          {/* Benefits */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { text: settings?.benefit1 || 'سهولة في الاستخدام' },
              { text: settings?.benefit2 || 'أمان وحماية البيانات' },
              { text: settings?.benefit3 || 'إشعارات تلقائية' },
              { text: settings?.benefit4 || 'دعم فني متواصل' }
            ].map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-gray-100">
                <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
                <span className="text-gray-700 font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-12 rounded-2xl shadow-2xl">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                ابدأ الآن مع نظامنا
              </h2>
              <p className="text-xl text-white/90 mb-8">
                انضم إلى مئات الشركات التي تثق بنا
              </p>
              <Button
                onClick={() => navigate('/login')}
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg rounded-xl shadow-lg"
              >
                تسجيل الدخول الآن
                <ArrowLeft className="mr-2" size={24} />
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
