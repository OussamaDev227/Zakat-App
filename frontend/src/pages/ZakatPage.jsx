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
import { useCompany } from '../contexts/CompanyContext';
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
      alert('لا يمكن إتمام الحساب بدون بنود مالية');
      return;
    }

    if (!confirm('هل أنت متأكد من إتمام هذا الحساب؟ لن يمكنك تعديله بعد الإتمام.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const finalized = await finalizeCalculation(calculation.calculation_id);
      setCalculation(finalized);
      alert('تم إتمام الحساب بنجاح');
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
      alert('تم إنشاء نسخة جديدة من الحساب');
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

    if (!confirm('هل أنت متأكد من حذف هذا البند من الحساب؟')) {
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
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Find the item to get its details
      const item = calculation.items.find(i => i.item_id === editingAmountItem.id);
      if (!item) {
        throw new Error('البند غير موجود');
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
      alert(`خطأ في إنشاء ملف PDF: ${err.message}`);
      console.error('PDF generation error:', err);
    } finally {
      setGeneratingPDF(false);
    }
  }

  // Format fiscal year
  function formatFiscalYear(start, end) {
    if (!start || !end) return 'غير محدد';
    const startYear = new Date(start).getFullYear();
    const endYear = new Date(end).getFullYear();
    return `${startYear} - ${endYear}`;
  }

  // Format company type
  function formatCompanyType(type) {
    if (!type) return 'غير محدد';
    return type === 'LLC' ? 'شركة ذات مسؤولية محدودة' : 'مؤسسة فردية';
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">حساب الزكاة</h1>
          <p className="text-gray-600">إدارة حسابات الزكاة للشركة</p>
        </div>
        <CompanySelector />
        <div className="card text-center py-8">
          <p className="text-gray-700 font-medium">يرجى اختيار شركة لحساب الزكاة</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">حساب الزكاة</h1>
        <p className="text-sm sm:text-base text-gray-600">إدارة حسابات الزكاة للشركة بناءً على القواعد الشرعية المطبقة</p>
        <p className="mt-2 text-xs sm:text-sm text-gray-500">
          لمزيد من التفاصيل حول الإطار التصوري والقواعد المحاسبية المستعملة في هذا الحساب، يمكنك مراجعة صفحة{' '}
          <Link
            to="/about-methodology#rules"
            className="text-blue-700 hover:text-blue-900 underline decoration-dotted"
          >
            القواعد والمنهجية المعتمدة
          </Link>
          .
        </p>
      </div>

      <CompanySelector />

      {loading && !calculation && (
        <div className="card text-center py-8">
          <p className="text-gray-700 font-medium">جاري التحميل...</p>
        </div>
      )}

      {error && (
        <div className="card bg-red-50 border-2 border-red-300 shadow-lg mb-6">
          <p className="text-red-900 font-bold text-lg">خطأ: {error}</p>
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
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">اسم الشركة:</h2>
                    <span className="text-blue-700 text-lg sm:text-xl break-words">{calculation.company_name || activeCompany.name}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">نوع الشركة:</h2>
                    <span className="text-gray-700">{formatCompanyType(calculation.company_type)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">السنة المالية:</h2>
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
                {isDraft && (
                  <>
                    <button
                      onClick={handleRecalculate}
                      disabled={loading || calculation.items.length === 0}
                      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      إعادة الحساب
                    </button>
                    <button
                      onClick={handleFinalize}
                      disabled={loading || calculation.items.length === 0}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      إتمام الحساب
                    </button>
                  </>
                )}
                {isFinalized && (
                  <button
                    onClick={handleCreateRevision}
                    disabled={loading}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    إنشاء نسخة جديدة
                  </button>
                )}
                {false && (
                  <button
                    onClick={handleGeneratePDF}
                    disabled={generatingPDF}
                    className={`btn-secondary w-full sm:w-auto ${generatingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="تحميل تقرير PDF"
                  >
                    {generatingPDF ? 'جاري الإنشاء...' : '📄 إنشاء تقرير PDF'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: Items Included in This Calculation */}
          <div className="card border-2 border-blue-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">البنود المدرجة في هذا الحساب</h2>
              {isDraft && (
                <button
                  onClick={() => setShowItemSelector(true)}
                  className="btn-primary w-full sm:w-auto text-sm sm:text-base"
                >
                  ➕ إضافة بند مالي موجود
                </button>
              )}
            </div>

            {calculation.items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-700 font-medium mb-4">
                  لا توجد بنود مالية في هذا الحساب
                </p>
                {isDraft && (
                  <button
                    onClick={() => setShowItemSelector(true)}
                    className="btn-primary"
                  >
                    ➕ إضافة بند مالي موجود
                  </button>
                )}
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>اسم البند</th>
                      <th>الفئة</th>
                      <th>المبلغ</th>
                      <th>زكوي؟</th>
                      <th>رمز القاعدة</th>
                      {isDraft && <th>الإجراءات</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {calculation.items.map((item, index) => (
                      <tr key={item.item_id || index}>
                        <td className="font-bold text-gray-900">{item.item_name}</td>
                        <td>
                          <span className="badge">
                            {item.category === 'ASSET' ? 'أصل' : 'التزام'}
                          </span>
                        </td>
                        <td className="font-semibold text-gray-800">
                          {parseFloat(item.original_amount || item.included_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-blue-700">د.ج</span>
                        </td>
                        <td>
                          <span className={`badge ${
                            item.included ? 'badge-success' : (item.hawl_passed === false ? 'badge-warning' : 'badge-danger')
                          }`}>
                            {item.included ? 'زكوي' : (item.hawl_passed === false ? 'لم يمر عليه الحول' : 'غير زكوي')}
                          </span>
                        </td>
                        <td className="text-sm font-semibold text-purple-700">
                          {getRuleCodeArabic(item.rule_code)}
                        </td>
                        {isDraft && (
                          <td>
                            <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
                              <button
                                onClick={() => handleEditAmount(item.item_id, item.original_amount || item.included_amount)}
                                className="text-blue-700 hover:text-blue-900 text-xs sm:text-sm font-bold hover:underline whitespace-nowrap min-h-[44px] sm:min-h-0 flex items-center justify-center px-2 sm:px-0"
                              >
                                تعديل المبلغ
                              </button>
                              <button
                                onClick={() => handleRemoveItem(item.item_id)}
                                className="text-red-700 hover:text-red-900 text-xs sm:text-sm font-bold hover:underline whitespace-nowrap min-h-[44px] sm:min-h-0 flex items-center justify-center px-2 sm:px-0"
                              >
                                حذف
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
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">اختر بند مالي لإضافته</h3>
                  <button
                    onClick={() => setShowItemSelector(false)}
                    className="text-gray-600 hover:text-gray-900 text-xl sm:text-2xl min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="إغلاق"
                  >
                    ✕
                  </button>
                </div>
                {availableItems.length === 0 ? (
                  <p className="text-gray-700 text-sm sm:text-base">لا توجد بنود مالية متاحة</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableItems.map(item => (
                      <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded border">
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-gray-900 text-sm sm:text-base block break-words">{item.name}</span>
                          <span className="text-xs sm:text-sm text-gray-600">
                            ({item.category === 'ASSET' ? 'أصل' : 'التزام'})
                          </span>
                        </div>
                        <button
                          onClick={() => handleLinkItem(item.id)}
                          className="btn-secondary text-xs sm:text-sm w-full sm:w-auto min-h-[44px] sm:min-h-0"
                        >
                          إضافة
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
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">تعديل المبلغ</h3>
                  <button
                    onClick={() => {
                      setEditingAmountItem(null);
                      setNewAmount('');
                    }}
                    className="text-gray-600 hover:text-gray-900 text-xl sm:text-2xl min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="إغلاق"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">المبلغ الجديد:</label>
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
                      حفظ
                    </button>
                    <button
                      onClick={() => {
                        setEditingAmountItem(null);
                        setNewAmount('');
                      }}
                      className="btn-secondary w-full sm:w-auto order-2 sm:order-2"
                    >
                      إلغاء
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
                ملخص حساب الزكاة
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white rounded-lg p-4 sm:p-5 border-2 border-green-200 shadow-md">
                  <p className="text-xs sm:text-sm text-gray-700 mb-2 font-semibold">إجمالي الأصول الزكوية</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-700">
                    {totalZakatableAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-lg sm:text-xl">د.ج</span>
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 sm:p-5 border-2 border-green-200 shadow-md">
                  <p className="text-xs sm:text-sm text-gray-700 mb-2 font-semibold">إجمالي الالتزامات القابلة للخصم</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-700">
                    {totalDeductibleLiabilities.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-lg sm:text-xl">د.ج</span>
                  </p>
                </div>
                {calculation.nisab_value != null && (
                  <div className="bg-white rounded-lg p-4 sm:p-5 border-2 border-green-200 shadow-md">
                    <p className="text-xs sm:text-sm text-gray-700 mb-2 font-semibold">قيمة النصاب</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-700">
                      {parseFloat(calculation.nisab_value).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-lg sm:text-xl">د.ج</span>
                    </p>
                  </div>
                )}
                {calculation.items_excluded_hawl > 0 && (
                  <div className="bg-white rounded-lg p-4 sm:p-5 border-2 border-amber-200 shadow-md">
                    <p className="text-xs sm:text-sm text-gray-700 mb-2 font-semibold">بنود مستبعدة (لم يمر عليها الحول)</p>
                    <p className="text-2xl sm:text-3xl font-bold text-amber-700">
                      {calculation.items_excluded_hawl}
                    </p>
                  </div>
                )}
                <div className="bg-white rounded-lg p-4 sm:p-5 border-2 border-green-200 shadow-md">
                  <p className="text-xs sm:text-sm text-gray-700 mb-2 font-semibold">وعاء الزكاة</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-700">
                    {parseFloat(calculation.zakat_base).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-lg sm:text-xl">د.ج</span>
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 sm:p-5 border-2 border-green-200 shadow-md">
                  <p className="text-xs sm:text-sm text-gray-700 mb-2 font-semibold">مبلغ الزكاة (2.5%)</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-700">
                    {parseFloat(calculation.zakat_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-lg sm:text-xl">د.ج</span>
                  </p>
                  {calculation.below_nisab && (
                    <p className="text-sm text-amber-700 font-medium mt-2">لا زكاة — دون النصاب</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: Applied Zakat Rules (Read-only) */}
          {calculation.rules_used && calculation.rules_used.length > 0 && (
            <div className="card border-2 border-purple-200">
              <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-900">القواعد المطبقة في هذا الحساب</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>رمز القاعدة</th>
                      <th>عنوان القاعدة</th>
                      <th>السبب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculation.rules_used.map((rule, index) => (
                      <tr key={rule.rule_code || index}>
                        <td className="font-semibold text-purple-700">{getRuleCodeArabic(rule.rule_code)}</td>
                        <td className="font-bold text-gray-900">{rule.label_ar}</td>
                        <td className="text-sm font-medium text-gray-800">{rule.reason_ar}</td>
                      </tr>
                    ))}
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
