/**
 * Financial Items Table Component
 *
 * Displays list of financial items for the active company.
 * Highlights rows that have duplicate/similar names (normalized) for merge awareness.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRules } from '../contexts/RulesContext';

function normalizeName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function FinancialItemsTable({ items, onEdit, onDelete }) {
  const { t } = useTranslation();
  const { rules } = useRules();

  const duplicateIds = useMemo(() => {
    const byNormalized = new Map();
    for (const item of items) {
      const n = normalizeName(item.name);
      if (!n) continue;
      if (!byNormalized.has(n)) byNormalized.set(n, []);
      byNormalized.get(n).push(item.id);
    }
    const ids = new Set();
    for (const idsList of byNormalized.values()) {
      if (idsList.length > 1) idsList.forEach((id) => ids.add(id));
    }
    return ids;
  }, [items]);

  // Helper: resolve type code to localized label (uses i18n rule_* keys when available)
  const getTypeLabel = (item) => {
    // Prefer i18n translations based on rule_* keys so labels follow UI language
    let code = null;
    if (item.category === 'ASSET') {
      code = item.asset_type;
      if (!code) return item.accounting_label || '';
    } else if (item.category === 'EQUITY') {
      code = item.equity_code;
      if (!code) return '';
    } else {
      code = item.liability_code;
      if (!code) return '';
    }

    const i18nKey = `rule_${code}`;
    const translated = t(i18nKey);
    // If a translation exists (i18next returns the key unchanged when missing), use it
    if (translated && translated !== i18nKey) {
      return translated;
    }

    // Fallback to rules metadata (typically Arabic labels from backend)
    if (rules) {
      if (item.category === 'ASSET') {
        const asset = rules.assets?.find((a) => a.code === code);
        if (asset?.label_ar) return asset.label_ar;
      } else if (item.category === 'EQUITY') {
        const eq = rules.equity?.find((e) => e.code === code);
        if (eq?.label_ar) return eq.label_ar;
      } else {
        const liability = rules.liabilities?.find((l) => l.code === code);
        if (liability?.label_ar) return liability.label_ar;
      }
    }

    // Last resort: show raw code
    return code || '';
  };
  if (items.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-700 font-medium">{t('no_financial_items')}</p>
      </div>
    );
  }

  return (
    <div className="card border-2 border-blue-100">
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t('table_name')}</th>
              <th>{t('table_category')}</th>
              <th>{t('table_type')}</th>
              <th>{t('table_amount')}</th>
              <th>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className={duplicateIds.has(item.id) ? 'bg-amber-50 border-l-4 border-l-amber-400' : ''}
                title={duplicateIds.has(item.id) ? t('similar_name_hint') : undefined}
              >
                <td className="font-bold text-gray-900">
                  {item.name}
                </td>
                <td>
                  <span className={`badge ${
                    item.category === 'ASSET' ? 'badge-info' :
                    item.category === 'EQUITY' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {                    item.category === 'ASSET' ? t('category_asset') :
                     item.category === 'EQUITY' ? t('category_equity') : t('category_liability')}
                  </span>
                </td>
                <td className="text-sm font-semibold text-gray-700" dir="rtl">
                  {getTypeLabel(item)}
                </td>
                <td className="font-bold text-gray-900">
                  {parseFloat(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-blue-700">{t('currency')}</span>
                </td>
                <td>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end items-end sm:items-center">
                    <button
                      onClick={() => onEdit(item)}
                      className="text-blue-700 hover:text-blue-900 text-xs sm:text-sm font-bold hover:underline whitespace-nowrap min-h-[44px] sm:min-h-0 flex items-center justify-center px-2 sm:px-0"
                    >
                      {t('edit')}
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="text-red-700 hover:text-red-900 text-xs sm:text-sm font-bold hover:underline whitespace-nowrap min-h-[44px] sm:min-h-0 flex items-center justify-center px-2 sm:px-0"
                    >
                      {t('delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
