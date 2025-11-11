import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Building2 } from 'lucide-react';

const Header = () => {
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
    <div className="bg-white border-b border-teal-100 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-4">
          {settings.header_logo ? (
            <img 
              src={settings.header_logo} 
              alt="Logo" 
              className="h-12 w-12 object-contain"
            />
          ) : (
            <Building2 className="h-12 w-12 text-teal-600" />
          )}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-teal-700">
              {settings.header_title}
            </h1>
            {settings.header_subtitle && (
              <p className="text-sm text-gray-600">{settings.header_subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;