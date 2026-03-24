/** User auth/token storage. */
const TOKEN_STORAGE_KEY = 'zakat_user_token';
const USER_STORAGE_KEY = 'zakat_user';

function getStored() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStored(token) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {}
}

export function setUserToken(token) {
  setStored(token);
}

export function getUserToken() {
  return getStored();
}

export function clearUserToken() {
  setStored(null);
}

export function setStoredUser(user) {
  try {
    if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_STORAGE_KEY);
  } catch {}
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearStoredUser() {
  setStoredUser(null);
}
