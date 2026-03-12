/**
 * i18n initialization for Zakat App
 * Supports: ar (default, RTL), fr (LTR), en (LTR)
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ar from './ar.json';
import fr from './fr.json';
import en from './en.json';

const SUPPORTED_LANGS = ['ar', 'fr', 'en'];

function applyDirection(lng) {
  const lang = SUPPORTED_LANGS.includes(lng) ? lng : 'ar';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }
  try {
    localStorage.setItem('lang', lang);
  } catch (_) {}
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      fr: { translation: fr },
      en: { translation: en },
    },
    lng: 'ar',
    fallbackLng: 'ar',
    supportedLngs: SUPPORTED_LANGS,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'lang',
    },
  });

// Apply RTL/LTR on initial load
const initialLng = i18n.language || 'ar';
const normalized = SUPPORTED_LANGS.includes(initialLng) ? initialLng : 'ar';
applyDirection(normalized);

// Apply whenever language changes
i18n.on('languageChanged', (lng) => {
  applyDirection(lng);
});

export default i18n;
export { applyDirection, SUPPORTED_LANGS };
