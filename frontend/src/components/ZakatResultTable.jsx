/**
 * Zakat Result Table Component
 *
 * Displays zakat calculation results with rule explanations
 */

import { useTranslation } from 'react-i18next';
import { getRuleCodeArabic } from '../utils/ruleCodeTranslations';

export default function ZakatResultTable({ items }) {
  const { t } = useTranslation();

  if (!items || items.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-700 font-medium">{t('no_results')}</p>
      </div>
    );
  }

  // Check if any item has rule_code to decide whether to show the column
  const hasRuleCode = items.some(item => item.rule_code);

  return (
    <div className="card border-2 border-blue-200">
      <h3 className="text-xl font-bold mb-6 text-gray-900">{t('financial_items_detail')}</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>{t('item_name')}</th>
              <th>{t('entered_amount')}</th>
              <th>{t('included_amount')}</th>
              <th>{t('classification')}</th>
              {hasRuleCode && <th>{t('rule_code')}</th>}
              <th>{t('reason_from_rule')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-blue-50">
                <td className="font-bold text-gray-900">{item.item_name}</td>
                <td className="font-semibold text-gray-800">
                  {parseFloat(item.included_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-blue-700">{t('currency')}</span>
                </td>
                <td className={item.included ? 'font-bold text-green-700 text-lg' : 'font-semibold text-gray-400'}>
                  {item.included
                    ? (
                        <>
                          {parseFloat(item.included_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-green-600">{t('currency')}</span>
                        </>
                      )
                    : `0.00 ${t('currency')}`}
                </td>
                <td>
                  <span className={`badge ${
                    item.included ? 'badge-success' : (item.hawl_passed === false ? 'badge-warning' : 'badge-danger')
                  }`}>
                    {item.included ? t('zakatable') : (item.hawl_passed === false ? t('hawl_not_passed') : t('not_zakatable'))}
                  </span>
                </td>
                {hasRuleCode && (
                  <td className="text-sm font-semibold text-purple-700">
                    {(() => {
                      const codeKey = `rule_${item.rule_code}`;
                      const translated = t(codeKey);
                      return translated && translated !== codeKey
                        ? translated
                        : getRuleCodeArabic(item.rule_code);
                    })()}
                  </td>
                )}
                <td className="text-sm font-medium text-gray-800 max-w-md leading-relaxed">
                  {item.explanation_ar}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
