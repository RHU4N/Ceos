import React from 'react';
import { Link } from 'react-router-dom';
import './Style.css';
import { speak } from '../../hooks/useTTS';

function Quimica() {
  return (
    <>
      <nav aria-label="breadcrumb" className="nav justify-content-center mt-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="/">Home</a></li>
          <li className="breadcrumb-item active" aria-current="page">Química</li>
        </ol>
      </nav>

      <div className="container mt-3">
        <div className="text-center mb-4">
          <h2 className="mb-2" onMouseEnter={() => speak('Química')} onFocus={() => speak('Química')}>Química</h2>
          <p className="text-muted">Escolha uma das áreas para acessar as ferramentas químicas:</p>
        </div>

        <div className="row g-4 justify-content-center">

          <div className="col-12 col-sm-6 col-md-4 d-flex align-items-stretch justify-content-center">
            <div className="card shadow-sm chemistry-card card-disabled d-flex align-items-center justify-content-center" aria-disabled="true" tabIndex={-1} title="Em breve">
              <div className="card-body text-center">
                <h5 className="card-title">Estequiometria</h5>
                <img src="/estequiometria.png" alt="estequiometria" className="card-image" />
                <p className="card-text mt-2">Balanceamento e cálculos estequiométricos.</p>
                <div className="small text-muted mt-2">Em breve</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-md-4 d-flex align-items-stretch justify-content-center">
            <Link to="/solucoes" className="text-decoration-none" onMouseEnter={() => speak('Soluções')} onFocus={() => speak('Soluções')}>
              <div className="card shadow-sm card-affordance chemistry-card" tabIndex={0} title="Soluções">
                <div className="card-body text-center">
                  <h5 className="card-title">Soluções</h5>
                  <img src="/concentracao.png" alt="soluções" className="card-image" />
                  <p className="card-text mt-2">Molaridade, molalidade, densidade, fração molar e concentração comum.</p>
                </div>
              </div>
            </Link>
          </div>

          <div className="col-12 col-sm-6 col-md-4 d-flex align-items-stretch justify-content-center">
            <div className="card shadow-sm chemistry-card card-disabled d-flex align-items-center justify-content-center" aria-disabled="true" tabIndex={-1} title="Em breve">
              <div className="card-body text-center">
                <h5 className="card-title">Termoquímica</h5>
                <img src="/termoquimica.png" alt="termoquimica" className="card-image" />
                <p className="card-text mt-2">Entalpia e calor trocado.</p>
                <div className="small text-muted mt-2">Em breve</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default Quimica;
