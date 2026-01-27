/**
 * Zakat Calculation API - Unified calculation flow
 * 
 * New draft-based workflow:
 * - Start/resume draft calculations
 * - Add/update items in calculations
 * - Recalculate and finalize
 */

import { get, post, del } from './client';

/**
 * Start or resume a draft calculation for a company
 * @param {number} companyId - Company ID
 * @returns {Promise<Object>} Calculation object with status, items, rules_used
 */
export async function startCalculation(companyId) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/36bf502b-a8b0-4651-80f5-b666e22bc1b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'zakat.js:19',message:'startCalculation API call',data:{companyId:companyId,url:`/zakat/calculation/start/${companyId}`,urlType:typeof companyId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  return post(`/zakat/calculation/start/${companyId}`);
}

/**
 * Add or update a financial item in a calculation
 * @param {number} calculationId - Calculation ID
 * @param {Object} item - Item data (name, category, asset_type/liability_code, amount, metadata, accounting_label)
 * @param {number|null} itemId - Optional item ID for updates
 * @returns {Promise<Object>} Updated calculation object
 */
export async function addItemToCalculation(calculationId, item, itemId = null) {
  const url = itemId 
    ? `/zakat/calculation/${calculationId}/item?item_id=${itemId}`
    : `/zakat/calculation/${calculationId}/item`;
  return post(url, item);
}

/**
 * Recalculate zakat for a draft calculation
 * @param {number} calculationId - Calculation ID
 * @returns {Promise<Object>} Updated calculation object
 */
export async function recalculateCalculation(calculationId) {
  return post(`/zakat/calculation/${calculationId}/recalculate`);
}

/**
 * Finalize a draft calculation (makes it read-only)
 * @param {number} calculationId - Calculation ID
 * @returns {Promise<Object>} Finalized calculation object
 */
export async function finalizeCalculation(calculationId) {
  return post(`/zakat/calculation/${calculationId}/finalize`);
}

/**
 * Get a calculation with rules and items
 * @param {number} calculationId - Calculation ID
 * @returns {Promise<Object>} Calculation object with items and rules_used
 */
export async function getCalculation(calculationId) {
  return get(`/zakat/calculation/${calculationId}`);
}

/**
 * Get all calculations for a company (drafts + finalized)
 * @param {number} companyId - Company ID
 * @returns {Promise<Array>} Array of calculation objects
 */
export async function getCalculationsForCompany(companyId) {
  const response = await get(`/zakat/calculations?company_id=${companyId}`);
  return response.items || [];
}

/**
 * Link an existing financial item to a calculation
 * @param {number} calculationId - Calculation ID
 * @param {number} financialItemId - Financial Item ID
 * @param {number|null} amount - Optional amount override
 * @returns {Promise<Object>} Updated calculation object
 */
export async function linkItemToCalculation(calculationId, financialItemId, amount = null) {
  const url = amount !== null
    ? `/zakat/calculation/${calculationId}/link-item/${financialItemId}?amount=${amount}`
    : `/zakat/calculation/${calculationId}/link-item/${financialItemId}`;
  return post(url);
}

/**
 * Remove a financial item from a calculation
 * @param {number} calculationId - Calculation ID
 * @param {number} itemId - Financial Item ID
 * @returns {Promise<Object>} Updated calculation object
 */
export async function removeItemFromCalculation(calculationId, itemId) {
  return del(`/zakat/calculation/${calculationId}/item/${itemId}`);
}

/**
 * Create a revision (clone) of a finalized calculation
 * @param {number} calculationId - Calculation ID
 * @returns {Promise<Object>} New calculation object (DRAFT)
 */
export async function createRevision(calculationId) {
  return post(`/zakat/calculation/${calculationId}/create-revision`);
}
