/**
 * Financial Item Form Component
 *
 * Create/Edit financial item form with validation (amount >= 0, required fields).
 *
 * Asset types are strictly defined by zakat jurisprudence rules.
 * Asset classification is a jurisprudential constraint, not a user preference.
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import LocalizedDateInput from './LocalizedDateInput';
import { useRules } from '../contexts/RulesContext';
import { getAssetTypes } from '../api/lookups';

export default function FinancialItemForm({ item = null, onSubmit, onCancel, submitting = false }) {
  const { t } = useTranslation();
  const { rules } = useRules();
  const [assetTypes, setAssetTypes] = useState([]);
  const [loadingAssetTypes, setLoadingAssetTypes] = useState(true);
  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: item?.category || 'ASSET',
    asset_type: item?.asset_type || '',
    accounting_label: item?.accounting_label || '',
    liability_code: item?.liability_code ?? '',
    equity_code: item?.equity_code ?? '',
    amount: item?.amount ?? '',
    acquisition_date: item?.acquisition_date ?? '',
    metadata: item?.metadata || {},
  });

  // Load asset types from lookups endpoint
  useEffect(() => {
    async function loadAssetTypes() {
      if (formData.category === 'ASSET') {
        try {
          setLoadingAssetTypes(true);
          const types = await getAssetTypes();
          setAssetTypes(types);
        } catch (error) {
          console.error('Failed to load asset types:', error);
        } finally {
          setLoadingAssetTypes(false);
        }
      }
    }
    loadAssetTypes();
  }, [formData.category]);

  // Reset codes when category changes
  useEffect(() => {
    if (formData.category === 'ASSET') {
      setFormData(prev => ({ ...prev, asset_type: '', liability_code: '', equity_code: '' }));
    } else if (formData.category === 'LIABILITY') {
      setFormData(prev => ({ ...prev, liability_code: '', asset_type: '', equity_code: '' }));
    } else {
      setFormData(prev => ({ ...prev, equity_code: '', asset_type: '', liability_code: '' }));
    }
  }, [formData.category]);

  // Auto-set zakatable flag when asset type is selected
  useEffect(() => {
    if (formData.category === 'ASSET' && formData.asset_type) {
      const selectedAssetType = assetTypes.find(at => at.code === formData.asset_type);
      if (selectedAssetType) {
        // Auto-set zakatable flag based on zakatable_default (read-only, cannot be overridden)
        setFormData(prev => ({
          ...prev,
          metadata: {
            ...prev.metadata,
            zakatable: selectedAssetType.zakatable_default,
          }
        }));
      }
    }
  }, [formData.asset_type, formData.category, assetTypes]);

  const amountError = useMemo(() => {
    const val = formData.amount;
    if (val === '' || val == null) return t('validation_amount_required');
    const num = parseFloat(val);
    if (Number.isNaN(num)) return t('validation_amount_number');
    if (num < 0) return t('validation_amount_negative');
    return null;
  }, [formData.amount, t]);

  const acquisitionDateError = useMemo(() => {
    if (!formData.acquisition_date) return t('validation_acquisition_date_required');
    return null;
  }, [formData.acquisition_date, t]);

  const isFormValid = useMemo(() => {
    const nameOk = (formData.name || '').trim().length > 0;
    const amountOk = !amountError;
    const acquisitionOk = !acquisitionDateError;
    const categoryOk =
      (formData.category === 'ASSET' && formData.asset_type) ||
      (formData.category === 'LIABILITY' && formData.liability_code) ||
      (formData.category === 'EQUITY' && formData.equity_code);
    return nameOk && amountOk && categoryOk && acquisitionOk;
  }, [formData.name, formData.amount, formData.category, formData.asset_type, formData.liability_code, formData.equity_code, formData.acquisition_date, amountError, acquisitionDateError]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.category === 'ASSET' && !formData.asset_type) {
      alert(t('validation_asset_type_required'));
      return;
    }
    if (formData.category === 'LIABILITY' && !formData.liability_code) {
      alert(t('validation_liability_type_required'));
      return;
    }
    if (formData.category === 'EQUITY' && !formData.equity_code) {
      alert(t('validation_equity_type_required'));
      return;
    }
    if (amountError || !isFormValid || submitting) return;

    const submitData = {
      name: formData.name,
      category: formData.category,
      amount: parseFloat(formData.amount),
      acquisition_date: formData.acquisition_date || null,
      metadata: formData.metadata,
    };
    if (formData.category === 'ASSET') {
      submitData.asset_type = formData.asset_type;
      submitData.accounting_label = formData.accounting_label || null;
    } else if (formData.category === 'LIABILITY') {
      submitData.liability_code = formData.liability_code;
    } else {
      submitData.equity_code = formData.equity_code;
    }
    onSubmit(submitData);
  };

  if (!rules) {
    return <div className="text-gray-700 font-medium">{t('loading_rules')}</div>;
  }

  const assetOptions = rules.assets || [];
  const liabilityOptions = rules.liabilities || [];
  const equityOptions = rules.equity || [];

  return (
    <form onSubmit={handleSubmit} className="card w-full max-w-2xl border-2 border-blue-200 shadow-xl">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">
        {item ? t('edit_financial_item') : t('add_financial_item_new')}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            {t('item_name')} *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={submitting}
            className="input-field"
            placeholder={t('item_name_placeholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            {t('table_category')} *
          </label>
          <select
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            disabled={submitting}
            className="input-field"
            dir="rtl"
          >
            <option value="ASSET">{t('category_asset')}</option>
            <option value="LIABILITY">{t('category_liability')}</option>
            <option value="EQUITY">{t('category_equity')}</option>
          </select>
        </div>

        {formData.category === 'ASSET' && (
          <>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                {t('asset_type_label')} *
              </label>
              {loadingAssetTypes ? (
                <div className="text-gray-700 font-medium">{t('loading_asset_types')}</div>
              ) : (
                <>
                  <select
                    required
                    value={formData.asset_type || ''}
                    onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                    disabled={submitting}
                    className="input-field"
                    dir="rtl"
                  >
                    <option value="">-- {t('choose_asset_type')} --</option>
                    {assetTypes.map((assetType) => (
                      <option key={assetType.code} value={assetType.code}>
                        {assetType.label_ar}
                      </option>
                    ))}
                  </select>
                  {formData.asset_type && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700" dir="rtl">
                      <p className="font-medium">
                        {t('zakat_status_label')} {formData.metadata?.zakatable ? t('zakatable_eligible') : t('not_zakatable_eligible')}
                      </p>
                      <p className="text-gray-600 mt-1">{t('auto_determined_by_type')}</p>
                    </div>
                  )}
                </>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                {t('accounting_label')}
              </label>
              <input
                type="text"
                value={formData.accounting_label || ''}
                onChange={(e) => setFormData({ ...formData, accounting_label: e.target.value })}
                disabled={submitting}
                className="input-field"
                placeholder=""
                dir="rtl"
              />
              <p className="text-xs text-gray-600 mt-1">{t('accounting_label_optional')}</p>
            </div>
          </>
        )}

        {formData.category === 'LIABILITY' && (
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              {t('liability_type_label')} *
            </label>
            <select
              required
              value={formData.liability_code || ''}
              onChange={(e) => setFormData({ ...formData, liability_code: e.target.value })}
              disabled={submitting}
              className="input-field"
              dir="rtl"
            >
              <option value="">-- {t('choose_liability_type')} --</option>
              {liabilityOptions.map((liab) => (
                <option key={liab.code} value={liab.code}>
                  {liab.label_ar}
                </option>
              ))}
            </select>
            {formData.liability_code && (
              <p className="text-xs text-gray-700 mt-1 font-medium">
                {(() => {
                  const selected = liabilityOptions.find((l) => l.code === formData.liability_code);
                  if (!selected) return '';
                  const key = `rule_${selected.code}_reason`;
                  const translated = t(key);
                  return translated && translated !== key ? translated : selected.reason_ar;
                })()}
              </p>
            )}
          </div>
        )}

        {formData.category === 'EQUITY' && (
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              {t('equity_type_label')} *
            </label>
            <select
              required
              value={formData.equity_code || ''}
              onChange={(e) => setFormData({ ...formData, equity_code: e.target.value })}
              disabled={submitting}
              className="input-field"
              dir="rtl"
            >
              <option value="">-- {t('choose_equity_type')} --</option>
              {equityOptions.map((eq) => (
                <option key={eq.code} value={eq.code}>
                  {eq.label_ar}
                </option>
              ))}
            </select>
            {formData.equity_code && (
              <p className="text-xs text-gray-700 mt-1 font-medium" dir="rtl">
                {(() => {
                  const selected = equityOptions.find((e) => e.code === formData.equity_code);
                  if (!selected) return '';
                  const key = `rule_${selected.code}_reason`;
                  const translated = t(key);
                  return translated && translated !== key ? translated : selected.reason_ar;
                })()}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1" dir="rtl">
              {t('equity_note')}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            {t('acquisition_date_label')} *
          </label>
          <LocalizedDateInput
            id="acquisition_date"
            required
            value={formData.acquisition_date}
            onChange={(val) => setFormData({ ...formData, acquisition_date: val })}
            error={acquisitionDateError}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            {t('amount')} *
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            disabled={submitting}
            className={`input-field ${amountError ? 'border-red-500' : ''}`}
            placeholder="0.00"
            aria-invalid={!!amountError}
            aria-describedby={amountError ? 'amount-error' : undefined}
          />
          {amountError && (
            <p id="amount-error" className="text-red-600 text-sm font-medium mt-1" role="alert">
              {amountError}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
          <button type="button" onClick={onCancel} disabled={submitting} className="btn-secondary w-full sm:w-auto order-2 sm:order-1">
            {t('cancel')}
          </button>
          <button
            type="submit"
            className="btn-primary w-full sm:w-auto order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isFormValid || submitting}
          >
            {submitting ? t('saving') : item ? t('save_edits') : t('add')}
          </button>
        </div>
      </div>
    </form>
  );
}
