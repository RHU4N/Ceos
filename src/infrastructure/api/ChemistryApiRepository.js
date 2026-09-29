import apiClient from './mathApiClient';
import { unwrapMathResult } from './mathApiResponse';

const apiUrl = process.env.REACT_APP_MATH_API_URL || process.env.REACT_APP_API_MATH_URL;

function buildUrl(action) {
  // Backend currently exposes chemical solution calculations under /solucoes
  if (!action) return `${apiUrl}/solucoes`;
  const a = String(action).replace(/^\/+/, '');
  return `${apiUrl}/solucoes/${a}`;
}

export default class ChemistryApiRepository {
  async calcular({ action, data } = {}) {
    const url = buildUrl(action);
    const res = await apiClient.post(url, data || {}, { headers: { 'Content-Type': 'application/json' } });
    return unwrapMathResult(res, `Erro ao chamar ${url}`);
  }
}
