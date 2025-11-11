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
    <div className="bg-white border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md">
            {settings.header_logo ? (
              <img 
                src={settings.header_logo} 
                alt="Logo" 
                className="h-10 w-10 object-contain"
              />
            ) : (
              <Building2 className="h-8 w-8 text-white" />
            )}
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800">
              {settings.header_title}
            </h1>
            {settings.header_subtitle && (
              <p className="text-sm text-slate-500">{settings.header_subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;