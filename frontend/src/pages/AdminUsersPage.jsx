import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createUser, getUsers, assignUserToCompany, removeUserFromCompany, updateUserStatus } from '../api/users';
import { getCompaniesMinimal } from '../api/companies';

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [statusLoadingUserId, setStatusLoadingUserId] = useState(null);
  const [removeLoadingKey, setRemoveLoadingKey] = useState(null);
  const [error, setError] = useState('');

  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    system_role: 'USER',
  });

  const [assignForm, setAssignForm] = useState({
    user_id: '',
    company_id: '',
    role: 'ACCOUNTANT',
  });

  const userOptions = useMemo(() => users.map((u) => ({ value: String(u.id), label: `${u.name} (${u.email})` })), [users]);

  function formatSystemRole(role) {
    if (role === 'ADMIN') return t('role_system_admin');
    if (role === 'USER') return t('role_system_user');
    return role;
  }

  function formatCompanyRole(role) {
    if (role === 'ACCOUNTANT') return t('role_company_accountant');
    if (role === 'OWNER') return t('role_company_owner');
    if (role === 'SHARIA_AUDITOR') return t('role_company_sharia_auditor');
    return role;
  }

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const [usersData, companiesData] = await Promise.all([getUsers(), getCompaniesMinimal()]);
      setUsers(usersData);
      setCompanies(companiesData);
    } catch (err) {
      setError(err.message || t('admin_error_load_data'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateUser(e) {
    e.preventDefault();
    setError('');
    try {
      setCreateLoading(true);
      await createUser({
        ...createForm,
        name: createForm.name.trim(),
        email: createForm.email.trim(),
      });
      setCreateForm({ name: '', email: '', password: '', system_role: 'USER' });
      await loadData();
    } catch (err) {
      setError(err.message || t('admin_error_create_user'));
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleAssign(e) {
    e.preventDefault();
    setError('');
    if (!assignForm.user_id || !assignForm.company_id) {
      setError(t('admin_error_select_user_company'));
      return;
    }
    try {
      setAssignLoading(true);
      await assignUserToCompany(Number(assignForm.company_id), {
        user_id: Number(assignForm.user_id),
        role: assignForm.role,
      });
      await loadData();
    } catch (err) {
      setError(err.message || t('admin_error_assign_user'));
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleRemoveMembership(companyId, userId) {
    try {
      setError('');
      const key = `${companyId}-${userId}`;
      setRemoveLoadingKey(key);
      await removeUserFromCompany(companyId, userId);
      await loadData();
    } catch (err) {
      setError(err.message || t('admin_error_remove_membership'));
    } finally {
      setRemoveLoadingKey(null);
    }
  }

  async function handleToggleUserStatus(user) {
    try {
      setError('');
      setStatusLoadingUserId(user.id);
      await updateUserStatus(user.id, !user.is_active);
      await loadData();
    } catch (err) {
      setError(err.message || t('admin_error_update_status'));
    } finally {
      setStatusLoadingUserId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('admin_title')}</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          {t('admin_subtitle')}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-800 font-semibold">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card border-2 border-blue-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('admin_create_user')}</h2>
          <form className="space-y-3" onSubmit={handleCreateUser}>
            <input
              className="input-field"
              placeholder={t('admin_full_name')}
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
              disabled={createLoading}
              required
            />
            <input
              className="input-field"
              type="email"
              placeholder={t('admin_email')}
              value={createForm.email}
              onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
              disabled={createLoading}
              required
            />
            <input
              className="input-field"
              type="password"
              placeholder={t('admin_password')}
              value={createForm.password}
              onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
              disabled={createLoading}
              required
            />
            <select
              className="input-field"
              value={createForm.system_role}
              onChange={(e) => setCreateForm((p) => ({ ...p, system_role: e.target.value }))}
              disabled={createLoading}
            >
              <option value="USER">{t('role_system_user')}</option>
              <option value="ADMIN">{t('role_system_admin')}</option>
            </select>
            <button type="submit" className="btn-primary w-full" disabled={createLoading}>
              {createLoading ? t('admin_creating') : t('admin_create_user_btn')}
            </button>
          </form>
        </section>

        <section className="card border-2 border-blue-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('admin_assign_user_company')}</h2>
          <form className="space-y-3" onSubmit={handleAssign}>
            <select
              className="input-field"
              value={assignForm.user_id}
              onChange={(e) => setAssignForm((p) => ({ ...p, user_id: e.target.value }))}
              disabled={assignLoading}
              required
            >
              <option value="">{t('admin_select_user')}</option>
              {userOptions.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
            <select
              className="input-field"
              value={assignForm.company_id}
              onChange={(e) => setAssignForm((p) => ({ ...p, company_id: e.target.value }))}
              disabled={assignLoading}
              required
            >
              <option value="">{t('admin_select_company')}</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className="input-field"
              value={assignForm.role}
              onChange={(e) => setAssignForm((p) => ({ ...p, role: e.target.value }))}
              disabled={assignLoading}
            >
              <option value="ACCOUNTANT">{t('role_company_accountant')}</option>
              <option value="OWNER">{t('role_company_owner')}</option>
              <option value="SHARIA_AUDITOR">{t('role_company_sharia_auditor')}</option>
            </select>
            <button type="submit" className="btn-primary w-full" disabled={assignLoading}>
              {assignLoading ? t('admin_assigning') : t('admin_assign_btn')}
            </button>
          </form>
        </section>
      </div>

      <section className="card border-2 border-blue-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">{t('admin_users')}</h2>
          <button className="btn-secondary" onClick={loadData} disabled={loading}>
            {loading ? t('loading') : t('admin_refresh')}
          </button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>System Role</th>
                <th>{t('admin_status')}</th>
                <th>{t('actions')}</th>
                <th>{t('admin_company_memberships')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className="badge">{formatSystemRole(u.system_role)}</span></td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {u.is_active ? t('admin_status_active') : t('admin_status_inactive')}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`text-xs sm:text-sm font-bold hover:underline ${
                        u.is_active ? 'text-red-700 hover:text-red-900' : 'text-green-700 hover:text-green-900'
                      }`}
                      disabled={statusLoadingUserId === u.id}
                      onClick={() => handleToggleUserStatus(u)}
                    >
                      {statusLoadingUserId === u.id
                        ? t('admin_updating')
                        : u.is_active
                        ? t('admin_deactivate')
                        : t('admin_activate')}
                    </button>
                  </td>
                  <td>
                    {!u.memberships?.length ? (
                      <span className="text-gray-500 text-sm">{t('admin_no_memberships')}</span>
                    ) : (
                      <div className="space-y-2">
                        {u.memberships.map((m) => (
                          <div key={`${u.id}-${m.company_id}`} className="flex items-center gap-2 text-sm">
                            <span>{t('admin_company_label', { id: m.company_id })}</span>
                            <span className="badge">{formatCompanyRole(m.role)}</span>
                            <button
                              className="text-red-700 hover:text-red-900 font-semibold"
                              disabled={removeLoadingKey === `${m.company_id}-${u.id}`}
                              onClick={() => handleRemoveMembership(m.company_id, u.id)}
                            >
                              {removeLoadingKey === `${m.company_id}-${u.id}`
                                ? t('admin_removing')
                                : t('admin_remove')}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
