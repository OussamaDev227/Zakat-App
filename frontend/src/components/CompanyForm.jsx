/**
 * Company Form Component
 *
 * Create/Edit company form with fiscal year validation (start < end).
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export default function CompanyForm({ company = null, onSubmit, onCancel }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: company?.name || '',
    legal_type: company?.legal_type || 'LLC',
    fiscal_year_start: company?.fiscal_year_start || '',
    fiscal_year_end: company?.fiscal_year_end || '',
    zakat_nisab_value: company?.zakat_nisab_value != null ? String(company.zakat_nisab_value) : '',
    password: '',
  });

  const fiscalYearError = useMemo(() => {
    if (!formData.fiscal_year_start || !formData.fiscal_year_end) return null;
    const start = new Date(formData.fiscal_year_start);
    const end = new Date(formData.fiscal_year_end);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    if (start >= end) return t('fiscal_year_error');
    return null;
  }, [formData.fiscal_year_start, formData.fiscal_year_end, t]);

  const isFormValid = useMemo(() => {
    const nameOk = (formData.name || '').trim().length > 0;
    const datesOk = !!formData.fiscal_year_start && !!formData.fiscal_year_end && !fiscalYearError;
    return nameOk && datesOk;
  }, [formData.name, formData.fiscal_year_start, formData.fiscal_year_end, fiscalYearError]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid || fiscalYearError) return;
    const toSubmit = { ...formData };
    if (!(toSubmit.password || '').trim()) delete toSubmit.password;
    else toSubmit.password = toSubmit.password.trim();
    if ((toSubmit.zakat_nisab_value || '').trim() === '') toSubmit.zakat_nisab_value = null;
    else toSubmit.zakat_nisab_value = parseFloat(toSubmit.zakat_nisab_value);
    if (Number.isNaN(toSubmit.zakat_nisab_value)) toSubmit.zakat_nisab_value = null;
    onSubmit(toSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="card w-full max-w-2xl border-2 border-blue-200 shadow-xl">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">
        {company ? t('edit_company') : t('add_company_new')}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            {t('company_name')} *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-field"
            placeholder={t('company_name_placeholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            {t('company_type')} *
          </label>
          <select
            required
            value={formData.legal_type}
            onChange={(e) => setFormData({ ...formData, legal_type: e.target.value })}
            className="input-field"
          >
            <option value="LLC">{t('legal_type_llc_option')}</option>
            <option value="SOLE_PROPRIETORSHIP">{t('legal_type_sole_option')}</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              {t('financial_year_start')} *
            </label>
            <input
              type="date"
              required
              value={formData.fiscal_year_start}
              onChange={(e) => setFormData({ ...formData, fiscal_year_start: e.target.value })}
              className={`input-field ${fiscalYearError ? 'border-red-500' : ''}`}
              aria-invalid={!!fiscalYearError}
              aria-describedby={fiscalYearError ? 'fiscal-year-error' : undefined}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              {t('financial_year_end')} *
            </label>
            <input
              type="date"
              required
              value={formData.fiscal_year_end}
              onChange={(e) => setFormData({ ...formData, fiscal_year_end: e.target.value })}
              className={`input-field ${fiscalYearError ? 'border-red-500' : ''}`}
              aria-invalid={!!fiscalYearError}
              aria-describedby={fiscalYearError ? 'fiscal-year-error' : undefined}
            />
          </div>
        </div>
        {fiscalYearError && (
          <p id="fiscal-year-error" className="text-red-600 text-sm font-medium" role="alert">
            {fiscalYearError}
          </p>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            {t('nisab_value')}
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.zakat_nisab_value}
            onChange={(e) => setFormData({ ...formData, zakat_nisab_value: e.target.value })}
            className="input-field"
            placeholder={t('nisab_placeholder')}
          />
          <p className="text-xs text-gray-600 mt-1">{t('nisab_help')}</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            {t('company_password_optional')}
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="input-field"
            placeholder={company ? t('password_placeholder_edit') : t('password_placeholder_new')}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
          <button type="button" onClick={onCancel} className="btn-secondary w-full sm:w-auto order-2 sm:order-1">
            {t('cancel')}
          </button>
          <button
            type="submit"
            className="btn-primary w-full sm:w-auto order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isFormValid}
          >
            {company ? t('save_edits') : t('add')}
          </button>
        </div>
      </div>
    </form>
  );
}
