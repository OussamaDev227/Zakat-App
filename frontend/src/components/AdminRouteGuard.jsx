import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminRouteGuard({ children }) {
  const { isLoading, systemRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-gray-700 font-medium">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (systemRole !== 'ADMIN') {
    return <Navigate to="/companies" replace />;
  }

  return children;
}
