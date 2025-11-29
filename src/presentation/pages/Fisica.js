import React from 'react';
import { Link } from 'react-router-dom';
import './Style.css';
import { speak } from '../../hooks/useTTS';

function Fisica() {
  return (
    <>
      <nav aria-label="breadcrumb" className="nav justify-content-center mt-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a href="/">Home</a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Física
          </li>
        </ol>
      </nav>

      <div className="container mt-3">

        <div className="text-center mb-4">
          <h2 className="mb-2" onMouseEnter={() => speak('Física')} onFocus={() => speak('Física')}>Física</h2>
          <p className="text-muted">Escolha uma das áreas de Física para acessar as ferramentas:</p>
        </div>

        <div className="row g-4 justify-content-center">

          <div className="col-12 col-sm-6 col-md-4 d-flex align-items-stretch justify-content-center">
            <Link to="/fisica/cinetica" className="text-decoration-none" onMouseEnter={() => speak('Cinemática')} onFocus={() => speak('Cinemática')}>
              <div className="card shadow-sm card-affordance physics-card" tabIndex={0} title="Cinemática">
                <div className="card-body text-center">
                  <h5 className="card-title">Cinemática</h5>
                  <img src="/cinetica.jpg" alt="cinemática" className="card-image" />
                  <p className="card-text mt-2">Velocidade, aceleração e movimento.</p>
                </div>
              </div>
            </Link>
          </div>

          <div className="col-12 col-sm-6 col-md-4 d-flex align-items-stretch justify-content-center">
            <Link to="/fisica/dinamica" className="text-decoration-none" onMouseEnter={() => speak('Dinâmica')} onFocus={() => speak('Dinâmica')}>
              <div className="card shadow-sm card-affordance physics-card" tabIndex={0} title="Dinâmica">
                <div className="card-body text-center">
                  <h5 className="card-title">Dinâmica</h5>
                  <img src="/dinamica.png" alt="dinâmica" className="card-image" />
                  <p className="card-text">Forças, leis de Newton e aplicações.</p>
                </div>
              </div>
            </Link>
          </div>

          <div className="col-12 col-sm-6 col-md-4 d-flex align-items-stretch justify-content-center">
            <Link to="/fisica/energia" className="text-decoration-none" onMouseEnter={() => speak('Energia')} onFocus={() => speak('Energia')}>
              <div className="card shadow-sm card-affordance physics-card" tabIndex={0} title="Energia">
                <div className="card-body text-center">
                  <h5 className="card-title">Energia</h5>
                  <img src="/energia.png" alt="energia" className="card-image" />
                  <p className="card-text">Trabalho, energia cinética e potencial.</p>
                </div>
              </div>
            </Link>
          </div>

        </div>

      </div>
    </>
  );
}

export default Fisica;
