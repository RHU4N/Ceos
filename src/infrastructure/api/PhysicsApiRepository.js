import apiClient from './apiClient';

const apiUrl = process.env.REACT_APP_MATH_API_URL || process.env.REACT_APP_API_MATH_URL;

function buildUrl(area, action) {
  if (!action) return `${apiUrl}/${area}`;
  // ensure no leading slash on action
  let a = String(action).replace(/^\/+/, '');
  // The backend (`mathApi`) uses different naming conventions per area:
  // - Some routes are nested with slashes (e.g. 'mruv/posicao', 'lancamento-obliquo/velocidade')
  // - Others use hyphenated names (e.g. 'forca-resultante', 'forca-atrito')
  // To avoid accidental conversion of hyphens to slashes we maintain an explicit
  // mapping of frontend action keys to backend routes for the known special cases.
  const specialMap = {
    cinetica: {
      'mruv-posicao': 'mruv/posicao',
      'mruv-velocidade': 'mruv/velocidade',
      'mcu-velocidade-angular': 'mcu/velocidade-angular',
      'mcu-velocidade-linear': 'mcu/velocidade-linear',
      'lancamento-velocidade': 'lancamento-obliquo/velocidade',
      'lancamento-alcance': 'lancamento-obliquo/alcance',
      'lancamento-altura-maxima': 'lancamento-obliquo/altura-maxima',
      'lancamento-tempo-voo': 'lancamento-obliquo/tempo-voo',
    },
    // other areas don't need slash conversion; keep action as-is unless mapped
    dinamica: {
      // no nested routes expected; backend uses hyphenated names like 'forca-resultante'
    },
    energia: {
      // backend uses hyphenated names for energia strategies (handled as-is)
    }
  };

  if (specialMap[area] && specialMap[area][a]) {
    a = specialMap[area][a];
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
