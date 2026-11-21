import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaExternalLinkAlt, FaStar, FaTrash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { getCalculatorRoute } from '../../constants/calculatorCatalog';
import { speak } from '../../hooks/useTTS';
import './Style.css';

function resolveFavoriteRoute(fav) {
  if (!fav) return '/calculadoras';
  if (fav.resourceType === 'calculation') {
    return getCalculatorRoute(fav.resourceId) || '/calculadoras';
  }
  if (fav.resourceType === 'custom-function') {
    return `/funcoes-personalizadas?id=${encodeURIComponent(fav.resourceId)}`;
  }
  if (fav.resourceType === 'iot-device') {
    return '/iot';
  }
  return '/calculadoras';
}

function getResourceTypeLabel(resourceType) {
  if (resourceType === 'calculation') return 'Calculadora';
  if (resourceType === 'custom-function') return 'Função Personalizada';
  if (resourceType === 'iot-device') return 'Dispositivo IoT';
  return resourceType;
}

function Favoritos() {
  const { user } = useAuth();
  const { favorites, loading, error, refreshFavorites, removeFavoriteById } = useFavorites();
  const navigate = useNavigate();

  if (!user) {
    return (
      <>
        <nav aria-label="breadcrumb" className="nav justify-content-center mt-3">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Favoritos</li>
          </ol>
        </nav>
        <div className="container mt-5">
          <div className="row justify-content-center">
            <div className="col-12 col-md-8 text-center">
              <h2 className="mb-3">Favoritos</h2>
              <div className="alert alert-info">
                Entre na sua conta para visualizar e gerenciar seus itens favoritos.{' '}
                <Link to="/login" className="fw-bold">Ir para Login</Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <nav aria-label="breadcrumb" className="nav justify-content-center mt-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item active" aria-current="page">Favoritos</li>
        </ol>
      </nav>

      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <h2 className="mb-0 d-flex align-items-center gap-2">
                <FaStar style={{ color: '#f59e0b' }} />
                Favoritos
              </h2>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => refreshFavorites()}
                disabled={loading}
              >
                {loading ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>

            {error && <div className="alert alert-danger" role="alert">{error}</div>}

            {loading && favorites.length === 0 ? (
              <div className="card p-4 text-center">Carregando favoritos...</div>
            ) : favorites.length === 0 ? (
              <div className="card p-4 text-center">
                <div className="card-body">
                  <p className="mb-2">Você ainda não favoritou nenhuma calculadora ou função.</p>
                  <Link to="/calculadoras" className="btn btn-primary btn-sm">
                    Explorar Calculadoras
                  </Link>
                </div>
              </div>
            ) : (
              <div className="list-group">
                {favorites.map((fav) => {
                  const targetRoute = resolveFavoriteRoute(fav);
                  return (
                    <div
                      key={fav.id}
                      className="list-group-item d-flex justify-content-between align-items-center gap-3 flex-wrap"
                    >
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <strong>{fav.nome}</strong>
                          <span className="badge text-bg-light border">
                            {getResourceTypeLabel(fav.resourceType)}
                          </span>
                        </div>
                        {fav.descricao && <div className="text-muted small mt-1">{fav.descricao}</div>}
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                          onClick={() => {
                            speak(`Abrindo ${fav.nome}`);
                            navigate(targetRoute);
                          }}
                        >
                          <FaExternalLinkAlt aria-hidden="true" />
                          <span>Abrir</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                          onClick={async () => {
                            await removeFavoriteById(fav.id);
                            speak('Favorito removido');
                          }}
                        >
                          <FaTrash aria-hidden="true" />
                          <span>Remover</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Favoritos;
