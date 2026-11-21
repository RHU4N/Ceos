import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaRegStar, FaStar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useTTS } from '../../hooks/useTTS';

function FavoriteButton({
  resourceId,
  resourceType = 'calculation',
  nome,
  descricao,
  metadata,
  className = '',
}) {
  const auth = useAuth();
  const user = auth?.user || null;
  const { isFavorited, toggleFavorite } = useFavorites();
  const { speak } = useTTS();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [showAuthNotice, setShowAuthNotice] = useState(false);

  const favorited = Boolean(user && isFavorited(resourceId, resourceType));

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setNotice('');
    setShowAuthNotice(false);

    if (!user) {
      setShowAuthNotice(true);
      setNotice('Entre na sua conta para salvar favoritos.');
      try {
        window.dispatchEvent(
          new CustomEvent('ceos:toast', {
            detail: { type: 'info', message: 'Entre na sua conta para salvar favoritos.' },
          })
        );
      } catch (err) {}
      speak('Entre na sua conta para salvar favoritos');
      return;
    }

    setBusy(true);
    try {
      const res = await toggleFavorite({
        resourceId,
        resourceType,
        nome,
        descricao,
        metadata,
      });
      if (res?.error) {
        setNotice(res.error);
        speak('Não foi possível atualizar favoritos');
      } else if (res?.favorited) {
        speak('Adicionado aos favoritos');
      } else {
        speak('Removido dos favoritos');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`d-inline-flex flex-column align-items-center gap-1 ${className}`}>
      <button
        type="button"
        className={`btn btn-sm ceos-btn-fav ${favorited ? 'ceos-btn-fav--active' : ''}`}
        onClick={handleClick}
        disabled={busy}
        aria-pressed={favorited}
        title={
          !user
            ? 'Entre na sua conta para favoritar'
            : favorited
            ? 'Remover dos favoritos'
            : 'Adicionar aos favoritos'
        }
      >
        {favorited ? <FaStar aria-hidden="true" /> : <FaRegStar aria-hidden="true" />}
        <span>{busy ? 'Salvando...' : favorited ? 'Favoritado' : 'Favoritar'}</span>
      </button>
      {notice && (
        <small className="text-muted text-center" role="status">
          {notice}{' '}
          {showAuthNotice && (
            <Link to="/login" className="fw-semibold">
              Entrar
            </Link>
          )}
        </small>
      )}
    </div>
  );
}

export default FavoriteButton;
