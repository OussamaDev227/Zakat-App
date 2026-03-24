/**
 * Zakat Calculation Page - Refactored
 * 
 * Core working page for zakat calculations with 4 sections:
 * 1. Calculation Header (read-only)
 * 2. Items Included in This Calculation
 * 3. Zakat Calculation Summary (auto-generated)
 * 4. Applied Zakat Rules (read-only)
 * 
 * IMPORTANT:
 * - Calculation Tab is the CORE working page
 * - History is only a selector of past calculations
 * - Financial Items are definitions, not calculations
 * - Arabic is the main language
 * - RTL layout is mandatory
 */

import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import {
  startCalculation,
  getCalculation,
  recalculateCalculation,
  finalizeCalculation,
  removeItemFromCalculation,
  linkItemToCalculation,
  createRevision,
} from '../api/zakat';
import { getFinancialItems } from '../api/financialItems';
import CalculationStatusBadge from '../components/CalculationStatusBadge';
import CompanySelector from '../components/CompanySelector';
import { getRuleCodeArabic } from '../utils/ruleCodeTranslations';
import { generateZakatReportPDF } from '../utils/pdfGenerator';

export default function ZakatPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const { activeCompany } = useCompany();
  const [searchParams, setSearchParams] = useSearchParams();
  const [calculation, setCalculation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableItems, setAvailableItems] = useState([]);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [editingAmountItem, setEditingAmountItem] = useState(null);
  const [newAmount, setNewAmount] = useState('');
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const calculationId = searchParams.get('calculation_id');
  const isDraft = calculation?.status === 'DRAFT';
  const isFinalized = calculation?.status === 'FINALIZED';
  const canRunCalculations = hasPermission('runZakatCalculations');

  // Load calculation when calculation_id changes or company changes
  useEffect(() => {
    if (calculationId) {
      loadCalculation(parseInt(calculationId));
    } else if (activeCompany) {
      loadOrStartDraft();
    } else {
      setCalculation(null);
    }
  }, [calculationId, activeCompany]);

  // Load available financial items when showing selector
  useEffect(() => {
    if (showItemSelector && activeCompany && calculation) {
      loadAvailableItems();
    }
  }, [showItemSelector, activeCompany, calculation]);

  async function loadCalculation(id) {
    try {
      setLoading(true);
      setError(null);
      const data = await getCalculation(id);
      setCalculation(data);
      // Update active company if needed
      if (data.company_id && (!activeCompany || activeCompany.id !== data.company_id)) {
        // Company context should handle this, but we ensure consistency
      }
    } catch (err) {
      setError(err.message);
      setCalculation(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadOrStartDraft() {
    if (!activeCompany) return;

    try {
      setLoading(true);
      setError(null);
      const data = await startCalculation();
      setCalculation(data);
      // Update URL to include calculation_id
      setSearchParams({ calculation_id: data.calculation_id.toString() });
    } catch (err) {
      setError(err.message);
      setCalculation(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableItems() {
    if (!activeCompany) return;

    try {
      const items = await getFinancialItems();
      // Filter out items already in this calculation
      const calculationItemIds = new Set(calculation.items.map(item => item.item_id).filter(Boolean));
      const available = items.filter(item => !calculationItemIds.has(item.id));
      setAvailableItems(available);
    } catch (err) {
      console.error('Failed to load available items:', err);
    }
  }

  async function handleRecalculate() {
    if (!calculation || !isDraft) return;

    try {
      setLoading(true);
      setError(null);
      const updated = await recalculateCalculation(calculation.calculation_id);
      setCalculation(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFinalize() {
    if (!calculation || !isDraft) return;
    if (calculation.items.length === 0) {
      alert(t('cannot_finalize_no_items'));
      return;
    }

    if (!confirm(t('confirm_finalize'))) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const finalized = await finalizeCalculation(calculation.calculation_id);
      setCalculation(finalized);
      alert(t('finalize_success'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRevision() {
    if (!calculation || !isFinalized) return;

    try {
      setLoading(true);
      setError(null);
      const newCalculation = await createRevision(calculation.calculation_id);
      setCalculation(newCalculation);
      setSearchParams({ calculation_id: newCalculation.calculation_id.toString() });
      alert(t('revision_created'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLinkItem(financialItemId, amount = null) {
    if (!calculation || !isDraft) return;

    try {
      setLoading(true);
      setError(null);
      const updated = await linkItemToCalculation(
        calculation.calculation_id,
        financialItemId,
        amount
      );
      setCalculation(updated);
      setShowItemSelector(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveItem(itemId) {
    if (!calculation || !isDraft) return;

    if (!confirm(t('confirm_remove_item'))) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const updated = await removeItemFromCalculation(calculation.calculation_id, itemId);
      setCalculation(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEditAmount(itemId, currentAmount) {
    if (!calculation || !isDraft) return;
    setEditingAmountItem({ id: itemId, amount: currentAmount });
    setNewAmount(currentAmount.toString());
  }

  async function handleSaveAmount() {
    if (!calculation || !isDraft || !editingAmountItem) return;

    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount < 0) {
      alert(t('enter_valid_amount'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Find the item to get its details
      const item = calculation.items.find(i => i.item_id === editingAmountItem.id);
      if (!item) {
        throw new Error(t('item_not_found'));
      }

      // Fetch full financial item details to get asset_type/liability_code
      const { getFinancialItem } = await import('../api/financialItems');
      const financialItem = await getFinancialItem(editingAmountItem.id);

      // Update the item using addItemToCalculation with item_id
      const { addItemToCalculation } = await import('../api/zakat');
      const updated = await addItemToCalculation(
        calculation.calculation_id,
        {
          name: financialItem.name,
          category: financialItem.category,
          asset_type: financialItem.asset_type || null,
          accounting_label: financialItem.accounting_label || null,
          liability_code: financialItem.liability_code || null,
          equity_code: financialItem.equity_code || null,
          amount: amount,
          acquisition_date: financialItem.acquisition_date || null,
          metadata: financialItem.metadata || {},
        },
        editingAmountItem.id
      );
      setCalculation(updated);
      setEditingAmountItem(null);
      setNewAmount('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePDF() {
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
  }

  // Format fiscal year
  function formatFiscalYear(start, end) {
    if (!start || !end) return t('date_unspecified');
    const startYear = new Date(start).getFullYear();
    const endYear = new Date(end).getFullYear();
    return `${startYear} - ${endYear}`;
  }

  // Format company type
  function formatCompanyType(type) {
    if (!type) return t('date_unspecified');
    return type === 'LLC' ? t('legal_type_llc') : t('legal_type_sole');
  }

  // Calculate totals
  const totalZakatableAssets = calculation?.items
    .filter(item => item.category === 'ASSET' && item.included)
    .reduce((sum, item) => sum + parseFloat(item.included_amount || 0), 0) || 0;

  const totalDeductibleLiabilities = calculation?.items
    .filter(item => item.category === 'LIABILITY' && item.included)
    .reduce((sum, item) => sum + parseFloat(item.included_amount || 0), 0) || 0;

  if (!activeCompany) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('zakat_calculation')}</h1>
          <p className="text-gray-600">{t('zakat_management_intro')}</p>
        </div>
        <CompanySelector />
        <div className="card text-center py-8">
          <p className="text-gray-700 font-medium">{t('select_company_for_zakat')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('zakat_calculation')}</h1>
        <p className="text-sm sm:text-base text-gray-600">{t('zakat_management_rules')}</p>
        <p className="mt-2 text-xs sm:text-sm text-gray-500">
          {t('methodology_link_intro')}{' '}
          <Link
            to="/about-methodology#rules"
            className="text-blue-700 hover:text-blue-900 underline decoration-dotted"
          >
            {t('methodology_link')}
          </Link>
          .
        </p>
      </div>

      <CompanySelector />

      {loading && !calculation && (
        <div className="card text-center py-8">
          <p className="text-gray-700 font-medium">{t('loading')}</p>
        </div>
      )}

      {error && (
        <div className="card bg-red-50 border-2 border-red-300 shadow-lg mb-6">
          <p className="text-red-900 font-bold text-lg">{t('error')}: {error}</p>
        </div>
      )}

      {calculation && (
        <div className="space-y-6">
          {/* SECTION 1: Calculation Header (Read-only) */}
          <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t('company_name_label')}</h2>
                    <span className="text-blue-700 text-lg sm:text-xl break-words">{calculation.company_name || activeCompany.name}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">{t('company_type_label')}</h2>
                    <span className="text-gray-700">{formatCompanyType(calculation.company_type)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">{t('fiscal_year_label')}</h2>
                    <span className="text-gray-700">
                      {formatFiscalYear(calculation.fiscal_year_start, calculation.fiscal_year_end)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-center">
                  <CalculationStatusBadge status={calculation.status} />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-4 border-t border-blue-300">
                {isDraft && canRunCalculations && (
                  <>
                    <button
                      onClick={handleRecalculate}
                      disabled={loading || calculation.items.length === 0}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      {t('recalculate')}
                    </button>
                    <button
                      onClick={handleFinalize}
                      disabled={loading || calculation.items.length === 0}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      {t('finalize_calculation')}
                    </button>
                  </>
                )}
                {isFinalized && canRunCalculations && (
                  <button
                    onClick={handleCreateRevision}
                    disabled={loading}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    {t('create_revision')}
                  </button>
                )}
                {false && (
                  <button
                    onClick={handleGeneratePDF}
                    disabled={generatingPDF}
                    className={`btn-secondary w-full sm:w-auto ${generatingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="تحميل تقرير PDF"
                  >
                    {generatingPDF ? t('generating_pdf') : `📄 ${t('generate_pdf')}`}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: Items Included in This Calculation */}
          <div className="card border-2 border-blue-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t('items_in_calculation')}</h2>
            {isDraft && canRunCalculations && (
              <button
                onClick={() => setShowItemSelector(true)}
                className="btn-primary w-full sm:w-auto text-sm sm:text-base"
              >
                ➕ {t('add_existing_item')}
              </button>
              )}
            </div>

            {calculation.items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-700 font-medium mb-4">
                  {t('no_items_in_calculation')}
                </p>
                {isDraft && canRunCalculations && (
                  <button
                    onClick={() => setShowItemSelector(true)}
                    className="btn-primary"
                  >
                    ➕ {t('add_existing_item')}
                  </button>
                )}
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                    <th>{t('item_name')}</th>
                    <th>{t('table_category')}</th>
                    <th>{t('table_amount')}</th>
                    <th>{t('zakatable_col')}</th>
                    <th>{t('rule_code')}</th>
                    {isDraft && canRunCalculations && <th>{t('actions')}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {calculation.items.map((item, index) => (
                      <tr key={item.item_id || index}>
                        <td className="font-bold text-gray-900">{item.item_name}</td>
                        <td>
                          <span className="badge">
                            {item.category === 'ASSET' ? t('category_asset') : t('category_liability')}
                          </span>
                        </td>
                        <td className="font-semibold text-gray-800">
                          {parseFloat(item.original_amount || item.included_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-blue-700">{t('currency')}</span>
                        </td>
                        <td>
                          <span className={`badge ${
                            item.included ? 'badge-success' : (item.hawl_passed === false ? 'badge-warning' : 'badge-danger')
                          }`}>
                            {item.included ? t('zakatable') : (item.hawl_passed === false ? t('hawl_not_passed') : t('not_zakatable'))}
                          </span>
                        </td>
                        <td className="text-sm font-semibold text-purple-700">
                          {t(`rule_${item.rule_code}`) !== `rule_${item.rule_code}` ? t(`rule_${item.rule_code}`) : getRuleCodeArabic(item.rule_code)}
                        </td>
                        {isDraft && canRunCalculations && (
                          <td>
                            <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
                              <button
                                onClick={() => handleEditAmount(item.item_id, item.original_amount || item.included_amount)}
                                className="text-blue-700 hover:text-blue-900 text-xs sm:text-sm font-bold hover:underline whitespace-nowrap min-h-[44px] sm:min-h-0 flex items-center justify-center px-2 sm:px-0"
                              >
                                {t('edit_amount')}
                              </button>
                              <button
                                onClick={() => handleRemoveItem(item.item_id)}
                                className="text-red-700 hover:text-red-900 text-xs sm:text-sm font-bold hover:underline whitespace-nowrap min-h-[44px] sm:min-h-0 flex items-center justify-center px-2 sm:px-0"
                              >
                                {t('delete')}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Item Selector Modal */}
            {showItemSelector && (
              <div className="mt-4 p-3 sm:p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">{t('choose_item_to_add')}</h3>
                  <button
                    onClick={() => setShowItemSelector(false)}
                    className="text-gray-600 hover:text-gray-900 text-xl sm:text-2xl min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label={t('close')}
                  >
                    ✕
                  </button>
                </div>
                {availableItems.length === 0 ? (
                  <p className="text-gray-700 text-sm sm:text-base">{t('no_available_items')}</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableItems.map(item => (
                      <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded border">
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-gray-900 text-sm sm:text-base block break-words">{item.name}</span>
                          <span className="text-xs sm:text-sm text-gray-600">
                            ({item.category === 'ASSET' ? t('category_asset') : t('category_liability')})
                          </span>
                        </div>
                        <button
                          onClick={() => handleLinkItem(item.id)}
                          className="btn-secondary text-xs sm:text-sm w-full sm:w-auto min-h-[44px] sm:min-h-0"
                        >
                          {t('add')}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Edit Amount Modal */}
            {editingAmountItem && (
              <div className="mt-4 p-3 sm:p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">{t('edit_amount')}</h3>
                  <button
                    onClick={() => {
                      setEditingAmountItem(null);
                      setNewAmount('');
                    }}
                    className="text-gray-600 hover:text-gray-900 text-xl sm:text-2xl min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label={t('close')}
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('new_amount_label')}</label>
                    <input
                      type="number"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[44px]"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                      onClick={handleSaveAmount}
                      className="btn-primary w-full sm:w-auto order-1 sm:order-1"
                      disabled={loading}
                    >
                      {t('save')}
                    </button>
                    <button
                      onClick={() => {
                        setEditingAmountItem(null);
                        setNewAmount('');
                      }}
                      className="btn-secondary w-full sm:w-auto order-2 sm:order-2"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: Zakat Calculation Summary (Auto-generated) */}
          {calculation.items.length > 0 && (
            <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-xl">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-green-900 flex items-center gap-2">
                <span className="text-2xl sm:text-3xl">✓</span>
                {t('zakat_summary')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white rounded-lg p-4 sm:p-5 border-2 border-green-200 shadow-md">
                  <p className="text-xs sm:text-sm text-gray-700 mb-2 font-semibold">{t('total_zakatable_assets')}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-700">
                    {totalZakatableAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-lg sm:text-xl">{t('currency')}</span>
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 sm:p-5 border-2 border-green-200 shadow-md">
                  <p className="text-xs sm:text-sm text-gray-700 mb-2 font-semibold">{t('total_deductible_liabilities')}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-700">
                    {totalDeductibleLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-lg sm:text-xl">{t('currency')}</span>
                  </p>
                </div>
                {calculation.nisab_value != null && (
                  <div className="bg-white rounded-lg p-4 sm:p-5 border-2 border-green-200 shadow-md">
                    <p className="text-xs sm:text-sm text-gray-700 mb-2 font-semibold">{t('nisab_value')}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-700">
                      {parseFloat(calculation.nisab_value).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-lg sm:text-xl">{t('currency')}</span>
                    </p>
                  </div>
                )}
                {calculation.items_excluded_hawl > 0 && (
                  <div className="bg-white rounded-lg p-4 sm:p-5 border-2 border-amber-200 shadow-md">
                    <p className="text-xs sm:text-sm text-gray-700 mb-2 font-semibold">{t('items_excluded_hawl')}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-amber-700">
                      {calculation.items_excluded_hawl}
                    </p>
                  </div>
                )}
                <div className="bg-white rounded-lg p-4 sm:p-5 border-2 border-green-200 shadow-md">
                  <p className="text-xs sm:text-sm text-gray-700 mb-2 font-semibold">{t('zakat_base')}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-700">
                    {parseFloat(calculation.zakat_base).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-lg sm:text-xl">{t('currency')}</span>
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 sm:p-5 border-2 border-green-200 shadow-md">
                  <p className="text-xs sm:text-sm text-gray-700 mb-2 font-semibold">{t('zakat_amount_2_5')}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-700">
                    {parseFloat(calculation.zakat_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-lg sm:text-xl">{t('currency')}</span>
                  </p>
                  {calculation.below_nisab && (
                    <p className="text-sm text-amber-700 font-medium mt-2">{t('below_nisab')}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: Applied Zakat Rules (Read-only) */}
          {calculation.rules_used && calculation.rules_used.length > 0 && (
            <div className="card border-2 border-purple-200">
              <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900">{t('applied_rules_section_title')}</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>{t('rule_code')}</th>
                      <th>{t('rule_title')}</th>
                      <th>{t('reason_from_rule')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculation.rules_used.map((rule, index) => {
                      const codeKey = `rule_${rule.rule_code}`;
                      const codeLabel = t(codeKey) !== codeKey ? t(codeKey) : (rule.label_ar || rule.rule_code);
                      return (
                        <tr key={rule.rule_code || index}>
                          <td className="font-semibold text-purple-700">{codeLabel}</td>
                          <td className="font-bold text-gray-900">{rule.label_ar}</td>
                          <td className="text-sm font-medium text-gray-800">{rule.reason_ar}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
