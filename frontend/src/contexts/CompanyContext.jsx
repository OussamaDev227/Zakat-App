/**
 * Company Context
 *
 * Manages company session: one company at a time, locked after password verification.
 * - selectCompany(companyId, password): verify password, store token, set active company
 * - clearCompanySession(): clear token and active company (logout from company / before switch)
 * - activeCompany: current company when session exists; null otherwise
 * - When activeCompany is set, applies company.language (i18n + RTL/LTR).
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCompanyToken, clearCompanyToken } from '../api/authStore';
import * as authApi from '../api/auth';
import i18n from '../i18n';

const SUPPORTED_LANGS = ['ar', 'fr', 'en'];

function applyLanguage(lang) {
  const l = SUPPORTED_LANGS.includes(lang) ? lang : 'ar';
  const dir = l === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = l;
  document.documentElement.dir = dir;
  try {
    localStorage.setItem('lang', l);
  } catch (_) {}
  i18n.changeLanguage(l);
}

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
    if (data.company?.language) {
      applyLanguage(data.company.language);
    }
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
        if (company?.language) {
          applyLanguage(company.language);
        }
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
