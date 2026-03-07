import { Platform } from 'react-native';

// 10.0.2.2 maps to host's localhost on Android emulator
// For physical device: replace with your machine's LAN IP (e.g., 192.168.1.x:8000)
export const API_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

let authToken = null;

export const setToken = (token) => { authToken = token; };
export const getToken = () => authToken;
export const clearToken = () => { authToken = null; };

const request = async (endpoint, method = 'GET', body = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || `HTTP ${res.status}`);
  }
  return res.json();
};

// Auth
export const loginUser = (email, password) =>
  request('/auth/login', 'POST', { email, password });

// Student wallet & transactions
export const fetchWallet = () => request('/wallet');
export const fetchTransactions = () => request('/transactions');

// Payments
export const transferFunds = (recipient_identifier, amount, note = 'App transfer') =>
  request('/transfer', 'POST', { recipient_identifier, amount, note });

// vendor_id field is the vendor_code string
export const payVendor = (vendor_id, amount) =>
  request('/pay-vendor', 'POST', { vendor_id, amount });

// Payment Requests (from vendors)
export const fetchPaymentRequests = () => request('/student/payment-requests');
export const approvePaymentRequest = (request_id) =>
  request(`/student/approve-payment/${request_id}`, 'POST');

// Fines
export const fetchFines = () => request('/student/fines');
export const payFine = (fine_id) => request(`/student/pay-fine/${fine_id}`, 'POST');

// Subscriptions
export const subscribe = (service_id) =>
  request('/subscribe', 'POST', { service_id, auto_renew: true });

// Canteen
export const fetchCanteens = () => request('/canteens');
export const fetchCanteenMenu = (vendor_id) => request(`/canteens/${vendor_id}/menu`);
export const placeCanteenOrder = (vendor_id, items) =>
  request('/orders', 'POST', { vendor_id, items });

// Library
export const fetchBooks = () => request('/library/books');
export const rentBook = (book_id) => request('/library/rent', 'POST', { book_id });
