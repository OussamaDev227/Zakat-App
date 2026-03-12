/**
 * Modal to enter company password (for select or switch company).
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PasswordInput from './PasswordInput';

export default function CompanyPasswordModal({
  companyName,
  onConfirm,
  onCancel,
  loading = false,
  error = null,
}) {
  const { t, i18n } = useTranslation();
  const [password, setPassword] = useState('');
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  function handleSubmit(e) {
    e.preventDefault();
    onConfirm(password);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir={dir}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border-2 border-blue-200">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('company_password_title')}</h2>
        <p className="text-gray-600 mb-4">
          {t('enter_password_for_company', { name: companyName })}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">{t('password_label')}</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('password_placeholder')}
              autoFocus
              required
              disabled={loading}
            />
          </div>
          {error && (
            <p className="text-red-600 text-sm font-semibold mb-3">{error}</p>
          )}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="btn-primary px-4 py-2"
              disabled={loading || !password.trim()}
            >
              {loading ? t('verifying') : t('enter')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
