import apiClient from './apiClient';
const base = process.env.REACT_APP_API_LOGIN_URL;
export const iotApi = {
  get: async (path, params) => (await apiClient.get(`${base}${path}`, { params })).data,
  post: async (path, body, key) => (await apiClient.post(`${base}${path}`, body, { headers: key ? { 'Idempotency-Key': key } : {} })).data,
  patch: async (path, body) => (await apiClient.patch(`${base}${path}`, body)).data,
};
