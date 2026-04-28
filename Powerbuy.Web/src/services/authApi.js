const API_URL = 'https://powerbuy.onrender.com/api/Auth';

const AUTH_TOKEN_KEY = 'authToken';
const USER_ID_KEY = 'userId';
const USER_EMAIL_KEY = 'userEmail';

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getUserId() {
  return localStorage.getItem(USER_ID_KEY);
}

export function getUserEmail() {
  return localStorage.getItem(USER_EMAIL_KEY);
}

export function isAuthenticated() {
  return !!getAuthToken();
}

export async function register(email, password) {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed.');
  }

  const data = await response.json();
  storeAuthData(data);
  return data;
}

export async function login(email, password) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed.');
  }

  const data = await response.json();
  storeAuthData(data);
  return data;
}

export function logout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
}

function storeAuthData(authResponse) {
  localStorage.setItem(AUTH_TOKEN_KEY, authResponse.token);
  localStorage.setItem(USER_ID_KEY, authResponse.userId);
  localStorage.setItem(USER_EMAIL_KEY, authResponse.email);
}
