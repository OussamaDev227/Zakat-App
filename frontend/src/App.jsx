/**
 * Main App Component
 * 
 * Decision Support System for Corporate Zakat Calculation
 * 
 * This is an academic MVP demonstrating:
 * - Rule-based zakat calculation (rules come from backend)
 * - Clear separation: frontend displays, backend decides
 * - RTL/Arabic-friendly interface
 * - Simple authentication for academic/demo use
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RulesProvider } from './contexts/RulesContext';
import { CompanyProvider } from './contexts/CompanyContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import CompanyRouteGuard from './components/CompanyRouteGuard';
import AdminRouteGuard from './components/AdminRouteGuard';
import LoginPage from './pages/LoginPage';
import CompaniesPage from './pages/CompaniesPage';
import AdminUsersPage from './pages/AdminUsersPage';
import FinancialItemsPage from './pages/FinancialItemsPage';
import ZakatPage from './pages/ZakatPage';
import ZakatHistoryPage from './pages/ZakatHistoryPage';
import ZakatCalculationDetailPage from './pages/ZakatCalculationDetailPage';
import AboutMethodologyPage from './pages/AboutMethodologyPage';
import DashboardPage from './pages/DashboardPage';
import { useCompany } from './contexts/CompanyContext';

// Component to handle root redirect based on auth status
function RootRedirect() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, isLoading, systemRole, role } = useAuth();
  const { hasCompanySession } = useCompany();
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={dir}>
        <p className="text-gray-700 font-medium">{t('loading')}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (systemRole === 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  if (role === 'OWNER' && hasCompanySession) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/companies" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public route: Login page */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected routes: All app pages require authentication */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <RulesProvider>
                  <CompanyProvider>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<RootRedirect />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/companies" element={<CompaniesPage />} />
                        <Route path="/admin/users" element={<AdminRouteGuard><AdminUsersPage /></AdminRouteGuard>} />
                        <Route path="/financial-items" element={<CompanyRouteGuard><FinancialItemsPage /></CompanyRouteGuard>} />
                        <Route path="/zakat" element={<CompanyRouteGuard><ZakatPage /></CompanyRouteGuard>} />
                        <Route path="/history" element={<CompanyRouteGuard><ZakatHistoryPage /></CompanyRouteGuard>} />
                        <Route path="/history/:id" element={<CompanyRouteGuard><ZakatCalculationDetailPage /></CompanyRouteGuard>} />
                        <Route path="/about-methodology" element={<AboutMethodologyPage />} />
                      </Routes>
                    </Layout>
                  </CompanyProvider>
                </RulesProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
