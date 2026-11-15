import apiClient from './apiClient';
import { loginApiUrl as base } from '../../config/apiConfig';
export const iotApi = {
  get: async (path, params) => (await apiClient.get(`${base}${path}`, { params })).data,
  post: async (path, body, key) => (await apiClient.post(`${base}${path}`, body, { headers: key ? { 'Idempotency-Key': key } : {} })).data,
  patch: async (path, body) => (await apiClient.patch(`${base}${path}`, body)).data,
};
