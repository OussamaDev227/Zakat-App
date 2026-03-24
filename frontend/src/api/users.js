/**
 * Admin Users API.
 */
import { del, get, patch, post } from './client';

export async function getUsers() {
  const response = await get('/users');
  return response.items || [];
}

export async function createUser(payload) {
  return post('/users', payload);
}

export async function assignUserToCompany(companyId, payload) {
  return post(`/companies/${companyId}/users`, payload);
}

export async function removeUserFromCompany(companyId, userId) {
  return del(`/companies/${companyId}/users/${userId}`);
}

export async function updateUserStatus(userId, isActive) {
  return patch(`/users/${userId}/status`, { is_active: isActive });
}
