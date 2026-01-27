/**
 * Financial Item Form Component
 * 
 * Create/Edit financial item form
 * 
 * Asset types are strictly defined by zakat jurisprudence rules.
 * Asset classification is a jurisprudential constraint, not a user preference.
 */

import { useState, useEffect } from 'react';
import { useRules } from '../contexts/RulesContext';
import { getAssetTypes } from '../api/lookups';

export default function FinancialItemForm({ item = null, onSubmit, onCancel }) {
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
    amount: item?.amount || '',
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.category === 'ASSET' && !formData.asset_type) {
      alert('يجب اختيار نوع الأصل');
      return;
    }
    if (formData.category === 'LIABILITY' && !formData.liability_code) {
      alert('يجب اختيار نوع الالتزام');
      return;
    }
    if (formData.category === 'EQUITY' && !formData.equity_code) {
      alert('يجب اختيار نوع حقوق الملكية');
      return;
    }
    
    const submitData = {
      name: formData.name,
      category: formData.category,
      amount: parseFloat(formData.amount),
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
    return <div className="text-gray-700 font-medium">جاري تحميل القواعد...</div>;
  }

  const assetOptions = rules.assets || [];
  const liabilityOptions = rules.liabilities || [];
  const equityOptions = rules.equity || [];

  return (
    <form onSubmit={handleSubmit} className="card max-w-2xl border-2 border-blue-200 shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        {item ? 'تعديل البند المالي' : 'إضافة بند مالي جديد'}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            اسم البند *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-field"
            placeholder="مثال: النقدية في البنك"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            الفئة *
          </label>
          <select
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="input-field"
            dir="rtl"
          >
            <option value="ASSET">أصل</option>
            <option value="LIABILITY">التزام</option>
            <option value="EQUITY">حقوق الملكية</option>
          </select>
        </div>

        {formData.category === 'ASSET' && (
          <>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                نوع الأصل *
              </label>
              {loadingAssetTypes ? (
                <div className="text-gray-700 font-medium">جاري تحميل أنواع الأصول...</div>
              ) : (
                <>
                  <select
                    required
                    value={formData.asset_type || ''}
                    onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                    className="input-field"
                    dir="rtl"
                  >
                    <option value="">-- اختر نوع الأصل --</option>
                    {assetTypes.map((assetType) => (
                      <option key={assetType.code} value={assetType.code}>
                        {assetType.label_ar}
                      </option>
                    ))}
                  </select>
                  {formData.asset_type && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700" dir="rtl">
                      <p className="font-medium">
                        حالة الزكاة: {formData.metadata?.zakatable ? 'خاضع للزكاة' : 'غير خاضع للزكاة'}
                      </p>
                      <p className="text-gray-600 mt-1">
                        (يتم تحديده تلقائياً حسب نوع الأصل - غير قابل للتعديل)
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                الوصف المحاسبي
              </label>
              <input
                type="text"
                value={formData.accounting_label || ''}
                onChange={(e) => setFormData({ ...formData, accounting_label: e.target.value })}
                className="input-field"
                placeholder="مثال: حسابات الغير المدينة"
                dir="rtl"
              />
              <p className="text-xs text-gray-600 mt-1">
                (اختياري - للوصف المحاسبي فقط)
              </p>
            </div>
          </>
        )}

        {formData.category === 'LIABILITY' && (
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              نوع الالتزام *
            </label>
            <select
              required
              value={formData.liability_code || ''}
              onChange={(e) => setFormData({ ...formData, liability_code: e.target.value })}
              className="input-field"
              dir="rtl"
            >
              <option value="">-- اختر نوع الالتزام --</option>
              {liabilityOptions.map((liab) => (
                <option key={liab.code} value={liab.code}>
                  {liab.label_ar}
                </option>
              ))}
            </select>
            {formData.liability_code && (
              <p className="text-xs text-gray-700 mt-1 font-medium">
                {liabilityOptions.find(l => l.code === formData.liability_code)?.reason_ar}
              </p>
            )}
          </div>
        )}

        {formData.category === 'EQUITY' && (
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              نوع حقوق الملكية *
            </label>
            <select
              required
              value={formData.equity_code || ''}
              onChange={(e) => setFormData({ ...formData, equity_code: e.target.value })}
              className="input-field"
              dir="rtl"
            >
              <option value="">-- اختر نوع حقوق الملكية --</option>
              {equityOptions.map((eq) => (
                <option key={eq.code} value={eq.code}>
                  {eq.label_ar}
                </option>
              ))}
            </select>
            {formData.equity_code && (
              <p className="text-xs text-gray-700 mt-1 font-medium" dir="rtl">
                {equityOptions.find(e => e.code === formData.equity_code)?.reason_ar}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1" dir="rtl">
              حقوق الملكية لا تدخل في وعاء الزكاة؛ للتوازن المحاسبي فقط.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            المبلغ *
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="input-field"
            placeholder="0.00"
          />
        </div>

        <div className="flex gap-4 justify-end">
          <button type="button" onClick={onCancel} className="btn-secondary">
            إلغاء
          </button>
          <button type="submit" className="btn-primary">
            {item ? 'حفظ التعديلات' : 'إضافة'}
          </button>
        </div>
      </div>
    </form>
  );
}
