import React, { useState } from 'react';
// import axios from 'axios';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import './Style.css'; // <-- ajuste para importar o CSS correto da página

import MathApiRepository from '../../infrastructure/api/MathApiRepository';
import CalcularAnaliseComb from '../../domain/usecases/CalcularAnaliseComb';
import { useLoading } from '../context/LoadingContext';

function AnaliseComb() {
  const [tipo, setTipo] = useState('permutacao');
  const [n, setN] = useState('');
  const [k, setK] = useState('');
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const { loading, setLoading } = useLoading();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setResultado(null);
    setLoading(true);
    document.body.classList.add('loading-global');
    const mathRepository = new MathApiRepository();
    const calcularAnaliseComb = new CalcularAnaliseComb(mathRepository);
    try {
      let data = { n: Number(n) };
      if (k !== '') data.k = Number(k);
      const resultado = await calcularAnaliseComb.execute({ tipo, data });
      setResultado(resultado);
    } catch (err) {
      setErro(err.message || 'Erro ao calcular');
    } finally {
      setLoading(false);
      document.body.classList.remove('loading-global');
    }
  };

  const handleClear = () => {
    setTipo('permutacao');
    setN('');
    setK('');
    setResultado(null);
    setErro('');
    setLoading(false);
  };

  return (
    <>
    <nav aria-label="breadcrumb" className='nav justify-content-center'>
  <ol className="breadcrumb">
    <li className="breadcrumb-item">
      <a
        href="/"
        tabIndex={loading ? -1 : 0}
        style={{ pointerEvents: loading ? 'none' : undefined, opacity: loading ? 0.6 : undefined }}
        onClick={e => loading && e.preventDefault()}
      >Home</a>
    </li>

    <li className="breadcrumb-item">
      <a
        href="/matematica"
        tabIndex={loading ? -1 : 0}
        style={{ pointerEvents: loading ? 'none' : undefined, opacity: loading ? 0.6 : undefined }}
        onClick={e => loading && e.preventDefault()}
      >Matemática</a>
    </li>

    <li className="breadcrumb-item active" aria-current="page">
      Análise Combinatória
    </li>
  </ol>
</nav>

{/* ESTRUTURA CORRIGIDA */}
<div className="container mt-5">
  <div className="row justify-content-center">

    <h2 className="mb-4 text-center">Análise Combinatória</h2>

    <form
      className="op-card p-4 col-12 col-md-10 col-lg-8"
      onSubmit={handleSubmit}
      aria-label="Formulário de análise combinatória"
    >
      <div className="mb-3">
        <label className="form-label">Tipo</label>
        <select
          className="form-select"
          value={tipo}
          onChange={e => setTipo(e.target.value)}
          disabled={loading}
        >
          <option value="permutacao">Permutação</option>
          <option value="combinacao">Combinação</option>
          <option value="arranjo">Arranjo</option>
          <option value="arranjoRep">Arranjo com Repetição</option>
        </select>
      </div>

      <div className="row g-2">
        <div className="col">
          <input
            type="number"
            className="form-control"
            placeholder="n"
            value={n}
            onChange={e => setN(e.target.value)}
            required
            aria-label="Valor de n"
            disabled={loading}
          />
        </div>

        <div className="col">
          <input
            type="number"
            className="form-control"
            placeholder="k (opcional)"
            value={k}
            onChange={e => setK(e.target.value)}
            aria-label="Valor de k"
            disabled={loading}
          />
        </div>
      </div>

      <button
        className="btn btn-primary mt-3"
        type="submit"
        disabled={loading}
        aria-busy={loading}
        aria-label="Calcular análise combinatória"
      >
        {loading ? 'Calculando...' : 'Calcular'}
      </button>

      <div className="d-flex justify-content-center">
        <button
          type="button"
          className="btn btn-secondary mt-3 ms-2"
          onClick={handleClear}
          aria-label="Limpar campos"
          title="Limpar campos"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontWeight: 600,
            width: '120px'
          }}
        >
          <FaWandMagicSparkles style={{ fontSize: 22, color: "#a883ee" }} />
          <span style={{ fontSize: 15 }}>Limpar</span>
        </button>
      </div>

      {resultado !== null && (
        <div className="alert alert-success mt-3" role="status">{resultado}</div>
      )}

      {erro && (
        <div className="alert alert-danger mt-3" role="alert">{erro}</div>
      )}
    </form>

    <div className="mt-3 text-muted small text-center">
      Preencha os campos e clique em Calcular para ver o resultado.
    </div>
  </div>
</div>

    </>
  );
}

export default AnaliseComb;
