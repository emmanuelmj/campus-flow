const API_BASE_URL = 'http://localhost:8000';

let _token = null;

export const setToken = (t) => { _token = t; };
export const clearToken = () => { _token = null; };
export const getToken = () => _token;

export const apiRequest = async (endpoint, method = 'GET', body = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || `Error ${res.status}`);
  }
  return res.json();
};
