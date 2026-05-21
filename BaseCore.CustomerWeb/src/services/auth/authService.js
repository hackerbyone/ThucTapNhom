import { buildUrl, getHeaders, handleResponse } from '../utils/apiClient';

export const authService = {
  login: async (username, password) => {
    const response = await fetch(buildUrl('/api/auth/login'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(response, 'Login failed');
  },

  register: async (username, password, email, name) => {
    const response = await fetch(buildUrl('/api/auth/register'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ username, password, email, name }),
    });
    return handleResponse(response, 'Register failed');
  },

  logout: () => {
    sessionStorage.removeItem('auth');
  },

  getProfile: async () => {
    const response = await fetch(buildUrl('/api/auth/profile'), {
      method: 'GET',
      headers: getHeaders(true),
    });
    return handleResponse(response, 'Failed to fetch profile');
  },
};
