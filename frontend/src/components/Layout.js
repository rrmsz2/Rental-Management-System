import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  Receipt, 
  BarChart3, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { toast } from 'sonner';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    toast.success('تم تسجيل الخروج');
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/dashboard', testId: 'nav-dashboard' },
    { icon: Users, label: 'العملاء', path: '/customers', testId: 'nav-customers' },
    { icon: Package, label: 'المعدات', path: '/equipment', testId: 'nav-equipment' },
    { icon: FileText, label: 'عقود التأجير', path: '/rentals', testId: 'nav-rentals' },
    { icon: Receipt, label: 'الفواتير', path: '/invoices', testId: 'nav-invoices' },
    { icon: BarChart3, label: 'التقارير', path: '/reports', testId: 'nav-reports' },
  ];

  return (
    <div className="min-h-screen" data-testid="layout-container">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-teal-100 sticky top-0 z-40 glass">
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-teal-600"
              data-testid="menu-toggle"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
            <h1 className="text-xl font-bold text-teal-700">
              نظام إدارة التأجير
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-700" data-testid="user-phone">
                {user?.phone}
              </p>
              {user?.is_manager && (
                <span className="text-xs text-teal-600 font-semibold">مدير</span>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              data-testid="logout-button"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              <LogOut size={18} className="ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-16 right-0 h-[calc(100vh-4rem)] w-64 bg-white border-l border-teal-100 
            transform transition-transform duration-300 ease-in-out z-30 glass
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}
          data-testid="sidebar"
        >
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  data-testid={item.testId}
                  variant={isActive ? 'default' : 'ghost'}
                  className={`
                    w-full justify-end text-right h-12
                    ${isActive 
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white' 
                      : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700'
                    }
                  `}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                >
                  <span className="flex-1 text-right">{item.label}</span>
                  <Icon size={20} className="mr-3" />
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6" data-testid="main-content">
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          data-testid="sidebar-overlay"
        />
      )}
    </div>
  );
};

export default Layout;