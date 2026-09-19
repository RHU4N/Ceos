import axios from 'axios';

// O JWT é mantido pelo navegador em um cookie HttpOnly, não no localStorage.
const apiClient = axios.create({ withCredentials: true });

// Global response handler to clear storage on 401
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error && error.response && error.response.status;
    if (status === 401) {
      try {
        localStorage.removeItem('ceos_user');
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
