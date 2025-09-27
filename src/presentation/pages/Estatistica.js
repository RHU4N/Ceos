import React, { useState } from 'react';
// import axios from 'axios';
import { FaWandMagicSparkles } from 'react-icons/fa6';

import MathApiRepository from '../../infrastructure/api/MathApiRepository';
import CalcularEstatistica from '../../domain/usecases/CalcularEstatistica';
import { useLoading } from '../context/LoadingContext';

function Estatistica() {
  const [tipo, setTipo] = useState('media');
  const [numeros, setNumeros] = useState('');
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
    const calcularEstatistica = new CalcularEstatistica(mathRepository);
    try {
      let data = { numeros: numeros.split(',').map(Number) };
      const resultado = await calcularEstatistica.execute({ tipo, data });
      setResultado(resultado);
    } catch (err) {
      setErro(err.message || 'Erro ao calcular');
    } finally {
      setLoading(false);
      document.body.classList.remove('loading-global');
    }
  };

  const handleClear = () => {
    setTipo('media');
    setNumeros('');
    setResultado(null);
    setErro('');
    setLoading(false);
  };

  return (
    <>
    <nav aria-label="breadcrumb" className='nav justify-content-center'>
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <a
              href="/"
              tabIndex={loading ? -1 : 0}
              style={{ pointerEvents: loading ? 'none' : undefined, opacity: loading ? 0.6 : undefined }}
              onClick={e => loading && e.preventDefault()}
            >Home</a>
          </li>
          <li class="breadcrumb-item">
            <a
              href="/matematica"
              tabIndex={loading ? -1 : 0}
              style={{ pointerEvents: loading ? 'none' : undefined, opacity: loading ? 0.6 : undefined }}
              onClick={e => loading && e.preventDefault()}
            >Matematica</a>
          </li>
          <li class="breadcrumb-item active" aria-current="page">
            Estatísticas
          </li>
        </ol>
      </nav>
    <div className="container mt-5 row justify-content-center">
      <h2 className="mb-4 text-center">Estatística</h2>
      <form className="card p-4 shadow-sm col-12 col-md-10 col-lg-8 mx-auto" onSubmit={handleSubmit} aria-label="Formulário de estatística">
        <div className="mb-3">
          <label className="form-label">Tipo</label>
          <select className="form-select" value={tipo} onChange={e => setTipo(e.target.value)} disabled={loading}>
            <option value="media">Média</option>
            <option value="mediana">Mediana</option>
            <option value="moda">Moda</option>
          </select>
        </div>
        <div className="mb-3">
          <input type="text" className="form-control" placeholder="Números separados por vírgula (ex: 1,2,3)" value={numeros} onChange={e => setNumeros(e.target.value)} required aria-label="Números para estatística" disabled={loading} />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading} aria-busy={loading} aria-label="Calcular estatística">
          {loading ? 'Calculando...' : 'Calcular'}
        </button>
        <div className="d-flex justify-content-center">
          <button
            type="button"
            className="btn btn-secondary ms-2"
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
          <div className="alert alert-success mt-3" role="status">Resultado: {Array.isArray(resultado) ? resultado.join(', ') : resultado}</div>
        )}
        {erro && <div className="alert alert-danger mt-3" role="alert">{erro}</div>}
      </form>
      <div className="mt-3 text-muted small text-center">Digite os números separados por vírgula e clique em Calcular para ver o resultado.</div>
    </div>
    </>
  );
}

export default Estatistica;
