/**
 * Zakat History Page
 * 
 * List all zakat calculations for the active company (drafts + finalized)
 */

import { useState, useEffect } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { getCalculationsForCompany } from '../api/zakat';
import HistoryList from '../components/HistoryList';
import CompanySelector from '../components/CompanySelector';

export default function ZakatHistoryPage() {
  const { activeCompany } = useCompany();
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL, DRAFT, FINALIZED

  useEffect(() => {
    if (activeCompany) {
      loadHistory();
    } else {
      setCalculations([]);
    }
  }, [activeCompany]);

  async function loadHistory() {
    if (!activeCompany) return;

    try {
      setLoading(true);
      const data = await getCalculationsForCompany(activeCompany.id);
      setCalculations(data);
    } catch (error) {
      console.error('Failed to load history:', error);
      alert('فشل تحميل السجل: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredCalculations = calculations.filter(calc => {
    if (filter === 'ALL') return true;
    if (filter === 'DRAFT') return calc.status === 'DRAFT';
    if (filter === 'FINALIZED') return calc.status === 'FINALIZED';
    return true;
  });

  if (!activeCompany) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">سجل حسابات الزكاة</h1>
          <p className="text-gray-600">عرض جميع حسابات الزكاة للشركة النشطة</p>
        </div>
        <CompanySelector />
        <div className="card text-center py-8">
          <p className="text-gray-700 font-medium">يرجى اختيار شركة لعرض سجل الحسابات</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">سجل حسابات الزكاة</h1>
        <p className="text-sm sm:text-base text-gray-600">عرض جميع حسابات الزكاة للشركة النشطة (مسودات ونهائية)</p>
      </div>

      <CompanySelector />

      {/* Filter Buttons */}
      <div className="mb-6 flex flex-wrap gap-2 sm:gap-3">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-bold transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 ${
            filter === 'ALL'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          الكل
        </button>
        <button
          onClick={() => setFilter('DRAFT')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-bold transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 ${
            filter === 'DRAFT'
              ? 'bg-yellow-600 text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          المسودات
        </button>
        <button
          onClick={() => setFilter('FINALIZED')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-bold transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 ${
            filter === 'FINALIZED'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          النهائية
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-700 font-medium">جاري التحميل...</div>
      ) : calculations.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-700 font-medium">لا توجد حسابات</p>
        </div>
      ) : (
        <HistoryList calculations={filteredCalculations} />
      )}
    </div>
  );
}
