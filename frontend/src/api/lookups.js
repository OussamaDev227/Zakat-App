/**
 * Lookups API - Fetch dropdown options and metadata
 * 
 * This module provides functions to fetch lookup data for dropdowns.
 * Asset types are strictly defined by zakat jurisprudence rules.
 */

import { get } from './client';

/**
 * Get asset types for dropdown selection
 * Returns strict zakat jurisprudence asset classifications
 */
export async function getAssetTypes() {
  return get('/lookups/asset-types');
}
