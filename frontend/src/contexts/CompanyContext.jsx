/**
 * Company Context
 * 
 * Manages the currently selected/active company.
 * This is used throughout the app to:
 * - Filter financial items by company
 * - Calculate zakat for the active company
 * - Show company-specific history
 */

import { createContext, useContext, useState } from 'react';

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const [activeCompany, setActiveCompany] = useState(null);

  return (
    <CompanyContext.Provider value={{ activeCompany, setActiveCompany }}>
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
