/**
 * Companies Page
 *
 * - No company session: show minimal list; "Select" opens password modal. "Add company" to create.
 * - Has session: show current company only (edit/delete), "Switch Company" (password required).
 */

import { useState, useEffect } from 'react';
import {
  getCompaniesMinimal,
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from '../api/companies';
import { useCompany } from '../contexts/CompanyContext';
import CompanyForm from '../components/CompanyForm';
import CompanyPasswordModal from '../components/CompanyPasswordModal';

export default function CompaniesPage() {
  const {
    activeCompany,
    hasCompanySession,
    selectCompany,
    clearCompanySession,
    setActiveCompany,
  } = useCompany();
  const [companiesMinimal, setCompaniesMinimal] = useState([]);
  const [currentCompanyDetail, setCurrentCompanyDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [passwordModal, setPasswordModal] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  useEffect(() => {
    if (hasCompanySession) {
      loadCurrentCompany();
    } else {
      loadMinimal();
    }
  }, [hasCompanySession]);

  async function loadMinimal() {
    try {
      setLoading(true);
      const data = await getCompaniesMinimal();
      setCompaniesMinimal(data);
    } catch (error) {
      console.error('Failed to load companies:', error);
      alert('فشل تحميل الشركات: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadCurrentCompany() {
    try {
      setLoading(true);
      const data = await getCompanies();
      setCurrentCompanyDetail(data[0] || null);
    } catch (error) {
      console.error('Failed to load current company:', error);
      setCurrentCompanyDetail(null);
    } finally {
      setLoading(false);
    }
  }

  function openPasswordModal(company) {
    setPasswordModal(company);
    setPasswordError(null);
  }

  function closePasswordModal() {
    setPasswordModal(null);
    setPasswordError(null);
  }

  async function handlePasswordSubmit(password) {
    if (!passwordModal) return;
    setPasswordLoading(true);
    setPasswordError(null);
    try {
      await selectCompany(passwordModal.id, password);
      closePasswordModal();
      if (hasCompanySession) {
        await loadCurrentCompany();
      }
    } catch (error) {
      setPasswordError(error.message || 'كلمة المرور غير صحيحة');
    } finally {
      setPasswordLoading(false);
    }
  }

  function handleSwitchCompany() {
    clearCompanySession();
    setCurrentCompanyDetail(null);
    loadMinimal();
  }

  async function handleSubmit(formData) {
    try {
      if (editingCompany) {
        await updateCompany(editingCompany.id, formData);
      } else {
        await createCompany(formData);
      }
      setShowForm(false);
      setEditingCompany(null);
      if (hasCompanySession) {
        await loadCurrentCompany();
      } else {
        await loadMinimal();
      }
    } catch (error) {
      alert('فشل الحفظ: ' + error.message);
    }
  }

  async function handleDelete(id) {
    if (
      !confirm(
        'هل أنت متأكد من حذف هذه الشركة؟ سيتم حذف جميع البنود المالية والحسابات المرتبطة بها.'
      )
    ) {
      return;
    }
    try {
      await deleteCompany(id);
      if (activeCompany && activeCompany.id === id) {
        clearCompanySession();
        setCurrentCompanyDetail(null);
      }
      await loadMinimal();
      if (hasCompanySession) {
        await loadCurrentCompany();
      }
    } catch (error) {
      alert('فشل الحذف: ' + error.message);
    }
  }

  if (loading && !companiesMinimal.length && !currentCompanyDetail) {
    return <div className="text-center py-8 text-gray-700 font-medium">جاري التحميل...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">إدارة الشركات</h1>
          <p className="text-sm sm:text-base text-gray-600">
            {hasCompanySession
              ? 'الشركة الحالية. استخدم "تبديل الشركة" للدخول إلى شركة أخرى (ستُطلب كلمة المرور).'
              : 'اختر شركة وأدخل كلمة المرور للدخول، أو أضف شركة جديدة.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasCompanySession && (
            <button
              type="button"
              onClick={handleSwitchCompany}
              className="px-4 py-2 border-2 border-blue-600 text-blue-700 rounded-lg font-bold hover:bg-blue-50"
            >
              تبديل الشركة
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setEditingCompany(null);
              setShowForm(true);
            }}
            className="btn-primary text-base sm:text-lg w-full sm:w-auto"
          >
            + إضافة شركة جديدة
          </button>
        </div>
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

      {passwordModal && (
        <CompanyPasswordModal
          companyName={passwordModal.name}
          onConfirm={handlePasswordSubmit}
          onCancel={closePasswordModal}
          loading={passwordLoading}
          error={passwordError}
        />
      )}

      <div className="card border-2 border-blue-100">
        {hasCompanySession ? (
          currentCompanyDetail ? (
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
                  <tr>
                    <td className="font-bold text-gray-900">{currentCompanyDetail.name}</td>
                    <td className="font-semibold text-gray-800">
                      {currentCompanyDetail.legal_type === 'LLC'
                        ? 'ذات مسؤولية محدودة'
                        : 'مؤسسة فردية'}
                    </td>
                    <td className="font-medium text-gray-700">
                      {new Date(currentCompanyDetail.fiscal_year_start).toLocaleDateString(
                        'en-US'
                      )}
                    </td>
                    <td className="font-medium text-gray-700">
                      {new Date(currentCompanyDetail.fiscal_year_end).toLocaleDateString('en-US')}
                    </td>
                    <td>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end items-end sm:items-center">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCompany(currentCompanyDetail);
                            setShowForm(true);
                          }}
                          className="text-blue-700 hover:text-blue-900 text-xs sm:text-sm font-bold hover:underline whitespace-nowrap"
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(currentCompanyDetail.id)}
                          className="text-red-700 hover:text-red-900 text-xs sm:text-sm font-bold hover:underline whitespace-nowrap"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-700 font-medium">
              لا يمكن تحميل بيانات الشركة الحالية.
            </div>
          )
        ) : (
          <>
            {companiesMinimal.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-700 font-medium">لا توجد شركات. ابدأ بإضافة شركة جديدة.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-700 mb-3">
                  اختر شركة وأدخل كلمة المرور للدخول:
                </p>
                <ul className="divide-y divide-gray-200">
                  {companiesMinimal.map((company) => (
                    <li
                      key={company.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <span className="font-bold text-gray-900">{company.name}</span>
                      <button
                        type="button"
                        onClick={() => openPasswordModal(company)}
                        className="btn-primary text-sm py-2 px-4"
                      >
                        دخول
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
