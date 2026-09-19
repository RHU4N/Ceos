import axios from 'axios';

// O JWT é mantido pelo navegador em um cookie HttpOnly, não no localStorage.
const apiClient = axios.create({ withCredentials: true });

// Uma resposta 401 limpa dados locais, mas não redireciona globalmente: a
// checagem inicial de sessão (/auth/me) é esperada para visitantes anônimos e
// as páginas públicas devem continuar acessíveis.
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error && error.response && error.response.status;
    const apiMessage = error?.response?.data?.error?.message;
    if (apiMessage) error.message = apiMessage;
    if (status === 401) {
      try {
        localStorage.removeItem('ceos_user');
      } catch (e) {}
    }
    return Promise.reject(error);
  }
);

export default apiClient;
