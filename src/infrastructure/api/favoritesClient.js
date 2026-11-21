import apiClient from './apiClient';
import { loginApiUrl } from '../../config/apiConfig';

function normalizeFavorite(item) {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    id: String(item.id || item._id || ''),
  };
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Lists the authenticated user's persisted favorites.
 */
export async function listFavorites() {
  const res = await apiClient.get(`${loginApiUrl}/favorites`);
  const items = Array.isArray(res?.data?.data) ? res.data.data : [];
  return items.map(normalizeFavorite);
}

/**
 * Adds a favorite item for the authenticated user.
 */
export async function addFavorite({ resourceId, resourceType, nome, descricao, metadata } = {}) {
  const payload = {
    resourceId,
    resourceType,
    nome,
    ...(typeof descricao === 'string' ? { descricao } : {}),
    ...(isPlainObject(metadata) ? { metadata } : {}),
  };
  const res = await apiClient.post(`${loginApiUrl}/favorites`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return normalizeFavorite(res?.data?.data || res?.data);
}

/**
 * Removes a favorite by its id.
 */
export async function removeFavorite(id) {
  await apiClient.delete(`${loginApiUrl}/favorites/${encodeURIComponent(id)}`);
}
