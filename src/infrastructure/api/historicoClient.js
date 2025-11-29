import apiClient from './apiClient';

const apiUrl = process.env.REACT_APP_API_LOGIN_URL;

export async function saveHistorico({ tipo, valores, resultado }) {
  // valores and resultado should be strings (or serializable). Caller may stringify.
  const payload = { tipo, valores, resultado };
  const res = await apiClient.post(`${apiUrl}/users/historico`, payload, { headers: { 'Content-Type': 'application/json' } });
  // after saving, refresh current historico and sync localStorage + emit event
  try {
    const latest = await fetchHistorico();
    try {
      const su = localStorage.getItem('ceos_user');
      if (su) {
        const parsed = JSON.parse(su);
        parsed.historico = Array.isArray(latest) ? latest : [];
        localStorage.setItem('ceos_user', JSON.stringify(parsed));
      }
    } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent('ceos:historicoUpdated', { detail: Array.isArray(latest) ? latest : [] }));
      // show toast
      try { window.dispatchEvent(new CustomEvent('ceos:toast', { detail: { type: 'success', message: 'Histórico salvo com sucesso' } })); } catch (e) {}
    } catch (e) {}
    return latest;
  } catch (e) {
    // if fetch fails, still return server response
    try { window.dispatchEvent(new CustomEvent('ceos:toast', { detail: { type: 'warning', message: 'Operação salva, mas não foi possível atualizar o histórico local' } })); } catch (err) {}
    return res.data;
  }
}

export async function fetchHistorico() {
  try {
    const res = await apiClient.get(`${apiUrl}/users/historico`);
    return res.data;
  } catch (err) {
    try { window.dispatchEvent(new CustomEvent('ceos:toast', { detail: { type: 'warning', message: err.response?.data?.error || 'Erro ao buscar histórico' } })); } catch (e) {}
    // return empty array on failure to avoid breaking UI
    return [];
  }
}

export async function clearHistorico() {
  const res = await apiClient.delete(`${apiUrl}/users/historico`);
  try {
    const latest = await fetchHistorico();
    try {
      const su = localStorage.getItem('ceos_user');
      if (su) {
        const parsed = JSON.parse(su);
        parsed.historico = Array.isArray(latest) ? latest : [];
        localStorage.setItem('ceos_user', JSON.stringify(parsed));
      }
    } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent('ceos:historicoUpdated', { detail: Array.isArray(latest) ? latest : [] }));
      try { window.dispatchEvent(new CustomEvent('ceos:toast', { detail: { type: 'success', message: 'Histórico limpo com sucesso' } })); } catch (e) {}
    } catch (e) {}
    return latest;
  } catch (e) {
    try { window.dispatchEvent(new CustomEvent('ceos:toast', { detail: { type: 'warning', message: 'Histórico limpo, mas não foi possível atualizar localmente' } })); } catch (err) {}
    return res.data;
  }
}

export async function deleteHistoricoItem(id) {
  const res = await apiClient.delete(`${apiUrl}/users/historico/${id}`);
  try {
    const latest = await fetchHistorico();
    try {
      const su = localStorage.getItem('ceos_user');
      if (su) {
        const parsed = JSON.parse(su);
        parsed.historico = Array.isArray(latest) ? latest : [];
        localStorage.setItem('ceos_user', JSON.stringify(parsed));
      }
    } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent('ceos:historicoUpdated', { detail: Array.isArray(latest) ? latest : [] }));
      try { window.dispatchEvent(new CustomEvent('ceos:toast', { detail: { type: 'success', message: 'Item do histórico removido' } })); } catch (e) {}
    } catch (e) {}
    return latest;
  } catch (e) {
    try { window.dispatchEvent(new CustomEvent('ceos:toast', { detail: { type: 'warning', message: 'Item removido, falha ao atualizar localmente' } })); } catch (err) {}
    return res.data;
  }
}
