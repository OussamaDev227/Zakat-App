/**
 * Company session token store for API client.
 * CompanyContext sets the token when user selects a company (with password).
 * API client reads it to add Authorization header.
 * Stored in sessionStorage so refresh keeps session; closing tab clears it.
 */
const STORAGE_KEY = 'zakat_company_token';

function getStored() {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStored(token) {
  try {
    if (token) sessionStorage.setItem(STORAGE_KEY, token);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function setCompanyToken(token) {
  setStored(token);
}

export function getCompanyToken() {
  return getStored();
}

export function clearCompanyToken() {
  setStored(null);
}
