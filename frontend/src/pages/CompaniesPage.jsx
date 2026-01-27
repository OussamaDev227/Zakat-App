/**
 * Companies Page
 * 
 * Manage companies: list, create, edit, delete
 */

import { useState, useEffect } from 'react';
import { getCompanies, createCompany, updateCompany, deleteCompany } from '../api/companies';
import { useCompany } from '../contexts/CompanyContext';
import CompanyForm from '../components/CompanyForm';
import CompanySelector from '../components/CompanySelector';

export default function CompaniesPage() {
  const { setActiveCompany } = useCompany();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    try {
      setLoading(true);
      const data = await getCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Failed to load companies:', error);
      alert('فشل تحميل الشركات: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(formData) {
    try {
      if (editingCompany) {
        await updateCompany(editingCompany.id, formData);
      } else {
        await createCompany(formData);
      }
      await loadCompanies();
      setShowForm(false);
      setEditingCompany(null);
    } catch (error) {
      alert('فشل الحفظ: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الشركة؟ سيتم حذف جميع البنود المالية والحسابات المرتبطة بها.')) {
      return;
    }

    try {
      await deleteCompany(id);
      await loadCompanies();
      setActiveCompany(null);
    } catch (error) {
      alert('فشل الحذف: ' + error.message);
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-700 font-medium">جاري التحميل...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">إدارة الشركات</h1>
          <p className="text-sm sm:text-base text-gray-600">إدارة بيانات الشركات وإعداداتها</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-base sm:text-lg w-full sm:w-auto">
          + إضافة شركة جديدة
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <CompanyForm
            company={editingCompany}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingCompany(null);
            }}
          />
        </div>
      )}

      <CompanySelector />

      <div className="card border-2 border-blue-100">
        {companies.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-700 font-medium">لا توجد شركات. ابدأ بإضافة شركة جديدة.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>النوع</th>
                  <th>بداية السنة المالية</th>
                  <th>نهاية السنة المالية</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td className="font-bold text-gray-900">{company.name}</td>
                    <td className="font-semibold text-gray-800">{company.legal_type === 'LLC' ? 'ذات مسؤولية محدودة' : 'مؤسسة فردية'}</td>
                    <td className="font-medium text-gray-700">{new Date(company.fiscal_year_start).toLocaleDateString('en-US')}</td>
                    <td className="font-medium text-gray-700">{new Date(company.fiscal_year_end).toLocaleDateString('en-US')}</td>
                    <td>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end items-end sm:items-center">
                        <button
                          onClick={() => {
                            setEditingCompany(company);
                            setShowForm(true);
                          }}
                          className="text-blue-700 hover:text-blue-900 text-xs sm:text-sm font-bold hover:underline whitespace-nowrap min-h-[44px] sm:min-h-0 flex items-center justify-center px-2 sm:px-0"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDelete(company.id)}
                          className="text-red-700 hover:text-red-900 text-xs sm:text-sm font-bold hover:underline whitespace-nowrap min-h-[44px] sm:min-h-0 flex items-center justify-center px-2 sm:px-0"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
