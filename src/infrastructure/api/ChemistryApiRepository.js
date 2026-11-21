import apiClient from './mathApiClient';
import { getApiError, unwrapMathData, unwrapMathResult } from './mathApiResponse';

import { mathApiUrl as apiUrl } from '../../config/apiConfig';

function buildUrl(action) {
  // Backend currently exposes chemical solution calculations under /solucoes
  if (!action) return `${apiUrl}/solucoes`;
  const a = String(action).replace(/^\/+/, '');
  return `${apiUrl}/solucoes/${a}`;
}

function buildAreaUrl(area, action) {
  const a = String(action || '').replace(/^\/+/, '');
  return a ? `${apiUrl}/${area}/${a}` : `${apiUrl}/${area}`;
}

async function postStructured(url, payload) {
  const fallback = `Erro ao chamar ${url}`;
  try {
    const res = await apiClient.post(url, payload || {}, { headers: { 'Content-Type': 'application/json' } });
    return unwrapMathData(res, fallback);
  } catch (err) {
    if (err?.response) {
      throw new Error(getApiError(err.response, err.message || fallback));
    }
    throw err;
  }
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

  /**
   * Executes a stoichiometry calculation and returns the full structured MathAPI payload.
   */
  async calcularEstequiometria({ action, data } = {}) {
    const url = buildAreaUrl('estequiometria', action);
    return postStructured(url, data);
  }

  /**
   * Executes a thermochemistry calculation and returns the full structured MathAPI payload.
   */
  async calcularTermoquimica({ action, data } = {}) {
    const url = buildAreaUrl('termoquimica', action);
    return postStructured(url, data);
  }
}
