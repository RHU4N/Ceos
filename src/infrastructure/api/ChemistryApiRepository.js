import apiClient from './mathApiClient';
import { unwrapMathResult } from './mathApiResponse';

import { mathApiUrl as apiUrl } from '../../config/apiConfig';

function buildUrl(action) {
  // Backend currently exposes chemical solution calculations under /solucoes
  if (!action) return `${apiUrl}/solucoes`;
  const a = String(action).replace(/^\/+/, '');
  return `${apiUrl}/solucoes/${a}`;
}

export default class ChemistryApiRepository {
  async calcular({ action, data } = {}) {
    const url = buildUrl(action);
    // The concentration page names the amount `moles`; the API expects `soluto`.
    const payload = action === 'molaridade' && data?.moles !== undefined && data?.soluto === undefined
      ? { soluto: data.moles, volume: data.volume }
      : data || {};
    const res = await apiClient.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
    return unwrapMathResult(res, `Erro ao chamar ${url}`);
  }
}
