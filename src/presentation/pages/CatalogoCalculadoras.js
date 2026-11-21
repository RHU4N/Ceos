import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AREAS, CALCULATORS } from '../../constants/calculatorCatalog';
import SiteImage from '../components/SiteImage';
import FavoriteButton from '../components/FavoriteButton';
import { speak } from '../../hooks/useTTS';
import './Style.css';

function getCardVariant(area) {
  if (area === 'fisica') return 'physics-card';
  if (area === 'quimica') return 'chemistry-card';
  return 'math-card';
}

function CatalogoCalculadoras() {
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState('todas');

  const filteredCalculators = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CALCULATORS.filter((calc) => {
      if (areaFilter !== 'todas' && calc.area !== areaFilter) return false;
      if (!q) return true;
      return (
        calc.title.toLowerCase().includes(q) ||
        calc.detail.toLowerCase().includes(q) ||
        calc.areaTitle.toLowerCase().includes(q) ||
        String(calc.subarea || '').toLowerCase().includes(q)
      );
    });
  }, [search, areaFilter]);

  return (
    <>
      <nav aria-label="breadcrumb" className="nav justify-content-center mt-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item active" aria-current="page">Calculadoras</li>
        </ol>
      </nav>

      <div className="container mt-3">
        <div className="w-100 text-center mb-3">
          <h1 className="h2" onMouseEnter={() => speak('Catálogo de Calculadoras')} onFocus={() => speak('Catálogo de Calculadoras')}>
            Catálogo de Calculadoras
          </h1>
          <p className="text-muted">
            Explore todas as calculadoras de Matemática, Física e Química em um só lugar.
          </p>

          <div className="row justify-content-center g-2 mt-2">
            <div className="col-12 col-md-6">
              <input
                type="search"
                className="form-control"
                placeholder="Buscar calculadora por nome, área ou assunto..."
                aria-label="Buscar calculadora"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="d-flex justify-content-center gap-2 flex-wrap mt-3" role="group" aria-label="Filtrar por área">
            <button
              type="button"
              className={`ceos-tab-btn ${areaFilter === 'todas' ? 'ceos-tab-btn--active' : ''}`}
              onClick={() => setAreaFilter('todas')}
            >
              Todas ({CALCULATORS.length})
            </button>
            {AREAS.map((area) => (
              <button
                key={area.key}
                type="button"
                className={`ceos-tab-btn ${areaFilter === area.key ? 'ceos-tab-btn--active' : ''}`}
                onClick={() => setAreaFilter(area.key)}
              >
                {area.title}
              </button>
            ))}
          </div>
        </div>

        {filteredCalculators.length === 0 ? (
          <div className="alert alert-secondary w-100 text-center">
            Nenhuma calculadora encontrada para o filtro informado.
          </div>
        ) : (
          <div className="row g-4 justify-content-center w-100">
            {filteredCalculators.map((calc) => (
              <div
                key={calc.key}
                className="col-12 col-sm-6 col-md-4 d-flex align-items-stretch justify-content-center"
              >
                <div className={`card shadow-sm ceos-catalog-card ${getCardVariant(calc.area)}`}>
                  <div className="card-body text-center w-100">
                    <div className="w-100">
                      <span className="badge text-bg-light border mb-2">
                        {calc.areaTitle}{calc.subarea ? ` · ${calc.subarea}` : ''}
                      </span>
                      <h2 className="h5 card-title">{calc.title}</h2>
                      <SiteImage src={calc.image} alt={calc.title} className="card-image" />
                      <p className="card-text mt-2">{calc.detail}</p>
                    </div>

                    <div className="d-flex flex-column align-items-center gap-2 w-100 mt-3">
                      <Link
                        to={calc.route}
                        className="btn btn-primary btn-sm w-100"
                        onClick={() => speak(`Abrindo ${calc.title}`)}
                      >
                        Abrir {calc.title}
                      </Link>
                      <FavoriteButton
                        resourceId={calc.resourceId}
                        resourceType={calc.resourceType}
                        nome={calc.title}
                        descricao={calc.detail}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default CatalogoCalculadoras;
