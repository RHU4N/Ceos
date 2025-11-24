import apiClient from './apiClient';

const apiUrl = process.env.REACT_APP_MATH_API_URL || process.env.REACT_APP_API_MATH_URL;

function buildUrl(area, action) {
  if (!action) return `${apiUrl}/${area}`;
  // ensure no leading slash on action
  let a = String(action).replace(/^\/+/, '');
  // If caller passed a hyphenated action that encodes a nested path, convert it to the
  // backend route form used by mathApi. Examples:
  //  - 'mruv-posicao' -> 'mruv/posicao'
  //  - 'mcu-velocidade-angular' -> 'mcu/velocidade-angular'
  //  - 'lancamento-velocidade' -> 'lancamento-obliquo/velocidade'
  if (!a.includes('/')) {
    if (a.startsWith('lancamento-')) {
      a = 'lancamento-obliquo/' + a.replace(/^lancamento-/, '');
    } else if (a.includes('-')) {
      // replace only the first hyphen with a slash
      a = a.replace('-', '/');
    }
  }
  return `${apiUrl}/${area}/${a}`;
}

export default class PhysicsApiRepository {
  async calcularCinetica({ action, data } = {}) {
    const url = buildUrl('cinetica', action);
    const res = await apiClient.post(url, data || {}, { headers: { 'Content-Type': 'application/json' } });
    if (!res || res.status >= 400) throw new Error(res?.data?.error || `Erro ao chamar ${url}`);
    return res.data.resultado ?? res.data;
  }

  async calcularDinamica({ action, data } = {}) {
    const url = buildUrl('dinamica', action);
    const res = await apiClient.post(url, data || {}, { headers: { 'Content-Type': 'application/json' } });
    if (!res || res.status >= 400) throw new Error(res?.data?.error || `Erro ao chamar ${url}`);
    return res.data.resultado ?? res.data;
  }

  async calcularEnergia({ action, data } = {}) {
    const url = buildUrl('energia', action);
    const res = await apiClient.post(url, data || {}, { headers: { 'Content-Type': 'application/json' } });
    if (!res || res.status >= 400) throw new Error(res?.data?.error || `Erro ao chamar ${url}`);
    return res.data.resultado ?? res.data;
  }
}
