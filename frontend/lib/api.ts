import axios from 'axios';
import { API_URL } from '../config';

// Use simple flag-based configuration
const BASE_URL = API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration and authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect on 401 if not on login page (to prevent refresh loop)
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/admin/login')) {
        // Clear token and redirect to login on auth errors
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
