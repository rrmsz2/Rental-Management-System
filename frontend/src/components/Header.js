import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

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

  // Default banner image if none provided
  const bannerImage = settings.header_logo || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&h=400&fit=crop';

  return (
    <header className="relative w-full overflow-hidden">
      {/* Banner Image Container */}
      <div className="relative w-full h-48 sm:h-56 md:h-64 lg:h-72">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${bannerImage})`,
            filter: 'brightness(0.7)'
          }}
        >
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/60"></div>
        </div>

        {/* Content Container */}
        <div className="relative h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-3 drop-shadow-2xl">
              {settings.header_title || 'نظام إدارة التأجير'}
            </h1>

            {/* Subtitle */}
            {settings.header_subtitle && (
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 font-medium drop-shadow-lg">
                {settings.header_subtitle}
              </p>
            )}

            {/* Decorative Line */}
            <div className="mt-4 sm:mt-6 flex items-center justify-center gap-2">
              <div className="h-1 w-16 sm:w-24 bg-gradient-to-r from-transparent via-white to-white/50 rounded-full"></div>
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="h-1 w-16 sm:w-24 bg-gradient-to-l from-transparent via-white to-white/50 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Bottom Wave Effect (Optional) */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg 
            viewBox="0 0 1440 48" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-6 sm:h-8"
            preserveAspectRatio="none"
          >
            <path 
              d="M0 48H1440V0C1440 0 1080 48 720 48C360 48 0 0 0 0V48Z" 
              fill="white"
            />
          </svg>
        </div>
      </div>
    </header>
  );
};

export default Header;