/**
 * Companies API - CRUD operations for companies
 */

import { get, post, put, del } from './client';

/**
 * Get all companies
 */
export async function getCompanies() {
  const response = await get('/companies');
  return response.items || [];
}

/**
 * Get company by ID
 */
export async function getCompany(id) {
  return get(`/companies/${id}`);
}

/**
 * Create a new company
 */
export async function createCompany(companyData) {
  return post('/companies', companyData);
}

/**
 * Update a company
 */
export async function updateCompany(id, companyData) {
  return put(`/companies/${id}`, companyData);
}

/**
 * Delete a company
 */
export async function deleteCompany(id) {
  return del(`/companies/${id}`);
}
