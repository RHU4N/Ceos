import apiClient from './apiClient';
import { loginApiUrl as base } from '../../config/apiConfig';
async function translated(call) {
  try { return await call(); } catch (error) {
    if (/timeout|timed out|abort/i.test(error.message || '')) error.message = 'Tempo de conexão esgotado. Tente novamente.';
    else if (/Network Error|Failed to fetch|Network request failed|fetch failed/i.test(error.message || '')) error.message = 'Não foi possível conectar ao serviço IoT. Verifique a conexão.';
    else if (/Request failed with status code/i.test(error.message || '')) error.message = 'O serviço IoT está indisponível no momento. Tente novamente.';
    throw error;
  }
}
export const iotApi = {
  get: (path, params) => translated(async () => (await apiClient.get(`${base}${path}`, { params })).data),
  post: (path, body, key) => translated(async () => (await apiClient.post(`${base}${path}`, body, { headers: key ? { 'Idempotency-Key': key } : {} })).data),
  patch: (path, body) => translated(async () => (await apiClient.patch(`${base}${path}`, body)).data),
};
