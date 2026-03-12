/**
 * Rules Used Section Component
 *
 * Displays rules_used array in organized format
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getRuleCodeArabic } from '../utils/ruleCodeTranslations';

export default function RulesUsedSection({ rules }) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!rules || rules.length === 0) {
    return null;
  }

  const groupedRules = {
    ASSET: rules.filter(r => r.rule_type === 'ASSET'),
    LIABILITY: rules.filter(r => r.rule_type === 'LIABILITY'),
    EXTENDED: rules.filter(r => r.rule_type === 'EXTENDED'),
  };

  return (
    <div className="card border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center p-4 hover:bg-purple-100 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📋</span>
          <div className="text-end">
            <h3 className="text-lg font-bold text-gray-900">{t('rules_used_title')}</h3>
            <p className="text-sm text-gray-600">{t('rules_count', { count: rules.length })}</p>
          </div>
        </div>
        <span className="text-2xl text-purple-600">
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {groupedRules.ASSET.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-900 mb-2 text-sm">{t('assets')} ({groupedRules.ASSET.length})</h4>
              <div className="space-y-2">
                {groupedRules.ASSET.map((rule, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-blue-700 text-sm">{getRuleCodeArabic(rule.rule_code)}</span>
                      <span className="badge badge-info text-xs">{t('category_asset')}</span>
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">{rule.label_ar}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{rule.reason_ar}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {groupedRules.LIABILITY.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-900 mb-2 text-sm">{t('liabilities')} ({groupedRules.LIABILITY.length})</h4>
              <div className="space-y-2">
                {groupedRules.LIABILITY.map((rule, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 border border-red-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-red-700 text-sm">{getRuleCodeArabic(rule.rule_code)}</span>
                      <span className="badge badge-danger text-xs">{t('category_liability')}</span>
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">{rule.label_ar}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{rule.reason_ar}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {groupedRules.EXTENDED.length > 0 && (
            <div>
              <h4 className="font-bold text-gray-900 mb-2 text-sm">{t('extended_rules')} ({groupedRules.EXTENDED.length})</h4>
              <div className="space-y-2">
                {groupedRules.EXTENDED.map((rule, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 border border-purple-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-purple-700 text-sm">{getRuleCodeArabic(rule.rule_code)}</span>
                      <span className="badge bg-purple-100 text-purple-800 text-xs">{t('extended')}</span>
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">{rule.label_ar}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{rule.reason_ar}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
