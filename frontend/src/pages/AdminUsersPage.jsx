import { useEffect, useMemo, useState } from 'react';
import { createUser, getUsers, assignUserToCompany, removeUserFromCompany, updateUserStatus } from '../api/users';
import { getCompaniesMinimal } from '../api/companies';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusLoadingUserId, setStatusLoadingUserId] = useState(null);
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

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const [usersData, companiesData] = await Promise.all([getUsers(), getCompaniesMinimal()]);
      setUsers(usersData);
      setCompanies(companiesData);
    } catch (err) {
      setError(err.message || 'Failed to load admin data.');
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
      await createUser({
        ...createForm,
        name: createForm.name.trim(),
        email: createForm.email.trim(),
      });
      setCreateForm({ name: '', email: '', password: '', system_role: 'USER' });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to create user.');
    }
  }

  async function handleAssign(e) {
    e.preventDefault();
    setError('');
    if (!assignForm.user_id || !assignForm.company_id) {
      setError('Please choose user and company.');
      return;
    }
    try {
      await assignUserToCompany(Number(assignForm.company_id), {
        user_id: Number(assignForm.user_id),
        role: assignForm.role,
      });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to assign user to company.');
    }
  }

  async function handleRemoveMembership(companyId, userId) {
    try {
      await removeUserFromCompany(companyId, userId);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to remove company membership.');
    }
  }

  async function handleToggleUserStatus(user) {
    try {
      setError('');
      setStatusLoadingUserId(user.id);
      await updateUserStatus(user.id, !user.is_active);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to update user status.');
    } finally {
      setStatusLoadingUserId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Panel - User Management</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Create users, assign users to companies, and manage memberships.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-800 font-semibold">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card border-2 border-blue-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Create User</h2>
          <form className="space-y-3" onSubmit={handleCreateUser}>
            <input
              className="input-field"
              placeholder="Full name"
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <input
              className="input-field"
              type="email"
              placeholder="Email"
              value={createForm.email}
              onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
            <input
              className="input-field"
              type="password"
              placeholder="Password"
              value={createForm.password}
              onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
              required
            />
            <select
              className="input-field"
              value={createForm.system_role}
              onChange={(e) => setCreateForm((p) => ({ ...p, system_role: e.target.value }))}
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <button type="submit" className="btn-primary w-full">Create User</button>
          </form>
        </section>

        <section className="card border-2 border-blue-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Assign User To Company</h2>
          <form className="space-y-3" onSubmit={handleAssign}>
            <select
              className="input-field"
              value={assignForm.user_id}
              onChange={(e) => setAssignForm((p) => ({ ...p, user_id: e.target.value }))}
              required
            >
              <option value="">Select user</option>
              {userOptions.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
            <select
              className="input-field"
              value={assignForm.company_id}
              onChange={(e) => setAssignForm((p) => ({ ...p, company_id: e.target.value }))}
              required
            >
              <option value="">Select company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className="input-field"
              value={assignForm.role}
              onChange={(e) => setAssignForm((p) => ({ ...p, role: e.target.value }))}
            >
              <option value="ACCOUNTANT">ACCOUNTANT</option>
              <option value="OWNER">OWNER</option>
              <option value="SHARIA_AUDITOR">SHARIA_AUDITOR</option>
            </select>
            <button type="submit" className="btn-primary w-full">Assign</button>
          </form>
        </section>
      </div>

      <section className="card border-2 border-blue-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Users</h2>
          <button className="btn-secondary" onClick={loadData} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
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
                <th>Status</th>
                <th>Actions</th>
                <th>Company Memberships</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className="badge">{u.system_role}</span></td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
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
                        ? 'Updating...'
                        : u.is_active
                        ? 'Deactivate'
                        : 'Activate'}
                    </button>
                  </td>
                  <td>
                    {!u.memberships?.length ? (
                      <span className="text-gray-500 text-sm">No memberships</span>
                    ) : (
                      <div className="space-y-2">
                        {u.memberships.map((m) => (
                          <div key={`${u.id}-${m.company_id}`} className="flex items-center gap-2 text-sm">
                            <span>Company #{m.company_id}</span>
                            <span className="badge">{m.role}</span>
                            <button
                              className="text-red-700 hover:text-red-900 font-semibold"
                              onClick={() => handleRemoveMembership(m.company_id, u.id)}
                            >
                              Remove
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
