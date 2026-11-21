import apiClient from './apiClient';
import { loginApiUrl } from '../../config/apiConfig';

function normalizeCustomFunction(item) {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    id: String(item.id || item._id || ''),
  };
}

/**
 * Lists all custom functions owned by the authenticated user.
 */
export async function listCustomFunctions() {
  const res = await apiClient.get(`${loginApiUrl}/custom-functions`);
  const items = Array.isArray(res?.data?.data) ? res.data.data : [];
  return items.map(normalizeCustomFunction);
}

/**
 * Fetches a single custom function by id.
 */
export async function getCustomFunction(id) {
  const res = await apiClient.get(`${loginApiUrl}/custom-functions/${encodeURIComponent(id)}`);
  return normalizeCustomFunction(res?.data?.data || res?.data);
}

/**
 * Creates a new custom function.
 */
export async function createCustomFunction(payload) {
  const res = await apiClient.post(`${loginApiUrl}/custom-functions`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return normalizeCustomFunction(res?.data?.data || res?.data);
}

/**
 * Updates an existing custom function by id.
 */
export async function updateCustomFunction(id, payload) {
  const res = await apiClient.patch(`${loginApiUrl}/custom-functions/${encodeURIComponent(id)}`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return normalizeCustomFunction(res?.data?.data || res?.data);
}

/**
 * Deletes a custom function by id.
 */
export async function deleteCustomFunction(id) {
  await apiClient.delete(`${loginApiUrl}/custom-functions/${encodeURIComponent(id)}`);
}

/**
 * Validates formula syntax and parameter declarations on the backend.
 */
export async function validateCustomFunction({ formula, parametros = [] }) {
  const res = await apiClient.post(
    `${loginApiUrl}/custom-functions/validate`,
    { formula, parametros },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return res?.data?.data || res?.data;
}

/**
 * Executes a custom function with numeric parameter values.
 */
export async function executeCustomFunction(id, valores) {
  const res = await apiClient.post(
    `${loginApiUrl}/custom-functions/${encodeURIComponent(id)}/execute`,
    { valores: valores || {} },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return res?.data?.data || res?.data;
}
