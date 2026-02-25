/**
 * Companies API - CRUD operations for companies
 * When company session is active, list/get/update/delete are scoped to current company.
 */

import { get, post, put, del } from './client';

/**
 * Get minimal company list (id, name only) for selection / switch. No auth required.
 */
export async function getCompaniesMinimal() {
  const response = await get('/companies/minimal');
  return response.items || [];
}

/**
 * Get current company only (requires company session). Returns one item.
 */
export async function getCompanies() {
  const response = await get('/companies');
  return response.items || [];
}

/**
 * Get company by ID (requires session and id must be current company).
 */
export async function getCompany(id) {
  return get(`/companies/${id}`);
}

/**
 * Create a new company. Optional password in companyData (stored hashed).
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
