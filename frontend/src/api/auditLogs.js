import { get } from './client';

export async function getCompanyAuditLogs({ entityType = '', action = '', limit = 100 } = {}) {
  const params = new URLSearchParams();
  if (entityType) params.set('entity_type', entityType);
  if (action) params.set('action', action);
  if (limit) params.set('limit', String(limit));
  const query = params.toString();
  const url = query ? `/audit-logs/company?${query}` : '/audit-logs/company';
  const response = await get(url);
  return response.items || [];
}
