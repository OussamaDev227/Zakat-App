/**
 * Date and number formatters using current i18n language.
 * - Dates: Arabic/French dd/mm/yyyy style, English mm/dd/yyyy
 * - Numbers: locale-appropriate decimal and grouping
 */

import i18n from '../i18n';

const LOCALE_MAP = { ar: 'ar-DZ', fr: 'fr-FR', en: 'en-US' };

function getLocale() {
  const lng = (i18n.language || 'ar').split('-')[0];
  return LOCALE_MAP[lng] || LOCALE_MAP.ar;
}

/**
 * Format a date for display (short: day/month/year or month/day/year by locale).
 */
export function formatDate(date, options = {}) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const locale = getLocale();
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  return d.toLocaleDateString(locale, defaultOptions);
}

/**
 * Format a date with time.
 */
export function formatDateTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const locale = getLocale();
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a number for display (amounts, decimals).
 */
export function formatNumber(value, options = {}) {
  if (value == null || value === '') return '';
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (Number.isNaN(num)) return '';
  const locale = getLocale();
  const defaultOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  };
  return num.toLocaleString(locale, defaultOptions);
}
