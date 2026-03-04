import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const axiosInstance = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect to login for public endpoints
    const isPublicEndpoint = error.config?.url?.includes('/public');
    const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/';
    const isAdminLoginPage = window.location.pathname === '/admin-login';

    if (error.response?.status === 401 && !isPublicEndpoint && !isLoginPage && !isAdminLoginPage) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');

      // Check if we're on an admin/staff route, redirect accordingly
      const isStaffRoute = window.location.pathname.includes('/dashboard') ||
                          window.location.pathname.includes('/settings') ||
                          window.location.pathname.includes('/employees') ||
                          window.location.pathname.includes('/reports');

      window.location.href = isStaffRoute ? '/admin-login' : '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
export { API };