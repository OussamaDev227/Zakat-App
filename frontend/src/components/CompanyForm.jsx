/**
 * Company Form Component
 * 
 * Create/Edit company form
 */

import { useState } from 'react';

export default function CompanyForm({ company = null, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: company?.name || '',
    legal_type: company?.legal_type || 'LLC',
    fiscal_year_start: company?.fiscal_year_start || '',
    fiscal_year_end: company?.fiscal_year_end || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="card w-full max-w-2xl border-2 border-blue-200 shadow-xl">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">
        {company ? 'تعديل الشركة' : 'إضافة شركة جديدة'}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            اسم الشركة *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-field"
            placeholder="أدخل اسم الشركة"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            نوع الشركة *
          </label>
          <select
            required
            value={formData.legal_type}
            onChange={(e) => setFormData({ ...formData, legal_type: e.target.value })}
            className="input-field"
          >
            <option value="LLC">شركة ذات مسؤولية محدودة (LLC)</option>
            <option value="SOLE_PROPRIETORSHIP">مؤسسة فردية (Sole Proprietorship)</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              بداية السنة المالية *
            </label>
            <input
              type="date"
              required
              value={formData.fiscal_year_start}
              onChange={(e) => setFormData({ ...formData, fiscal_year_start: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              نهاية السنة المالية *
            </label>
            <input
              type="date"
              required
              value={formData.fiscal_year_end}
              onChange={(e) => setFormData({ ...formData, fiscal_year_end: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
          <button type="button" onClick={onCancel} className="btn-secondary w-full sm:w-auto order-2 sm:order-1">
            إلغاء
          </button>
          <button type="submit" className="btn-primary w-full sm:w-auto order-1 sm:order-2">
            {company ? 'حفظ التعديلات' : 'إضافة'}
          </button>
        </div>
      </div>
    </form>
  );
}
