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
    <header className="bg-gradient-to-r from-white via-slate-50 to-white border-b-2 border-slate-200 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            {/* Logo Container */}
            <div className="flex-shrink-0">
              {settings.header_logo ? (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl blur opacity-30 group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative bg-white rounded-2xl p-2 sm:p-3 shadow-lg border-2 border-slate-100 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center overflow-hidden">
                    <img 
                      src={settings.header_logo} 
                      alt="Logo" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<svg class="w-10 h-10 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>';
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl blur opacity-30 group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-3 sm:p-4 shadow-lg w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                    <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                </div>
              )}
            </div>

            {/* Title Container */}
            <div className="text-center sm:text-right flex-1 max-w-2xl">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent leading-tight">
                {settings.header_title || 'نظام إدارة التأجير'}
              </h1>
              {settings.header_subtitle && (
                <p className="text-xs sm:text-sm lg:text-base text-slate-600 mt-1 sm:mt-2 font-medium">
                  {settings.header_subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Optional: Decorative Line */}
          <div className="mt-4 sm:mt-5 flex items-center justify-center gap-2">
            <div className="h-1 w-12 sm:w-20 bg-gradient-to-r from-transparent via-cyan-500 to-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;