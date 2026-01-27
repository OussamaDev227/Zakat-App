/**
 * Rules Context
 * 
 * Decision Support System Note:
 * This context loads rules from the backend ONCE at app startup.
 * The frontend does NOT interpret, modify, or infer zakat rules.
 * All rule logic lives in the backend rule engine.
 * 
 * The rules are used only for:
 * - Populating dropdowns (asset codes, liability codes)
 * - Displaying rule metadata (labels, explanations)
 * - UI hints (e.g., which fields are required based on extended_rules)
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { getRules } from '../api/rules';

const RulesContext = createContext(null);

export function RulesProvider({ children }) {
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadRules() {
      try {
        setLoading(true);
        const rulesData = await getRules();
        setRules(rulesData);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Failed to load rules:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRules();
  }, []);

  return (
    <RulesContext.Provider value={{ rules, loading, error }}>
      {children}
    </RulesContext.Provider>
  );
}

export function useRules() {
  const context = useContext(RulesContext);
  if (!context) {
    throw new Error('useRules must be used within RulesProvider');
  }
  return context;
}
