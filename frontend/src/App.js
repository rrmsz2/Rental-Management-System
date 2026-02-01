import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import Dashboard from './pages/Dashboard';
import DashboardPage from './pages/DashboardPage';
import CustomerPortalPage from './pages/CustomerPortalPage';
import CustomersPage from './pages/CustomersPage';
import EmployeesPage from './pages/EmployeesPage';
import EquipmentPage from './pages/EquipmentPage';
import RentalsPage from './pages/RentalsPage';
import InvoicesPage from './pages/InvoicesPage';
import ReportsPageNew from './pages/ReportsPageNew';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import QuickRentPage from './pages/QuickRentPage';
import QuickReturnPage from './pages/QuickReturnPage';
import QRScanLoginPage from './pages/QRScanLoginPage';
import QRScanPage from './pages/QRScanPage';

// Protected Route for Staff Only (Admin, Employee, Accountant)
const StaffRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-teal-600 text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect customers to their portal
  if (user.is_customer_only || user.role === 'customer') {
    return <Navigate to="/customer-portal" replace />;
  }

  return children;
};

// Protected Route for Customers
const CustomerRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-teal-600 text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect staff to dashboard
  if (!user.is_customer_only && user.role !== 'customer') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// General Protected Route (for both staff and customers)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-teal-600 text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            {/* Public Routes - No Auth Required */}
            <Route path="/qr-login/:equipmentId" element={<QRScanLoginPage />} />
            <Route path="/qr-scan/:equipmentId" element={<QRScanPage />} />
            <Route path="/quick-rent/:equipmentId" element={<QuickRentPage />} />
            <Route path="/quick-return/:equipmentId" element={<QuickReturnPage />} />

            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />
            <Route path="/verify" element={<VerifyOtpPage />} />

            {/* Customer Portal */}
            <Route path="/customer-portal" element={<CustomerRoute><CustomerPortalPage /></CustomerRoute>} />

            {/* Staff Routes - Only for Admin, Employee, Accountant */}
            <Route path="/dashboard" element={<StaffRoute><DashboardPage /></StaffRoute>} />
            <Route path="/dashboard-old" element={<StaffRoute><Dashboard /></StaffRoute>} />
            <Route path="/customers" element={<StaffRoute><CustomersPage /></StaffRoute>} />
            <Route path="/employees" element={<StaffRoute><EmployeesPage /></StaffRoute>} />
            <Route path="/equipment" element={<StaffRoute><EquipmentPage /></StaffRoute>} />
            <Route path="/rentals" element={<StaffRoute><RentalsPage /></StaffRoute>} />
            <Route path="/invoices" element={<StaffRoute><InvoicesPage /></StaffRoute>} />
            <Route path="/reports" element={<StaffRoute><ReportsPageNew /></StaffRoute>} />
            <Route path="/users" element={<StaffRoute><UsersPage /></StaffRoute>} />
            <Route path="/settings" element={<StaffRoute><SettingsPage /></StaffRoute>} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </div>
    </AuthProvider>
  );
}

export default App;
