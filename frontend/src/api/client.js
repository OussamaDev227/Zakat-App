/**
 * API Client - Base fetch wrapper
 * 
 * This module provides a thin wrapper around fetch for calling backend APIs.
 * No business logic here - just HTTP communication.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchJson(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/36bf502b-a8b0-4651-80f5-b666e22bc1b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.js:14',message:'API request starting',data:{url:fullUrl,method:config.method,hasBody:!!config.body,bodyPreview:config.body?.substring(0,100),apiBaseUrl:API_BASE_URL,relativeUrl:url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion

  try {
    const response = await fetch(fullUrl, config);
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/36bf502b-a8b0-4651-80f5-b666e22bc1b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.js:28',message:'Response received',data:{url:fullUrl,status:response.status,statusText:response.statusText,ok:response.ok,contentType:response.headers.get('content-type'),headers:Object.fromEntries(response.headers.entries())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    
    if (!response.ok) {
      // #region agent log
      const errorText = await response.clone().text().catch(() => '');
      fetch('http://127.0.0.1:7243/ingest/36bf502b-a8b0-4651-80f5-b666e22bc1b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.js:33',message:'Error response received',data:{url:fullUrl,status:response.status,statusText:response.statusText,errorText:errorText.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/36bf502b-a8b0-4651-80f5-b666e22bc1b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.js:37',message:'Error data parsed',data:{url:fullUrl,errorData:errorData,errorMessage:errorData.detail || response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }
    
    // #region agent log
    const rawText = await response.clone().text();
    fetch('http://127.0.0.1:7243/ingest/36bf502b-a8b0-4651-80f5-b666e22bc1b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.js:36',message:'Raw response text (before JSON parse)',data:{url:fullUrl,rawTextPreview:rawText.substring(0,200),rawTextLength:rawText.length,hasArabic:/\p{Script=Arabic}/u.test(rawText)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    
    const jsonData = await response.json();
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/36bf502b-a8b0-4651-80f5-b666e22bc1b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.js:42',message:'Parsed JSON data',data:{url:fullUrl,hasItems:!!jsonData.items,firstItemName:jsonData.items?.[0]?.name,firstItemNameBytes:jsonData.items?.[0]?.name?.[0]?.charCodeAt?.(0),firstItemNameType:typeof jsonData.items?.[0]?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    
    return jsonData;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/36bf502b-a8b0-4651-80f5-b666e22bc1b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.js:54',message:'fetchJson exception caught',data:{url:fullUrl,errorMessage:error?.message,errorName:error?.name,errorStack:error?.stack,isError:error instanceof Error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Network error: ${error.message}`);
  }
}

/**
 * GET request
 */
export async function get(url) {
  return fetchJson(url, { method: 'GET' });
}

/**
 * POST request
 */
export async function post(url, data) {
  return fetchJson(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PUT request
 */
export async function put(url, data) {
  return fetchJson(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request
 */
export async function del(url) {
  return fetchJson(url, { method: 'DELETE' });
}
