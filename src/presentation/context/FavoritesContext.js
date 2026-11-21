import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { addFavorite, listFavorites, removeFavorite } from '../../infrastructure/api/favoritesClient';

const DEFAULT_CONTEXT = {
  favorites: [],
  loading: false,
  error: '',
  refreshFavorites: async () => [],
  isFavorited: () => false,
  getFavorite: () => null,
  toggleFavorite: async () => ({ favorited: false }),
  removeFavoriteById: async () => ({ removed: false }),
};

const FavoritesContext = createContext(DEFAULT_CONTEXT);

function emitToast(type, message) {
  try {
    window.dispatchEvent(new CustomEvent('ceos:toast', { detail: { type, message } }));
  } catch (e) {}
}

function getErrorMessage(err, fallback) {
  return err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || fallback;
}

export function FavoritesProvider({ children }) {
  const auth = useAuth();
  const user = auth?.user || null;
  const userKey = user?.id || user?._id || null;
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const loadVersion = useRef(0);

  const refreshFavorites = useCallback(async () => {
    if (!userKey) {
      setFavorites([]);
      setError('');
      setLoading(false);
      return [];
    }
    const version = ++loadVersion.current;
    setLoading(true);
    setError('');
    try {
      const items = await listFavorites();
      if (loadVersion.current !== version) return [];
      setFavorites(items);
      return items;
    } catch (err) {
      if (loadVersion.current !== version) return [];
      const msg = getErrorMessage(err, 'Erro ao carregar favoritos.');
      setError(msg);
      return [];
    } finally {
      if (loadVersion.current === version) {
        setLoading(false);
      }
    }
  }, [userKey]);

  useEffect(() => {
    loadVersion.current++;
    if (!userKey) {
      setFavorites([]);
      setError('');
      setLoading(false);
      return;
    }
    refreshFavorites();
  }, [userKey, refreshFavorites]);

  const getFavorite = useCallback(
    (resourceId, resourceType) => {
      if (!resourceId) return null;
      const targetId = String(resourceId);
      return (
        favorites.find(
          (item) =>
            item.resourceId === targetId &&
            (!resourceType || item.resourceType === resourceType)
        ) || null
      );
    },
    [favorites]
  );

  const isFavorited = useCallback(
    (resourceId, resourceType) => Boolean(getFavorite(resourceId, resourceType)),
    [getFavorite]
  );

  const toggleFavorite = useCallback(
    async ({ resourceId, resourceType, nome, descricao, metadata }) => {
      if (!userKey) {
        return { requiresAuth: true, favorited: false };
      }
      setError('');
      const existing = getFavorite(resourceId, resourceType);
      if (existing) {
        try {
          await removeFavorite(existing.id);
          setFavorites((prev) => prev.filter((item) => item.id !== existing.id));
          emitToast('info', 'Removido dos favoritos');
          return { favorited: false };
        } catch (err) {
          if (err?.response?.status === 404) {
            setFavorites((prev) => prev.filter((item) => item.id !== existing.id));
            return { favorited: false };
          }
          const msg = getErrorMessage(err, 'Não foi possível remover o favorito.');
          setError(msg);
          emitToast('warning', msg);
          return { favorited: true, error: msg };
        }
      }

      try {
        const created = await addFavorite({ resourceId, resourceType, nome, descricao, metadata });
        setFavorites((prev) => {
          const filtered = prev.filter((item) => item.id !== created.id && item.resourceId !== created.resourceId);
          return [created, ...filtered];
        });
        emitToast('success', 'Adicionado aos favoritos');
        return { favorited: true, item: created };
      } catch (err) {
        const status = err?.response?.status;
        const code = err?.response?.data?.error?.code;
        if (status === 409 || code === 'DUPLICATE_FAVORITE') {
          await refreshFavorites();
          emitToast('info', 'Item já estava nos favoritos');
          return { favorited: true, synced: true };
        }
        const msg = getErrorMessage(err, 'Não foi possível salvar o favorito.');
        setError(msg);
        emitToast('warning', msg);
        return { favorited: false, error: msg };
      }
    },
    [userKey, getFavorite, refreshFavorites]
  );

  const removeFavoriteById = useCallback(async (id) => {
    if (!id) return { removed: false };
    setError('');
    try {
      await removeFavorite(id);
      setFavorites((prev) => prev.filter((item) => item.id !== String(id)));
      emitToast('info', 'Favorito removido');
      return { removed: true };
    } catch (err) {
      const msg = getErrorMessage(err, 'Não foi possível remover o favorito.');
      setError(msg);
      emitToast('warning', msg);
      return { removed: false, error: msg };
    }
  }, []);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        loading,
        error,
        refreshFavorites,
        isFavorited,
        getFavorite,
        toggleFavorite,
        removeFavoriteById,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
