/**
 * Rules API - Fetch zakat rules for dropdowns and UI metadata
 * 
 * IMPORTANT: This endpoint provides rule definitions from the backend.
 * The frontend does NOT interpret or modify these rules - it only displays
 * what the backend rule engine decides.
 */

import { get } from './client';

let rulesCache = null;

/**
 * Get zakat rules (cached after first fetch)
 * This should be called once at app startup via RulesContext
 */
export async function getRules() {
  if (rulesCache) {
    return rulesCache;
  }
  
  rulesCache = await get('/rules');
  return rulesCache;
}

/**
 * Clear rules cache (useful for testing or refresh)
 */
export function clearRulesCache() {
  rulesCache = null;
}
