/**
 * Company Selector Component
 * 
 * Dropdown to select the active company
 */

import { useState, useEffect } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { getCompanies } from '../api/companies';

export default function CompanySelector() {
  const { activeCompany, setActiveCompany } = useCompany();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const data = await getCompanies();
        setCompanies(data);
        
        // Auto-select first company if none selected
        if (!activeCompany && data.length > 0) {
          setActiveCompany(data[0]);
        }
      } catch (error) {
        console.error('Failed to load companies:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCompanies();
  }, [activeCompany, setActiveCompany]);

  if (loading) {
    return <div className="text-gray-700 font-medium">جاري التحميل...</div>;
  }

  if (companies.length === 0) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-5 shadow-md">
        <p className="text-yellow-900 font-bold">لا توجد شركات. يرجى إنشاء شركة أولاً.</p>
      </div>
    );
  }

  return (
    <div className="mb-6 card bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
      <label className="block text-sm font-bold text-gray-900 mb-3">
        اختر الشركة النشطة:
      </label>
      <select
        value={activeCompany?.id || ''}
        onChange={(e) => {
          const selected = companies.find(c => c.id === parseInt(e.target.value));
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/36bf502b-a8b0-4651-80f5-b666e22bc1b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CompanySelector.jsx:56',message:'Company selected',data:{selectedName:selected?.name,selectedNameLength:selected?.name?.length,firstChar:selected?.name?.[0],firstCharCode:selected?.name?.[0]?.charCodeAt?.(0)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
          // #endregion
          setActiveCompany(selected);
        }}
        className="input-field max-w-md bg-white font-semibold"
      >
        <option value="">-- اختر شركة --</option>
        {companies.map((company) => {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/36bf502b-a8b0-4651-80f5-b666e22bc1b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CompanySelector.jsx:64',message:'Rendering company option',data:{companyName:company.name,companyNameLength:company.name?.length,firstChar:company.name?.[0],firstCharCode:company.name?.[0]?.charCodeAt?.(0),companyId:company.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
          // #endregion
          return (
            <option key={company.id} value={company.id}>
              {company.name} ({company.legal_type})
            </option>
          );
        })}
      </select>
    </div>
  );
}
