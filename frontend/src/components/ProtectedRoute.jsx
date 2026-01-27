/**
 * Protected Route Component
 * 
 * Route guard that ensures only authenticated users can access protected routes.
 * Redirects to /login if user is not authenticated.
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-gray-700 font-medium">جاري التحقق من الهوية...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content if authenticated
  return children;
}
