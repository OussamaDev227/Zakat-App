/**
 * Company session auth API
 */

import { post, get } from './client';
import { setCompanyToken, clearCompanyToken } from './authStore';

/**
 * Select a company with password. On success, stores token in authStore.
 * @param {number} companyId - Company ID
 * @param {string} password - Company password
 * @returns {Promise<{ company: { id, name }, access_token }>}
 */
export async function selectCompany(companyId, password) {
  const data = await post('/auth/company/select', { company_id: companyId, password });
  setCompanyToken(data.access_token);
  return data;
}

/**
 * Clear company session (e.g. when switching company or logging out).
 */
export function clearCompanySession() {
  clearCompanyToken();
}

/**
 * Get current company (from session). Requires valid token.
 * @returns {Promise<{ id, name, ... }>}
 */
export async function getCurrentCompany() {
  return get('/auth/company/current');
}
