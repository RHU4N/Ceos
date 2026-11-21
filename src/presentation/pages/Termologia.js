import React from 'react';
import { Link } from 'react-router-dom';
import SiteImage from '../components/SiteImage';
import { speak } from '../../hooks/useTTS';
import './Style.css';

function Termologia() {
  return (
    <>
      <nav aria-label="breadcrumb" className="nav justify-content-center mt-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item"><Link to="/fisica">Física</Link></li>
          <li className="breadcrumb-item active" aria-current="page">Termologia</li>
        </ol>
      </nav>

      <div className="container mt-3">
        <div className="text-center mb-4">
          <h1 className="h2 mb-2" onMouseEnter={() => speak('Termologia')} onFocus={() => speak('Termologia')}>
            Termologia
          </h1>
          <p className="text-muted">Ferramentas de psicrometria e fenômenos térmicos:</p>
        </div>

        <div className="row g-4 justify-content-center">
          <div className="col-12 col-sm-6 col-md-4 d-flex align-items-stretch justify-content-center">
            <Link
              to="/fisica/termologia/ponto-de-orvalho"
              className="text-decoration-none"
              onMouseEnter={() => speak('Ponto de Orvalho')}
              onFocus={() => speak('Ponto de Orvalho')}
            >
              <div className="card shadow-sm card-affordance physics-card" title="Ponto de Orvalho">
                <div className="card-body text-center">
                  <h2 className="h5 card-title">Ponto de Orvalho</h2>
                  <SiteImage src="/energia.png" alt="ponto de orvalho" className="card-image" />
                  <p className="card-text mt-2">
                    Fórmula de Magnus com temperatura e umidade (Manual e IoT).
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default Termologia;
