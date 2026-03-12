/**
 * Zakat Calculation Detail Page
 * 
 * View detailed results of a specific zakat calculation
 * 
 * Decision Support Note:
 * This page displays the exact results from a calculation.
 * All explanations, classifications, and rules come from the backend rule engine.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCalculation } from '../api/zakat';
import ZakatResultTable from '../components/ZakatResultTable';
import CalculationStatusBadge from '../components/CalculationStatusBadge';
import RulesUsedSection from '../components/RulesUsedSection';
import { generateZakatReportPDF } from '../utils/pdfGenerator';

export default function ZakatCalculationDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      try {
        setLoading(true);
        const data = await getCalculation(parseInt(id));
        setCalculation(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [id]);

  if (loading) {
    return <div className="text-center py-8 text-gray-700 font-medium">{t('loading')}</div>;
  }

  if (error) {
    return (
      <div className="card bg-red-50 border-2 border-red-300 shadow-lg">
        <p className="text-red-900 font-bold text-lg mb-4">{t('error')}: {error}</p>
        <Link to="/history" className="btn-secondary mt-4 inline-block">
          {t('back_to_history')}
        </Link>
      </div>
    );
  }

  if (!calculation) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-700 font-medium">{t('calculation_not_found')}</p>
        <Link to="/history" className="btn-secondary mt-4 inline-block">
          {t('back_to_history')}
        </Link>
      </div>
    );
  }

  // Use calculation_date if available, otherwise use created_at
  const displayDate = calculation.calculation_date || calculation.created_at;

  const handleDownloadPDF = async () => {
    if (!calculation) return;
    
    try {
      setGeneratingPDF(true);
      await generateZakatReportPDF(calculation);
    } catch (err) {
      alert(`${t('pdf_error')}: ${err.message}`);
      console.error('PDF generation error:', err);
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{t('calculation_detail_title')}</h1>
            <CalculationStatusBadge status={calculation.status} />
          </div>
          <p className="text-gray-600">{t('calculation_summary')}</p>
        </div>
        <div className="flex gap-3">
          {false && (
            <button
              onClick={handleDownloadPDF}
              disabled={generatingPDF}
              className={`btn-primary ${generatingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={t('download_pdf')}
            >
              {generatingPDF ? t('generating_pdf') : `📄 ${t('download_pdf')}`}
            </button>
          )}
          <Link to="/history" className="btn-secondary">
            ← {t('back_to_history')}
          </Link>
        </div>
      </div>

      <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-xl mb-6">
        <h2 className="text-2xl font-bold mb-6 text-green-900 flex items-center gap-2">
          <span className="text-3xl">✓</span>
          {t('calculation_summary')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {calculation.nisab_value != null && (
            <div className="bg-white rounded-lg p-5 border-2 border-green-200 shadow-md">
              <p className="text-sm text-gray-700 mb-2 font-semibold">{t('nisab_value')}</p>
              <p className="font-bold text-gray-900">
                {parseFloat(calculation.nisab_value).toLocaleString('en-US', { minimumFractionDigits: 2 })} {t('currency')}
              </p>
            </div>
          )}
          {calculation.items_excluded_hawl > 0 && (
            <div className="bg-white rounded-lg p-5 border-2 border-amber-200 shadow-md">
              <p className="text-sm text-gray-700 mb-2 font-semibold">{t('items_excluded_hawl')}</p>
              <p className="font-bold text-amber-700">{calculation.items_excluded_hawl}</p>
            </div>
          )}
          <div className="bg-white rounded-lg p-5 border-2 border-green-200 shadow-md">
            <p className="text-sm text-gray-700 mb-2 font-semibold">{t('table_date')}</p>
            <p className="font-bold text-gray-900">
              {displayDate ? new Date(displayDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }) : t('date_unspecified')}
            </p>
            {calculation.created_at && calculation.updated_at && (
              <p className="text-xs text-gray-500 mt-2">
                {new Date(calculation.created_at).toLocaleDateString('en-US')}
                {calculation.updated_at !== calculation.created_at && (
                  <> | {new Date(calculation.updated_at).toLocaleDateString('en-US')}</>
                )}
              </p>
            )}
          </div>
          <div className="bg-white rounded-lg p-5 border-2 border-green-200 shadow-md">
            <p className="text-sm text-gray-700 mb-2 font-semibold">{t('zakat_base')}</p>
            <p className="text-3xl font-bold text-green-700">
              {parseFloat(calculation.zakat_base).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xl">{t('currency')}</span>
            </p>
          </div>
          <div className="bg-white rounded-lg p-5 border-2 border-green-200 shadow-md">
            <p className="text-sm text-gray-700 mb-2 font-semibold">{t('zakat_amount_2_5')}</p>
            <p className="text-3xl font-bold text-green-700">
              {parseFloat(calculation.zakat_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xl">{t('currency')}</span>
            </p>
            {calculation.below_nisab && (
              <p className="text-sm text-amber-700 font-medium mt-2">{t('below_nisab')}</p>
            )}
          </div>
        </div>
      </div>

      {calculation.rules_used && calculation.rules_used.length > 0 && (
        <div className="mb-6">
          <RulesUsedSection rules={calculation.rules_used} />
        </div>
      )}

      <ZakatResultTable items={calculation.items} />
    </div>
  );
}
