import React from 'react';
import { Link } from 'react-router-dom';

function Matematica() {
  return (
    <>
    <nav aria-label="breadcrumb" className='nav justify-content-center'>
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <a href="/">Home</a>
          </li>
          <li class="breadcrumb-item active" aria-current="page">Matemática
          </li>
        </ol>
      </nav>
    <div className="container mt-5 row aling-items-center justify-content-center">
      <h2 className="mb-4 text-center">Matemática</h2>
      <p className="text-muted mb-4 text-center">Escolha uma das áreas para acessar as fórmulas e ferramentas:</p>
      <div className="row g-4">
        <div className="col-md-4">
          <Link to="/matematica/funcao" className="text-decoration-none">
            <div className="card h-100 shadow-sm card-affordance" tabIndex={0} title="Clique para ver funções">
              <div className="card-body text-center">
                <h5 className="card-title">Função</h5>
                <p className="card-text">Cálculos e fórmulas de funções matemáticas.</p>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-4">
          <Link to="/matematica/analise-combinatoria" className="text-decoration-none">
            <div className="card h-100 shadow-sm card-affordance" tabIndex={0} title="Clique para ver análise combinatória">
              <div className="card-body text-center">
                <h5 className="card-title">Análise Combinatória</h5>
                <p className="card-text">Permutação, combinação e arranjo.</p>
              </div>
            </div>
          </Link>
        </div>
        <div className="col-md-4">
          <Link to="/matematica/estatistica" className="text-decoration-none">
            <div className="card h-100 shadow-sm card-affordance" tabIndex={0} title="Clique para ver estatística">
              <div className="card-body text-center">
                <h5 className="card-title">Estatística</h5>
                <p className="card-text">Média, mediana e moda.</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}

export default Matematica;
