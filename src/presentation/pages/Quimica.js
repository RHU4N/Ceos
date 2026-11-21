import SiteImage from '../components/SiteImage';
import React from 'react';
import { Link } from 'react-router-dom';
import './Style.css';
import { speak } from '../../hooks/useTTS';

function Quimica() {
  return (
    <>
      <nav aria-label="breadcrumb" className="nav justify-content-center mt-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item active" aria-current="page">Química</li>
        </ol>
      </nav>

      <div className="container mt-3">
        <div className="text-center mb-4">
          <h1 className="h2 mb-2" onMouseEnter={() => speak('Química')} onFocus={() => speak('Química')}>Química</h1>
          <p className="text-muted">Escolha uma das áreas para acessar as ferramentas químicas:</p>
        </div>

        <div className="row g-4 justify-content-center">

          <div className="col-12 col-sm-6 col-md-4 d-flex align-items-stretch justify-content-center">
            <Link to="/quimica/estequiometria" className="text-decoration-none" onMouseEnter={() => speak('Estequiometria')} onFocus={() => speak('Estequiometria')}>
              <div className="card shadow-sm card-affordance chemistry-card" title="Estequiometria">
                <div className="card-body text-center">
                  <h2 className="h5 card-title">Estequiometria</h2>
                  <SiteImage src="/estequiometria.png" alt="estequiometria" className="card-image" />
                  <p className="card-text mt-2">Balanceamento racional, massa molar, conversões e reagente limitante.</p>
                </div>
              </div>
            </Link>
          </div>

          <div className="col-12 col-sm-6 col-md-4 d-flex align-items-stretch justify-content-center">
            <Link to="/solucoes" className="text-decoration-none" onMouseEnter={() => speak('Soluções')} onFocus={() => speak('Soluções')}>
              <div className="card shadow-sm card-affordance chemistry-card" title="Soluções">
                <div className="card-body text-center">
                  <h2 className="h5 card-title">Soluções</h2>
                  <SiteImage src="/concentracao.png" alt="soluções" className="card-image" />
                  <p className="card-text mt-2">Molaridade, molalidade, densidade, fração molar e concentração comum.</p>
                </div>
              </div>
            </Link>
          </div>

          <div className="col-12 col-sm-6 col-md-4 d-flex align-items-stretch justify-content-center">
            <Link to="/quimica/termoquimica" className="text-decoration-none" onMouseEnter={() => speak('Termoquímica')} onFocus={() => speak('Termoquímica')}>
              <div className="card shadow-sm card-affordance chemistry-card" title="Termoquímica">
                <div className="card-body text-center">
                  <h2 className="h5 card-title">Termoquímica</h2>
                  <SiteImage src="/termoquimica.png" alt="termoquimica" className="card-image" />
                  <p className="card-text mt-2">Calor sensível, variação de temperatura, entalpia e processos.</p>
                </div>
              </div>
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}

export default Quimica;
