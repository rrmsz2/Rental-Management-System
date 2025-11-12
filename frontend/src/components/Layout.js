import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import Header from './Header';
import Footer from './Footer';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  Receipt, 
  BarChart3,
  UserCog,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { toast } from 'sonner';

const Layout = ({ children }) => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Refresh user data on mount
  React.useEffect(() => {
    if (user) {
      console.log('Current user data:', user);
      refreshUser();
    }
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('تم تسجيل الخروج');
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/dashboard', testId: 'nav-dashboard' },
    { icon: Users, label: 'العملاء', path: '/customers', testId: 'nav-customers' },
    { icon: UserCog, label: 'الموظفين', path: '/employees', testId: 'nav-employees' },
    { icon: Package, label: 'المعدات', path: '/equipment', testId: 'nav-equipment' },
    { icon: FileText, label: 'عقود التأجير', path: '/rentals', testId: 'nav-rentals' },
    { icon: Receipt, label: 'الفواتير', path: '/invoices', testId: 'nav-invoices' },
    { icon: BarChart3, label: 'التقارير', path: '/reports', testId: 'nav-reports' },
    { icon: Users, label: 'المستخدمين', path: '/users', testId: 'nav-users', adminOnly: true },
    { icon: Settings, label: 'الإعدادات', path: '/settings', testId: 'nav-settings' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/40 relative overflow-hidden" data-testid="layout-container" dir="rtl">
      {/* Decorative Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-200/40 to-blue-200/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-100/20 to-blue-100/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <Header />
      
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-slate-600 hover:bg-slate-100"
              data-testid="menu-toggle"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block bg-slate-50 px-3 py-2 rounded-lg min-w-[160px]">
              <p className="text-sm font-bold text-slate-800 mb-1">
                مرحباً بك {user?.full_name && user.full_name !== user.phone && user.full_name.trim() !== '' ? user.full_name : (user?.phone ? '' : '')}
              </p>
              {user?.role && (
                <p className={`text-xs font-semibold mb-1 ${
                  user.role === 'admin' ? 'text-red-600' :
                  user.role === 'employee' ? 'text-blue-600' :
                  'text-green-600'
                }`}>
                  {user.role === 'admin' ? 'مدير' : 
                   user.role === 'employee' ? 'موظف' : 'محاسب'}
                </p>
              )}
              {user?.is_manager && !user?.role && (
                <p className="text-xs text-cyan-600 font-semibold mb-1">مدير</p>
              )}
              <p className="text-xs text-slate-500" data-testid="user-phone" dir="ltr">
                {user?.phone ? user.phone.replace('+968', '') : ''}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              data-testid="logout-button"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              <LogOut size={18} className="mr-2" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200 
            transform transition-transform duration-300 ease-in-out z-30 shadow-sm
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
          data-testid="sidebar"
        >
          <nav className="p-3 space-y-1">
            {menuItems.map((item) => {
              // Role-based access control
              if (item.adminOnly && user?.role !== 'admin' && !user?.is_manager) {
                return null; // Hide admin-only items for non-admins
              }
              
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  data-testid={item.testId}
                  variant="ghost"
                  className={`
                    w-full justify-start text-right h-11 rounded-xl font-medium transition-all
                    ${isActive 
                      ? 'sidebar-active' 
                      : 'text-slate-700 hover:bg-slate-100'
                    }
                  `}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon size={20} className="ml-3" />
                  <span className="flex-1 text-right text-sm">{item.label}</span>
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8" data-testid="main-content">
          {children}
        </main>
      </div>

      {/* Footer */}
      <Footer />

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