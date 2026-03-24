/**
 * Companies Page
 *
 * - No company session: show minimal list; "Select" opens password modal. "Add company" to create.
 * - Has session: show current company only (edit/delete), "Switch Company" (password required).
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getCompaniesMinimal,
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from '../api/companies';
import { useCompany } from '../contexts/CompanyContext';
import { useAuth } from '../contexts/AuthContext';
import CompanyForm from '../components/CompanyForm';
import CompanyPasswordModal from '../components/CompanyPasswordModal';

export default function CompaniesPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canManageCompanies = hasPermission('manageCompanies');
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
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [switchLoading, setSwitchLoading] = useState(false);

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
      alert(t('load_companies_failed') + ': ' + error.message);
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
      setPasswordError(error.message || t('errors_invalid_password'));
    } finally {
      setPasswordLoading(false);
    }
  }

  function handleSwitchCompany() {
    setSwitchLoading(true);
    clearCompanySession();
    setCurrentCompanyDetail(null);
    Promise.resolve(loadMinimal()).finally(() => setSwitchLoading(false));
  }

  async function handleSubmit(formData) {
    try {
      setFormSubmitting(true);
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
      alert(t('save_failed') + ': ' + error.message);
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (
      !confirm(t('confirm_delete_company'))
    ) {
      return;
    }
    try {
      setDeleteLoadingId(id);
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
      alert(t('delete_failed') + ': ' + error.message);
    } finally {
      setDeleteLoadingId(null);
    }
  }

  if (loading && !companiesMinimal.length && !currentCompanyDetail) {
    return <div className="text-center py-8 text-gray-700 font-medium">{t('loading')}</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{t('manage_companies')}</h1>
          <p className="text-sm sm:text-base text-gray-600">
            {hasCompanySession ? t('companies_intro_with_session') : t('companies_intro_no_session')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasCompanySession && (
            <button
              type="button"
              onClick={handleSwitchCompany}
              disabled={switchLoading}
              className="px-4 py-2 border-2 border-blue-600 text-blue-700 rounded-lg font-bold hover:bg-blue-50"
            >
              {switchLoading ? t('switching_company') : t('switch_company')}
            </button>
          )}
          {canManageCompanies && (
            <button
              type="button"
              onClick={() => {
                setEditingCompany(null);
                setShowForm(true);
              }}
              disabled={formSubmitting}
              className="btn-primary text-base sm:text-lg w-full sm:w-auto"
            >
              + {t('add_company_new')}
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="mb-6">
          <CompanyForm
            company={editingCompany}
            onSubmit={handleSubmit}
            submitting={formSubmitting}
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
                    <th>{t('name')}</th>
                    <th>{t('type')}</th>
                    <th>{t('financial_year_start')}</th>
                    <th>{t('financial_year_end')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold text-gray-900">{currentCompanyDetail.name}</td>
                    <td className="font-semibold text-gray-800">
                      {currentCompanyDetail.legal_type === 'LLC' ? t('legal_type_llc') : t('legal_type_sole')}
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
                      {canManageCompanies && (
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end items-end sm:items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCompany(currentCompanyDetail);
                              setShowForm(true);
                            }}
                            disabled={formSubmitting || deleteLoadingId === currentCompanyDetail.id}
                            className="text-blue-700 hover:text-blue-900 text-xs sm:text-sm font-bold hover:underline whitespace-nowrap"
                          >
                            {t('edit')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(currentCompanyDetail.id)}
                            disabled={deleteLoadingId === currentCompanyDetail.id}
                            className="text-red-700 hover:text-red-900 text-xs sm:text-sm font-bold hover:underline whitespace-nowrap"
                          >
                            {deleteLoadingId === currentCompanyDetail.id ? t('deleting') : t('delete')}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-700 font-medium">
              {t('current_company_load_failed')}
            </div>
          )
        ) : (
          <>
            {companiesMinimal.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-700 font-medium">{t('no_companies')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-700 mb-3">
                  {t('select_company_and_password')}
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
                        disabled={passwordLoading}
                        className="btn-primary text-sm py-2 px-4"
                      >
                        {passwordLoading && passwordModal?.id === company.id ? t('verifying') : t('enter')}
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
