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
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RulesProvider } from './contexts/RulesContext';
import { CompanyProvider } from './contexts/CompanyContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import CompaniesPage from './pages/CompaniesPage';
import FinancialItemsPage from './pages/FinancialItemsPage';
import ZakatPage from './pages/ZakatPage';
import ZakatHistoryPage from './pages/ZakatHistoryPage';
import ZakatCalculationDetailPage from './pages/ZakatCalculationDetailPage';
import AboutMethodologyPage from './pages/AboutMethodologyPage';

// Component to handle root redirect based on auth status
function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <p className="text-gray-700 font-medium">جاري التحميل...</p>
      </div>
    );
  }
  
  return <Navigate to={isAuthenticated ? "/companies" : "/login"} replace />;
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
                        <Route path="/companies" element={<CompaniesPage />} />
                        <Route path="/financial-items" element={<FinancialItemsPage />} />
                        <Route path="/zakat" element={<ZakatPage />} />
                        <Route path="/history" element={<ZakatHistoryPage />} />
                        <Route path="/history/:id" element={<ZakatCalculationDetailPage />} />
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
