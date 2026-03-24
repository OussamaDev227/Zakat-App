/**
 * User auth and company session API
 */

import { post, get } from './client';
import { clearStoredUser, clearUserToken, setStoredUser, setUserToken } from './authStore';

export async function login(email, password) {
  const data = await post('/auth/login', { email, password });
  setUserToken(data.access_token);
  setStoredUser(data.user);
  return data;
}

export async function getMe() {
  return get('/auth/me');
}

/**
 * Select active company with optional company password.
 * On success backend returns a refreshed token with active company scope.
 * @param {number} companyId - Company ID
 * @param {string|null} password - Company password (optional)
 * @returns {Promise<{ company: { id, name }, access_token }>}
 */
export async function selectCompany(companyId, password) {
  const data = await post('/auth/company/select', { company_id: companyId, password: password || null });
  setUserToken(data.access_token);
  return data;
}

/**
 * Clear all authentication/session state.
 */
export function logout() {
  clearUserToken();
  clearStoredUser();
}

/**
 * Get active company (from current token context).
 * @returns {Promise<{ id, name, ... }>}
 */
export async function getCurrentCompany() {
  return get('/auth/company/current');
}
