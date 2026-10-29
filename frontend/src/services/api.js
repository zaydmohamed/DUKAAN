import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dukaan_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Avoid infinite redirect loop if already on login page
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('dukaan_token');
        localStorage.removeItem('dukaan_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const formatMoney = (cents, symbol = '$') => {
  if (cents === undefined || cents === null || isNaN(cents)) return `${symbol}0.00`;
  const dollars = (Number(cents) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${dollars}`;
};

export default api;

