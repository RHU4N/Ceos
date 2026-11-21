import axios from 'axios';
import { loginApiUrl as authBaseUrl } from '../../config/apiConfig';

// O JWT é mantido pelo navegador em um cookie HttpOnly, não no localStorage.
const apiClient = axios.create({ withCredentials: true });
let refreshPromise = null;

function isSessionEndpoint(config) {
  return /\/auth\/(login|refresh|logout)(?:\?|$)/.test(String(config?.url || ''));
}

function hasStoredSessionHint() {
  try {
    return Boolean(localStorage.getItem('ceos_user'));
  } catch (e) {
    return false;
  }
}

// Visitante anônimo sem cookie e sem sessão prévia recebe 401 NO_TOKEN em
// /auth/me; não disparamos /auth/refresh para evitar erro 400 desnecessário no
// console, mas preservamos o refresh para tokens expirados ou sessões existentes.
function shouldSkipAnonymousRefresh(request, error) {
  const url = String(request?.url || '');
  const code = error?.response?.data?.error?.code;
  return /\/auth\/me(?:\?|$)/.test(url) && code === 'NO_TOKEN' && !hasStoredSessionHint();
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
    if (
      status === 401 &&
      request &&
      !request._ceosRetried &&
      !isSessionEndpoint(request) &&
      !shouldSkipAnonymousRefresh(request, error)
    ) {
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
    const finalStatus = error?.response?.status;
    const finalCode = error?.response?.data?.error?.code;
    if (finalStatus === 401 || (finalStatus === 400 && finalCode === 'MISSING_REFRESH_TOKEN')) {
      try {
        localStorage.removeItem('ceos_user');
      } catch (e) {}
    }
    return Promise.reject(error);
  }
);

export default apiClient;
