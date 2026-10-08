import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let activeRequests = 0;

export const startLoading = () => {
  activeRequests++;
  window.dispatchEvent(new CustomEvent('api-loading', { detail: { isLoading: activeRequests > 0 } }));
};

export const stopLoading = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  window.dispatchEvent(new CustomEvent('api-loading', { detail: { isLoading: activeRequests > 0 } }));
};

apiClient.interceptors.request.use(
  (config) => {
    startLoading();
    return config;
  },
  (error) => {
    stopLoading();
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    stopLoading();
    return response;
  },
  (error) => {
    stopLoading();
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    window.dispatchEvent(new CustomEvent('api-error', { detail: { message } }));
    return Promise.reject(error);
  }
);

// Wrapper to simplify calls and match previous structure somewhat
export const api = {
  get: (endpoint, config) => apiClient.get(endpoint, config).then(res => res.data),
  post: (endpoint, data, config) => apiClient.post(endpoint, data, config).then(res => res.data),
  put: (endpoint, data, config) => apiClient.put(endpoint, data, config).then(res => res.data),
  patch: (endpoint, data, config) => apiClient.patch(endpoint, data, config).then(res => res.data),
  delete: (endpoint, config) => apiClient.delete(endpoint, config).then(res => res.data),
  
  // Expose axios instance if needed for advanced usage
  client: apiClient
};

export default api;