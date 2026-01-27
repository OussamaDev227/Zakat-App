/**
 * Auth Context
 * 
 * Manages authentication state for the application.
 * 
 * NOTE: This is a simple authentication system for academic/demo purposes.
 * - Uses static credentials (admin/admin123)
 * - No password hashing (academic scope)
 * - Auth state persisted in localStorage
 * - Easy to replace with backend authentication later
 */

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'zakat_auth';
const STATIC_USERNAME = 'admin';
const STATIC_PASSWORD = 'admin123';

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check localStorage on mount to restore auth state
  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  /**
   * Login function
   * Validates credentials against static values
   * @param {string} username - Username input
   * @param {string} password - Password input
   * @returns {boolean} - true if credentials are correct, false otherwise
   */
  function login(username, password) {
    if (username === STATIC_USERNAME && password === STATIC_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      return true;
    }
    return false;
  }

  /**
   * Logout function
   * Clears authentication state and localStorage
   */
  function logout() {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
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
