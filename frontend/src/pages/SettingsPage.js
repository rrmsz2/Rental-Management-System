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
                <Label htmlFor="header_logo">شعار الهيدر</Label>
                <div className="mt-2 flex items-center gap-4">
                  {settings.header_logo && (
                    <img 
                      src={settings.header_logo} 
                      alt="Logo" 
                      className="h-16 w-16 object-contain border border-teal-200 rounded p-1"
                    />
                  )}
                  <div className="flex-1">
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
                      onClick={() => document.getElementById('logo-upload').click()}
                      disabled={uploading}
                      data-testid="upload-logo-button"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          جاري الرفع...
                        </>
                      ) : (
                        <>
                          <Upload className="ml-2" size={16} />
                          رفع شعار جديد
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, WebP, SVG (الحد الأقصى 2 ميجابايت)
                    </p>
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

          <Button 
            type="submit" 
            data-testid="save-settings-button"
            className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
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
