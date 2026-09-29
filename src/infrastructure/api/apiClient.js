import axios from 'axios';

// O JWT é mantido pelo navegador em um cookie HttpOnly, não no localStorage.
const apiClient = axios.create({ withCredentials: true });
const authBaseUrl = process.env.REACT_APP_API_LOGIN_URL;
let refreshPromise = null;

function isRefreshRequest(config) {
  return String(config?.url || '').endsWith('/auth/refresh');
}

// Uma resposta 401 limpa dados locais, mas não redireciona globalmente: a
// checagem inicial de sessão (/auth/me) é esperada para visitantes anônimos e
// as páginas públicas devem continuar acessíveis.
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error && error.response && error.response.status;
    const apiMessage = error?.response?.data?.error?.message;
    if (apiMessage) error.message = apiMessage;
    const request = error?.config;
    if (status === 401 && request && !request._ceosRetried && !isRefreshRequest(request)) {
      request._ceosRetried = true;
      try {
        if (!refreshPromise) refreshPromise = apiClient.post(`${authBaseUrl}/auth/refresh`);
        await refreshPromise;
        return apiClient(request);
      } catch (refreshError) {
        error = refreshError;
      } finally {
        refreshPromise = null;
      }
    }
    if (status === 401 || error?.response?.status === 401) {
      try {
        localStorage.removeItem('ceos_user');
      } catch (e) {}
    }
    return Promise.reject(error);
  }
);

export default apiClient;
