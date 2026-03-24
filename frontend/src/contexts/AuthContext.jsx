/** Auth context with backend JWT and role-based helpers. */

import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login as loginApi, logout as logoutApi } from '../api/auth';
import { clearStoredUser, getStoredUser, getUserToken, setStoredUser } from '../api/authStore';

const AuthContext = createContext(null);

const ROLE_ACTIONS = {
  manageFinancialItems: ['ACCOUNTANT'],
  importExcel: ['ACCOUNTANT'],
  runZakatCalculations: ['ACCOUNTANT'],
  viewReports: ['ACCOUNTANT', 'OWNER', 'SHARIA_AUDITOR'],
  manageCompanies: [],
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [systemRole, setSystemRole] = useState('USER');
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      const token = getUserToken();
      const storedUser = getStoredUser();
      if (!token) {
        setIsLoading(false);
        return;
      }
      if (storedUser) {
        setUser(storedUser);
        setSystemRole(storedUser.system_role || 'USER');
      }
      try {
        const me = await getMe();
        setUser(me);
        setStoredUser(me);
        setSystemRole(me.system_role || 'USER');
      } catch {
        logoutApi();
        clearStoredUser();
        setUser(null);
        setSystemRole('USER');
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    }
    restore();
  }, []);

  async function login(email, password) {
    const data = await loginApi(email, password);
    setUser(data.user);
    setSystemRole(data.user?.system_role || 'USER');
    setRole(null);
    return data;
  }

  function setActiveRole(newRole) {
    setRole(newRole || null);
  }

  function logout() {
    logoutApi();
    setUser(null);
    setSystemRole('USER');
    setRole(null);
  }

  function hasRole(roleName) {
    return role === roleName;
  }

  function hasPermission(action) {
    if (systemRole === 'ADMIN') return true;
    const allowed = ROLE_ACTIONS[action] || [];
    return !!role && allowed.includes(role);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        systemRole,
        role,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        setActiveRole,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
