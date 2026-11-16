// This optional history cache is not an authentication source.
export function readUserCache() {
  try { return JSON.parse(localStorage.getItem('ceos_user')) || null; }
  catch { return null; }
}

export function cacheUser(user) {
  if (!user?.id) { localStorage.removeItem('ceos_user'); return; }
  localStorage.setItem('ceos_user', JSON.stringify({ id: user.id, historico: Array.isArray(user.historico) ? user.historico : [] }));
}

export function syncHistory(ownerId, historico) {
  if (!ownerId || readUserCache()?.id !== ownerId) return false;
  cacheUser({ id: ownerId, historico });
  window.dispatchEvent(new CustomEvent('ceos:historicoUpdated', { detail: historico }));
  return true;
}
