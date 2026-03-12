/**
 * Zakat History Page
 *
 * List all zakat calculations for the active company (drafts + finalized)
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompany } from '../contexts/CompanyContext';
import { getCalculationsForCompany } from '../api/zakat';
import HistoryList from '../components/HistoryList';

export default function ZakatHistoryPage() {
  const { t } = useTranslation();
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
      const data = await getCalculationsForCompany();
      setCalculations(data);
    } catch (error) {
      console.error('Failed to load history:', error);
      alert(t('load_history_failed') + ': ' + error.message);
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

  if (!activeCompany) return null;

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('zakat_history_title')}</h1>
        <p className="text-sm sm:text-base text-gray-600">{t('history_intro')}</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 sm:gap-3">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-bold transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 ${
            filter === 'ALL'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {t('filter_all')}
        </button>
        <button
          onClick={() => setFilter('DRAFT')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-bold transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 ${
            filter === 'DRAFT'
              ? 'bg-yellow-600 text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {t('filter_drafts')}
        </button>
        <button
          onClick={() => setFilter('FINALIZED')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-bold transition-colors text-sm sm:text-base min-h-[44px] sm:min-h-0 ${
            filter === 'FINALIZED'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {t('filter_finalized')}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-700 font-medium">{t('loading')}</div>
      ) : calculations.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-700 font-medium">{t('no_calculations')}</p>
        </div>
      ) : (
        <HistoryList calculations={filteredCalculations} />
      )}
    </div>
  );
}
