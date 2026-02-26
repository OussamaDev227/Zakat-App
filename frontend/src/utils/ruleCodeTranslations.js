/**
 * Rule Code Translations
 * 
 * Maps English rule codes to their Arabic labels for display purposes.
 * Based on zakat_rules_full_v1.json
 */

const ruleCodeToArabic = {
  // Asset codes
  'CASH': 'النقدية وما في حكمها',
  'TRADING_GOODS': 'عروض التجارة / البضاعة المعدة للبيع',
  'PRODUCTION_INVENTORY': 'المخزون الإنتاجي',
  'RECEIVABLE': 'الذمم المدينة',
  'FIXED_ASSET': 'الأصول الثابتة العينية',
  'INTANGIBLE_ASSET': 'الأصول المعنوية',
  'LONG_TERM_INVESTMENT': 'الاستثمارات طويلة الأجل',
  'INVENTORY': 'عروض التجارة / البضاعة المعدة للبيع',  // legacy
  
  // Liability codes
  'SHORT_TERM_LIABILITY': 'الخصوم قصيرة الأجل',
  'LONG_TERM_LIABILITY': 'الخصوم طويلة الأجل',
};

/**
 * Get Arabic label for a rule code
 * @param {string} ruleCode - The English rule code (e.g., 'FIXED_ASSET', 'INVENTORY')
 * @returns {string} The Arabic label, or the original code if not found
 */
export function getRuleCodeArabic(ruleCode) {
  if (!ruleCode) return '-';
  return ruleCodeToArabic[ruleCode] || ruleCode;
}

export default ruleCodeToArabic;
