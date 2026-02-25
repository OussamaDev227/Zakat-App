/**
 * Company Route Guard
 *
 * Redirects to /companies if user has no company session.
 * Use for routes that require a selected company (financial items, zakat, history).
 */

import { Navigate } from 'react-router-dom';
import { useCompany } from '../contexts/CompanyContext';

export default function CompanyRouteGuard({ children }) {
  const { hasCompanySession, restoring } = useCompany();

  if (restoring) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <p className="text-gray-700 font-medium">جاري التحميل...</p>
      </div>
    );
  }

  if (!hasCompanySession) {
    return <Navigate to="/companies" replace />;
  }

  return children;
}
