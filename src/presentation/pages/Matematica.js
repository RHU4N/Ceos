import React from 'react';
import { Link } from 'react-router-dom';
import './Style.css'; // <-- ajuste para importar o CSS correto da página
import { speak } from '../../hooks/useTTS';

function Matematica() {
  return (
    <>
    <nav aria-label="breadcrumb" className="nav justify-content-center mt-3">
  <ol className="breadcrumb">
    <li className="breadcrumb-item">
      <a href="/">Home</a>
    </li>
    <li className="breadcrumb-item active" aria-current="page">
      Matemática
    </li>
  </ol>
</nav>

<div className="container mt-3">

  <div className="text-center mb-4">
    <h2 className="mb-2" onMouseEnter={() => speak('Matemática')} onFocus={() => speak('Matemática')}>Matemática</h2>
    <p className="text-muted">Escolha uma das áreas para acessar as fórmulas e ferramentas:</p>
  </div>

  {/* ROW CORRETA — Centraliza os cards */}
  <div className="row g-4 justify-content-center">

    {/* CARD 1 */}
    <div className="col-12 col-sm-6 col-md-4 d-flex align-items-stretch justify-content-center">
      <Link to="/matematica/funcao" className="text-decoration-none" onMouseEnter={() => speak('Função')} onFocus={() => speak('Função')}>
        <div className="card shadow-sm card-affordance math-card" tabIndex={0} title="Clique para ver funções">
          <div className="card-body text-center">
            <h5 className="card-title">Função</h5>

            <img src="/image.png" alt="funções" className="card-image" />

            <p className="card-text mt-2">Cálculos e fórmulas de funções matemáticas.</p>
          </div>
        </div>
      </Link>
    </div>

    {/* CARD 2 */}
    <div className="col-12 col-sm-6 col-md-4 d-flex align-items-stretch justify-content-center">
      <Link to="/matematica/analise-combinatoria" className="text-decoration-none" onMouseEnter={() => speak('Análise combinatória')} onFocus={() => speak('Análise combinatória')}>
        <div className="card shadow-sm card-affordance math-card" tabIndex={0} title="Clique para ver análise combinatória">
          <div className="card-body text-center">
            <h5 className="card-title">Análise Combinatória</h5>
            <img src="/analisecombinatoria.png" alt="analise combinatória" className="card-image" />
            <p className="card-text">Permutação, combinação e arranjo.</p>
          </div>
        </div>
      </Link>
    </div>

    {/* CARD 3 */}
    <div className="col-12 col-sm-6 col-md-4 d-flex align-items-stretch justify-content-center">
      <Link to="/matematica/estatistica" className="text-decoration-none" onMouseEnter={() => speak('Estatística')} onFocus={() => speak('Estatística')}>
        <div className="card shadow-sm card-affordance math-card" tabIndex={0} title="Clique para ver estatística">
          <div className="card-body text-center">
            <h5 className="card-title">Estatística</h5>
            <img src="/estatistica.png" alt="estatística" className="card-image" />
            <p className="card-text">Média, mediana e moda.</p>
          </div>
        </div>
      </Link>
    </div>

    {/* CARD 4 - Matemática Financeira */}
    <div className="col-12 col-sm-6 col-md-4 d-flex align-items-stretch justify-content-center">
      <Link to="/matematica/financeira" className="text-decoration-none" onMouseEnter={() => speak('Matemática financeira')} onFocus={() => speak('Matemática financeira')}>
        <div className="card shadow-sm card-affordance math-card" tabIndex={0} title="Clique para ver matemática financeira">
          <div className="card-body text-center">
            <h5 className="card-title">Matemática Financeira</h5>
            <img src="/financeiro.png" alt="matemática financeira" className="card-image" />
            <p className="card-text">Variação, juros simples e compostos.</p>
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
