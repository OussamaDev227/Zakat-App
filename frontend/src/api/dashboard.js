import { get } from './client';

export async function getAdminDashboard() {
  return get('/dashboard/admin');
}

export async function getOwnerDashboard() {
  return get('/dashboard/company');
}
