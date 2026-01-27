/**
 * Financial Items API - CRUD operations for financial items
 */

import { get, post, put, del } from './client';

/**
 * Get financial items for a company
 * @param {number} companyId - Company ID
 * @param {string} category - Optional filter: 'ASSET' or 'LIABILITY'
 */
export async function getFinancialItems(companyId, category = null) {
  let url = `/financial-items?company_id=${companyId}`;
  if (category) {
    url += `&category=${category}`;
  }
  const response = await get(url);
  return response.items || [];
}

/**
 * Get financial item by ID
 */
export async function getFinancialItem(id) {
  return get(`/financial-items/${id}`);
}

/**
 * Create a new financial item
 */
export async function createFinancialItem(itemData) {
  return post('/financial-items', itemData);
}

/**
 * Update a financial item
 */
export async function updateFinancialItem(id, itemData) {
  return put(`/financial-items/${id}`, itemData);
}

/**
 * Delete a financial item
 */
export async function deleteFinancialItem(id) {
  return del(`/financial-items/${id}`);
}
