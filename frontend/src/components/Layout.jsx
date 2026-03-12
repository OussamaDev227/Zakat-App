/**
 * Layout Component
 * 
 * Main app layout with RTL/LTR support, header, navigation, and language switcher
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCompany } from '../contexts/CompanyContext';
import { getPrimaryReference } from '../config/academicReferences';
import { updateCompanyLanguage } from '../api/companies';
import FlagIcon from './FlagIcon';

const LANG_OPTIONS = [
  { code: 'ar', labelKey: 'lang_ar_name' },
  { code: 'fr', labelKey: 'lang_fr_name' },
  { code: 'en', labelKey: 'lang_en_name' },
];

export default function Layout({ children }) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { activeCompany, setActiveCompany } = useCompany();
  const primaryRef = getPrimaryReference();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef(null);
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const currentLangCode = i18n.language?.startsWith('ar')
    ? 'ar'
    : i18n.language?.startsWith('fr')
    ? 'fr'
    : 'en';

  const currentFlag = <FlagIcon langCode={currentLangCode} size={24} />;
  const currentLangLabelKey =
    LANG_OPTIONS.find((opt) => opt.code === currentLangCode)?.labelKey || 'lang_en_name';

  useEffect(() => {
    function handleClickOutside(e) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) setLangDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { path: '/companies', labelKey: 'nav_companies' },
    { path: '/financial-items', labelKey: 'nav_financial_items' },
    { path: '/zakat', labelKey: 'nav_zakat' },
    { path: '/history', labelKey: 'nav_history' },
    { path: '/about-methodology', labelKey: 'nav_methodology' },
  ];

  async function handleLanguageChange(lang) {
    setLangDropdownOpen(false);
    i18n.changeLanguage(lang);
    if (activeCompany?.id) {
      try {
        await updateCompanyLanguage(activeCompany.id, lang);
        setActiveCompany({ ...activeCompany, language: lang });
      } catch (err) {
        console.error('Failed to persist company language:', err);
      }
    }
  }

  return (
    <div className="min-h-screen" dir={dir}>
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-800 shadow-xl border-b-4 border-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-between items-center min-h-[5rem] py-3 gap-3">
            <div className="flex items-center flex-wrap gap-2 sm:gap-4 md:gap-8">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white drop-shadow-md">
                {t('app_title')}
              </h1>
              <p className="hidden sm:block text-xs sm:text-sm text-blue-100 font-semibold">{t('app_subtitle')}</p>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              {/* Language switcher */}
              <div className="relative" ref={langDropdownRef}>
                <button
                  type="button"
                  onClick={() => setLangDropdownOpen((o) => !o)}
                  className="flex items-center justify-center rounded-lg bg-white/10 border border-white/20 px-2 py-1.5 min-w-[2.75rem] h-9 hover:bg-white/20 focus:ring-2 focus:ring-white/50 focus:outline-none"
                  aria-label={t('language')}
                  title={t('language')}
                >
                  <span className="flex items-center gap-2">
                    {currentFlag}
                    <span className="hidden sm:inline text-xs sm:text-sm text-white font-semibold">
                      {t(currentLangLabelKey)}
                    </span>
                  </span>
                </button>
                {langDropdownOpen && (
                  <div
                    className="absolute top-full mt-1 end-0 rounded-lg bg-white shadow-lg border border-gray-200 py-1 z-50 min-w-[3rem]"
                    role="listbox"
                    aria-label={t('language')}
                  >
                    {LANG_OPTIONS.map((opt) => (
                      <button
                        key={opt.code}
                        type="button"
                        role="option"
                        aria-selected={opt.code === currentLangCode}
                        aria-label={t(opt.labelKey)}
                        onClick={() => handleLanguageChange(opt.code)}
                        className={`w-full px-3 py-2 flex items-center justify-start gap-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none first:rounded-t-lg last:rounded-b-lg ${
                          opt.code === currentLangCode ? 'bg-blue-50 font-semibold' : ''
                        }`}
                      >
                        <FlagIcon langCode={opt.code} size={24} />
                        <span className="text-sm">{t(opt.labelKey)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {activeCompany && (
                <>
                  <div className="bg-white/20 backdrop-blur-sm px-3 sm:px-5 py-2 sm:py-3 rounded-xl border-2 border-white/30 shadow-lg max-w-full sm:max-w-none">
                    <p className="text-xs sm:text-sm text-white font-semibold whitespace-nowrap">
                      <span className="font-bold hidden sm:inline">{t('active_company')}</span>
                      <span className="font-bold sm:hidden">{t('active_company_short')}</span>{' '}
                      <span className="text-yellow-200 font-bold truncate block sm:inline max-w-[150px] sm:max-w-none">
                        {activeCompany.name}
                      </span>
                    </p>
                  </div>
                  <Link
                    to="/companies"
                    className="text-xs sm:text-sm text-white font-bold underline hover:text-yellow-200"
                  >
                    {t('switch_company')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-md border-b-2 border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          <div className="md:hidden py-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center gap-2 text-gray-700 font-bold hover:text-blue-700"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
              <span>{t('menu')}</span>
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex space-x-1 space-x-reverse">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 lg:px-5 py-4 text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? 'text-blue-700 border-b-4 border-blue-700 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50 hover:border-b-4 hover:border-gray-300'
                  }`}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>

          {/* Mobile navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 text-sm font-bold transition-all duration-200 border-b border-gray-100 ${
                      isActive
                        ? 'text-blue-700 bg-blue-50 nav-item-active'
                        : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'
                    }`}
                  >
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {children}
      </main>

      {/* Academic reference footer (minimal, neutral) */}
      {primaryRef && (
        <footer className="border-t border-gray-200 bg-gray-50 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-gray-700">
            <div className="text-right">
              <p className="font-semibold">
                {primaryRef.titleAr}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                {primaryRef.author} · {primaryRef.university} · {primaryRef.year}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                {primaryRef.text.badgeLabelAr}
              </span>
              <Link
                to="/about-methodology"
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 underline decoration-dotted"
              >
                {t('learn_more_methodology')}
              </Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
