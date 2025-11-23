import React from 'react';
import { Link } from 'react-router-dom';
import './Style.css'; // <-- ajuste para importar o CSS correto da página

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
    <h2 className="mb-2">Matemática</h2>
    <p className="text-muted">Escolha uma das áreas para acessar as fórmulas e ferramentas:</p>
  </div>

  {/* ROW CORRETA — Centraliza os cards */}
  <div className="row g-4 justify-content-center">

    {/* CARD 1 */}
    <div className="col-12 col-sm-6 col-md-4 d-flex justify-content-center">
      <Link to="/matematica/funcao" className="text-decoration-none">
        <div className="card shadow-sm card-affordance" tabIndex={0} title="Clique para ver funções" style={{ maxWidth: "260px" }}>
          <div className="card-body text-center">
            <h5 className="card-title">Função</h5>

            <img
              src="/image.png"
              alt="funções"
              style={{
                height: "15rem",
                width: "15rem",
                maxWidth: "25vw",
                minWidth: 32,
                pointerEvents: "none",
                borderRadius: 18,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.22)",
              }}
            />

            <p className="card-text mt-2">
              Cálculos e fórmulas de funções matemáticas.
            </p>
          </div>
        </div>
      </Link>
    </div>

    {/* CARD 2 */}
    <div className="col-12 col-sm-6 col-md-4 d-flex justify-content-center">
      <Link to="/matematica/analise-combinatoria" className="text-decoration-none">
        <div className="card shadow-sm card-affordance" tabIndex={0} title="Clique para ver análise combinatória" style={{ maxWidth: "260px" }}>
          <div className="card-body text-center">
            <h5 className="card-title">Análise Combinatória</h5>
            <img
              src="/analisecombinatoria.png"
              alt="analise combinatória"
              style={{
                height: "15rem",
                width: "15rem",
                maxWidth: "25vw",
                minWidth: 32,
                pointerEvents: "none",
                borderRadius: 18,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.22)",
              }}
            />
            <p className="card-text">Permutação, combinação e arranjo.</p>
          </div>
        </div>
      </Link>
    </div>

    {/* CARD 3 */}
    <div className="col-12 col-sm-6 col-md-4 d-flex justify-content-center">
      <Link to="/matematica/estatistica" className="text-decoration-none">
        <div className="card shadow-sm card-affordance" tabIndex={0} title="Clique para ver estatística" style={{ maxWidth: "260px" }}>
          <div className="card-body text-center">
            <h5 className="card-title">Estatística</h5>
            <img
              src="/estatistica.png"
              alt="estatística"
              style={{
                height: "15rem",
                width: "15rem",
                maxWidth: "25vw",
                minWidth: 32,
                pointerEvents: "none",
                borderRadius: 18,
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.22)",
              }}
            />
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
