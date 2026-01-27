/**
 * Layout Component
 * 
 * Main app layout with RTL support, header, and navigation
 */

import { Link, useLocation } from 'react-router-dom';
import { useCompany } from '../contexts/CompanyContext';
import { getPrimaryReference } from '../config/academicReferences';

export default function Layout({ children }) {
  const location = useLocation();
  const { activeCompany } = useCompany();
  const primaryRef = getPrimaryReference();

  const navItems = [
    { path: '/companies', label: 'الشركات', labelEn: 'Companies' },
    { path: '/financial-items', label: 'البنود المالية', labelEn: 'Financial Items' },
    { path: '/zakat', label: 'حساب الزكاة', labelEn: 'Zakat Calculation' },
    { path: '/history', label: 'سجل الحسابات', labelEn: 'History' },
    { path: '/about-methodology', label: 'المرجعية والمنهجية', labelEn: 'Methodology' },
  ];

  return (
    <div className="min-h-screen" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-800 shadow-xl border-b-4 border-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-8 space-x-reverse">
              <h1 className="text-2xl font-bold text-white drop-shadow-md">
                نظام دعم القرار لحساب زكاة الشركات
              </h1>
              <p className="text-sm text-blue-100 font-semibold">Decision Support System for Corporate Zakat</p>
            </div>
            
            {activeCompany && (
              <div className="bg-white/20 backdrop-blur-sm px-5 py-3 rounded-xl border-2 border-white/30 shadow-lg">
                <p className="text-sm text-white font-semibold">
                  <span className="font-bold">الشركة النشطة:</span>{' '}
                  <span className="text-yellow-200 font-bold">
                    {/* #region agent log */}
                    {(()=>{fetch('http://127.0.0.1:7243/ingest/36bf502b-a8b0-4651-80f5-b666e22bc1b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Layout.jsx:38',message:'Rendering company name',data:{companyName:activeCompany.name,companyNameLength:activeCompany.name?.length,firstChar:activeCompany.name?.[0],firstCharCode:activeCompany.name?.[0]?.charCodeAt?.(0),isString:typeof activeCompany.name==='string'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});return activeCompany.name;})()}
                    {/* #endregion */}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-md border-b-2 border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 space-x-reverse">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-5 py-4 text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? 'text-blue-700 border-b-4 border-blue-700 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50 hover:border-b-4 hover:border-gray-300'
                  }`}
                >
                  {item.label}
                  <span className="text-xs text-gray-600 mr-2 font-normal">({item.labelEn})</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
                معرفة المزيد عن المرجعية العلمية
              </Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
