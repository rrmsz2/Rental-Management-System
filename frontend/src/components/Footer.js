import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings');
    }
  };

  if (!settings) return null;

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-right">
          <div>
            <h3 className="font-bold text-slate-800 mb-3 text-sm">معلومات الاتصال</h3>
            <div className="space-y-2">
              {settings.footer_phone && (
                <div className="flex items-center justify-center md:justify-start gap-2 text-slate-600 text-sm" dir="ltr">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
                    <Phone size={14} className="text-cyan-600" />
                  </div>
                  <span>{settings.footer_phone}</span>
                </div>
              )}
              {settings.footer_email && (
                <div className="flex items-center justify-center md:justify-start gap-2 text-slate-600 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
                    <Mail size={14} className="text-cyan-600" />
                  </div>
                  <span>{settings.footer_email}</span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-slate-800 mb-3 text-sm">العنوان</h3>
            {settings.footer_address && (
              <div className="flex items-center justify-center md:justify-start gap-2 text-slate-600 text-sm">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
                  <MapPin size={14} className="text-cyan-600" />
                </div>
                <span>{settings.footer_address}</span>
              </div>
            )}
          </div>
          
          <div>
            <p className="text-slate-600 text-sm">{settings.footer_text}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;