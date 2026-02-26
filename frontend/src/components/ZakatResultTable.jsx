/**
 * Zakat Result Table Component
 * 
 * Displays zakat calculation results with rule explanations
 * 
 * Decision Support Note:
 * This component displays ONLY what the backend rule engine decided.
 * - included: whether the item is zakatable (from backend)
 * - explanation_ar: the Arabic explanation from the rule engine
 * - rule_code: the code of the rule applied (for transparency)
 * The frontend does NOT interpret or modify these decisions.
 */

import { getRuleCodeArabic } from '../utils/ruleCodeTranslations';

export default function ZakatResultTable({ items }) {
  if (!items || items.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-700 font-medium">لا توجد نتائج</p>
      </div>
    );
  }

  // Check if any item has rule_code to decide whether to show the column
  const hasRuleCode = items.some(item => item.rule_code);

  return (
    <div className="card border-2 border-blue-200">
      <h3 className="text-xl font-bold mb-6 text-gray-900">تفاصيل البنود المالية</h3>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>اسم البند</th>
              <th>المبلغ المدخل</th>
              <th>المبلغ المدرج</th>
              <th>التصنيف</th>
              {hasRuleCode && <th>رمز القاعدة</th>}
              <th>السبب (من قاعدة الزكاة)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-blue-50">
                <td className="font-bold text-gray-900">{item.item_name}</td>
                <td className="font-semibold text-gray-800">
                  {parseFloat(item.included_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-blue-700">د.ج</span>
                </td>
                <td className={item.included ? 'font-bold text-green-700 text-lg' : 'font-semibold text-gray-400'}>
                  {item.included
                    ? (
                        <>
                          {parseFloat(item.included_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-green-600">د.ج</span>
                        </>
                      )
                    : '0.00 د.ج'}
                </td>
                <td>
                  <span className={`badge ${
                    item.included ? 'badge-success' : (item.hawl_passed === false ? 'badge-warning' : 'badge-danger')
                  }`}>
                    {item.included ? 'زكوي' : (item.hawl_passed === false ? 'لم يمر عليه الحول' : 'غير زكوي')}
                  </span>
                </td>
                {hasRuleCode && (
                  <td className="text-sm font-semibold text-purple-700">
                    {getRuleCodeArabic(item.rule_code)}
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
