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
    <footer className="bg-white border-t border-teal-100 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-right">
          <div>
            <h3 className="font-bold text-teal-700 mb-2">معلومات الاتصال</h3>
            {settings.footer_phone && (
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 mb-1" dir="ltr">
                <Phone size={16} />
                <span>{settings.footer_phone}</span>
              </div>
            )}
            {settings.footer_email && (
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 mb-1">
                <Mail size={16} />
                <span>{settings.footer_email}</span>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-bold text-teal-700 mb-2">العنوان</h3>
            {settings.footer_address && (
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600">
                <MapPin size={16} />
                <span>{settings.footer_address}</span>
              </div>
            )}
          </div>
          
          <div>
            <p className="text-gray-600 text-sm">{settings.footer_text}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;