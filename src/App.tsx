import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import theme from './theme/theme';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
// Unified management replaces separate Students & Payments pages
// import UnifiedManagement from './pages/UnifiedManagement';
import UnifiedHostelManagement from './pages/UnifiedHostelManagement';
import Rooms from './pages/Rooms';
import Reports from './pages/Reports';
import Bonafide from './pages/Bonafide';
import ExcelImport from './pages/ExcelImport';
import QuickBilling from './pages/QuickBilling';
import ReceiptRegister from './pages/ReceiptRegister';
import PettyCashRegister from './pages/PettyCashRegister';
import SalaryStatement from './pages/SalaryStatement';
import AdministrationBilling from './pages/AdministrationBilling';
import Settings from './pages/Settings';
import PrintCenter from './pages/PrintCenter';
import DataBackup from './pages/DataBackup';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // You can replace this with a proper loading component
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component (redirects to dashboard if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                {/* Unified management replaces students & payments */}
                <Route path="management" element={<UnifiedHostelManagement />} />
                {/* Legacy deep-link redirects */}
                <Route path="students" element={<Navigate to="/management" replace />} />
                <Route path="payments" element={<Navigate to="/management" replace />} />
                <Route path="quick-billing" element={<QuickBilling />} />
                <Route path="receipt-register" element={<ReceiptRegister />} />
                <Route path="petty-cash" element={<PettyCashRegister />} />
                <Route path="salary-statement" element={<SalaryStatement />} />
                <Route path="admin-billing" element={<AdministrationBilling />} />
                <Route path="rooms" element={<Rooms />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="bonafide" element={<Bonafide />} />
                <Route path="import" element={<ExcelImport />} />
                <Route path="print-center" element={<PrintCenter />} />
                <Route path="backup" element={<DataBackup />} />
              </Route>

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </LocalizationProvider>
  );
}

export default App;
