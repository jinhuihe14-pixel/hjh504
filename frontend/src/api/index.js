import { getForecast, getSkusByCategory, getBatchForecast } from './forecast';
import { getOrderSuggestions, getSummary, getStoreOrders, getCategoryOrders } from './orders';
import purchaseApi from './purchases';

const BASE_URL = '/api';

async function request(url, options = {}) {
  const { method = 'GET', body, headers = {}, ...restOptions } = options;

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...restOptions,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${url}`, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API request failed: ${url}`, error);
    throw error;
  }
}

export const api = {
  get: (url, options = {}) => request(url, { ...options, method: 'GET' }),
  post: (url, body, options = {}) => request(url, { ...options, method: 'POST', body }),
  put: (url, body, options = {}) => request(url, { ...options, method: 'PUT', body }),
  delete: (url, options = {}) => request(url, { ...options, method: 'DELETE' }),
};

export const forecastApi = {
  getForecast,
  getSkusByCategory,
  getBatchForecast,
};

export const orderApi = {
  getOrderSuggestions,
  getSummary,
  getStoreOrders,
  getCategoryOrders,
};

export { purchaseApi };

export default api;
