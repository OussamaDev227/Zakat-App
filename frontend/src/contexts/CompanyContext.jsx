/**
 * Company Context
 *
 * Manages company session: one company at a time, locked after password verification.
 * - selectCompany(companyId, password): verify password, store token, set active company
 * - clearCompanySession(): clear token and active company (logout from company / before switch)
 * - activeCompany: current company when session exists; null otherwise
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCompanyToken, clearCompanyToken } from '../api/authStore';
import * as authApi from '../api/auth';

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const [activeCompany, setActiveCompany] = useState(null);
  const [restoring, setRestoring] = useState(true);

  const clearCompanySession = useCallback(() => {
    clearCompanyToken();
    setActiveCompany(null);
  }, []);

  const selectCompany = useCallback(async (companyId, password) => {
    const data = await authApi.selectCompany(companyId, password);
    setActiveCompany(data.company);
    return data;
  }, []);

  useEffect(() => {
    const token = getCompanyToken();
    if (!token) {
      setRestoring(false);
      return;
    }
    authApi.getCurrentCompany()
      .then((company) => {
        setActiveCompany(company);
      })
      .catch(() => {
        clearCompanyToken();
        setActiveCompany(null);
      })
      .finally(() => {
        setRestoring(false);
      });
  }, []);

  const value = {
    activeCompany,
    setActiveCompany,
    selectCompany,
    clearCompanySession,
    hasCompanySession: !!activeCompany,
    restoring,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within CompanyProvider');
  }
  return context;
}
