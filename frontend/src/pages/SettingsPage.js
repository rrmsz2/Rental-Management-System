import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from '../api/axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loader2, Upload, Save } from 'lucide-react';
import { toast } from 'sonner';

const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/settings');
      setSettings(response.data);
    } catch (error) {
      toast.error('فشل في تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put('/settings', settings);
      toast.success('تم حفظ الإعدادات بنجاح');
      fetchSettings();
    } catch (error) {
      toast.error('فشل في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الملف كبير جداً. الحد الأقصى 2 ميجابايت');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/settings/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('تم رفع الشعار بنجاح');
      fetchSettings();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في رفع الشعار');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12" data-testid="settings-loading">
          <Loader2 className="h-12 w-12 animate-spin text-teal-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 fade-in" data-testid="settings-page">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">الإعدادات</h2>
          <p className="text-slate-600 mt-2">إعدادات النظام والهيدر والفوتر</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Header Settings */}
          <Card className="modern-card border-0">
            <CardHeader>
              <CardTitle className="text-slate-800">إعدادات الهيدر</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="header_logo">صورة البانر (Banner)</Label>
                <div className="mt-2 space-y-3">
                  {/* Banner Preview */}
                  {settings.header_logo && (
                    <div className="overflow-hidden rounded-lg border-2 border-slate-200">
                      <div className="relative h-32 sm:h-40">
                        <img 
                          src={settings.header_logo} 
                          alt="Banner Preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            toast.error('فشل في تحميل الصورة. تحقق من الرابط');
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60 flex items-center justify-center">
                          <div className="text-center text-white">
                            <p className="text-lg font-bold">معاينة البانر</p>
                            <p className="text-sm opacity-90">سيظهر بعرض الصفحة الكامل</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Banner URL Input */}
                  <div>
                    <Label htmlFor="header_logo_url" className="text-sm text-slate-600">رابط صورة البانر (URL)</Label>
                    <Input
                      id="header_logo_url"
                      type="url"
                      placeholder="https://example.com/banner.jpg"
                      value={settings.header_logo || ''}
                      onChange={(e) => setSettings({...settings, header_logo: e.target.value})}
                      className="mt-1 h-11 border-slate-200"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      يُفضل صورة بأبعاد 1920×400 بكسل أو أكبر (نسبة 16:3 تقريباً)
                    </p>
                  </div>

                  {/* Upload Alternative */}
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-xs text-slate-600 mb-2">أو ارفع صورة من جهازك:</p>
                    <input
                      type="file"
                      id="logo-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('logo-upload').click()}
                      disabled={uploading}
                      data-testid="upload-logo-button"
                      className="w-full sm:w-auto"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          جاري الرفع...
                        </>
                      ) : (
                        <>
                          <Upload className="ml-2" size={16} />
                          رفع صورة من الجهاز
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-slate-400 mt-1">
                      JPG, PNG, WebP (الحد الأقصى 2 ميجابايت)
                    </p>
                  </div>

                  {/* Suggested Images */}
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-xs text-slate-600 mb-2">أو اختر من الصور المقترحة:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSettings({...settings, header_logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&h=400&fit=crop'})}
                        className="text-xs text-cyan-600 hover:text-cyan-700 underline text-left"
                      >
                        مباني حديثة
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({...settings, header_logo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=400&fit=crop'})}
                        className="text-xs text-cyan-600 hover:text-cyan-700 underline text-left"
                      >
                        مكتب عصري
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({...settings, header_logo: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&h=400&fit=crop'})}
                        className="text-xs text-cyan-600 hover:text-cyan-700 underline text-left"
                      >
                        أعمال احترافية
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({...settings, header_logo: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1920&h=400&fit=crop'})}
                        className="text-xs text-cyan-600 hover:text-cyan-700 underline text-left"
                      >
                        أدوات ومعدات
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="header_title">عنوان الهيدر</Label>
                <Input
                  id="header_title"
                  data-testid="input-header-title"
                  value={settings.header_title || ''}
                  onChange={(e) => setSettings({...settings, header_title: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="header_subtitle">العنوان الفرعي</Label>
                <Input
                  id="header_subtitle"
                  data-testid="input-header-subtitle"
                  value={settings.header_subtitle || ''}
                  onChange={(e) => setSettings({...settings, header_subtitle: e.target.value})}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Footer Settings */}
          <Card className="modern-card border-0">
            <CardHeader>
              <CardTitle className="text-slate-800">إعدادات الفوتر</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="footer_text">نص الفوتر</Label>
                <Input
                  id="footer_text"
                  data-testid="input-footer-text"
                  value={settings.footer_text || ''}
                  onChange={(e) => setSettings({...settings, footer_text: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="footer_phone">رقم الهاتف</Label>
                <Input
                  id="footer_phone"
                  data-testid="input-footer-phone"
                  type="tel"
                  dir="ltr"
                  value={settings.footer_phone || ''}
                  onChange={(e) => setSettings({...settings, footer_phone: e.target.value})}
                  className="mt-1"
                  placeholder="+968XXXXXXXX"
                />
              </div>

              <div>
                <Label htmlFor="footer_email">البريد الإلكتروني</Label>
                <Input
                  id="footer_email"
                  data-testid="input-footer-email"
                  type="email"
                  value={settings.footer_email || ''}
                  onChange={(e) => setSettings({...settings, footer_email: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="footer_address">العنوان</Label>
                <Input
                  id="footer_address"
                  data-testid="input-footer-address"
                  value={settings.footer_address || ''}
                  onChange={(e) => setSettings({...settings, footer_address: e.target.value})}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Landing Page Content Settings */}
          <Card className="modern-card border-0">
            <CardHeader>
              <CardTitle className="text-slate-800">محتوى الصفحة الرئيسية</CardTitle>
              <p className="text-sm text-slate-600 mt-2">أضف محتوى تسويقي جذاب للزوار</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="landing_title">العنوان الرئيسي</Label>
                <Input
                  id="landing_title"
                  value={settings.landing_title || ''}
                  onChange={(e) => setSettings({...settings, landing_title: e.target.value})}
                  placeholder="نظام إدارة الإيجارات"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="landing_subtitle">العنوان الفرعي</Label>
                <Input
                  id="landing_subtitle"
                  value={settings.landing_subtitle || ''}
                  onChange={(e) => setSettings({...settings, landing_subtitle: e.target.value})}
                  placeholder="حل متكامل لإدارة تأجير المعدات"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="about_business">نبذة عن الخدمة</Label>
                <textarea
                  id="about_business"
                  value={settings.about_business || ''}
                  onChange={(e) => setSettings({...settings, about_business: e.target.value})}
                  placeholder="اكتب نبذة شاملة عن خدماتك وما يميزك..."
                  className="mt-1 w-full min-h-[120px] px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  rows={5}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label htmlFor="feature1_title">الميزة الأولى - العنوان</Label>
                  <Input
                    id="feature1_title"
                    value={settings.feature1_title || ''}
                    onChange={(e) => setSettings({...settings, feature1_title: e.target.value})}
                    placeholder="إدارة المعدات"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="feature1_description">الميزة الأولى - الوصف</Label>
                  <Input
                    id="feature1_description"
                    value={settings.feature1_description || ''}
                    onChange={(e) => setSettings({...settings, feature1_description: e.target.value})}
                    placeholder="نظام شامل لإدارة المعدات"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="feature2_title">الميزة الثانية - العنوان</Label>
                  <Input
                    id="feature2_title"
                    value={settings.feature2_title || ''}
                    onChange={(e) => setSettings({...settings, feature2_title: e.target.value})}
                    placeholder="إدارة العملاء"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="feature2_description">الميزة الثانية - الوصف</Label>
                  <Input
                    id="feature2_description"
                    value={settings.feature2_description || ''}
                    onChange={(e) => setSettings({...settings, feature2_description: e.target.value})}
                    placeholder="تنظيم بيانات العملاء"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="feature3_title">الميزة الثالثة - العنوان</Label>
                  <Input
                    id="feature3_title"
                    value={settings.feature3_title || ''}
                    onChange={(e) => setSettings({...settings, feature3_title: e.target.value})}
                    placeholder="تقارير متقدمة"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="feature3_description">الميزة الثالثة - الوصف</Label>
                  <Input
                    id="feature3_description"
                    value={settings.feature3_description || ''}
                    onChange={(e) => setSettings({...settings, feature3_description: e.target.value})}
                    placeholder="رؤى شاملة عن الأداء"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label htmlFor="benefit1">الفائدة 1</Label>
                  <Input
                    id="benefit1"
                    value={settings.benefit1 || ''}
                    onChange={(e) => setSettings({...settings, benefit1: e.target.value})}
                    placeholder="سهولة في الاستخدام"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="benefit2">الفائدة 2</Label>
                  <Input
                    id="benefit2"
                    value={settings.benefit2 || ''}
                    onChange={(e) => setSettings({...settings, benefit2: e.target.value})}
                    placeholder="أمان وحماية البيانات"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="benefit3">الفائدة 3</Label>
                  <Input
                    id="benefit3"
                    value={settings.benefit3 || ''}
                    onChange={(e) => setSettings({...settings, benefit3: e.target.value})}
                    placeholder="إشعارات تلقائية"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="benefit4">الفائدة 4</Label>
                  <Input
                    id="benefit4"
                    value={settings.benefit4 || ''}
                    onChange={(e) => setSettings({...settings, benefit4: e.target.value})}
                    placeholder="دعم فني متواصل"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            data-testid="save-settings-button"
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-md h-12"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="ml-2" size={20} />
                حفظ الإعدادات
              </>
            )}
          </Button>
        </form>
      </div>
    </Layout>
  );
};

export default SettingsPage;
