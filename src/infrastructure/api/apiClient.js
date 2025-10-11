import axios from 'axios';

const apiClient = axios.create();

// Attach token from localStorage on each request
apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('ceos_token');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response handler to clear storage on 401
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error && error.response && error.response.status;
    if (status === 401) {
      try {
        localStorage.removeItem('ceos_user');
        localStorage.removeItem('ceos_token');
      } catch (e) {}
      // Try to redirect to login
      try {
        window.location.href = '/login';
      } catch (e) {}
    }
    return Promise.reject(error);
  }
);

export default apiClient;
