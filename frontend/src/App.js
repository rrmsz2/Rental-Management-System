import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import LoginPage from './pages/LoginPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import Dashboard from './pages/Dashboard';
import DashboardPage from './pages/DashboardPage';
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

// Protected Route Component
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
            
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify" element={<VerifyOtpPage />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/dashboard-old" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
            <Route path="/employees" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
            <Route path="/equipment" element={<ProtectedRoute><EquipmentPage /></ProtectedRoute>} />
            <Route path="/rentals" element={<ProtectedRoute><RentalsPage /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportsPageNew /></ProtectedRoute>} />
            <Route path="/reports-old" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </div>
    </AuthProvider>
  );
}

export default App;
