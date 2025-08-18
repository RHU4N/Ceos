import React, { useState } from 'react';
import axios from 'axios';
import { FaBroom } from 'react-icons/fa';

function Estatistica() {
  const [tipo, setTipo] = useState('media');
  const [numeros, setNumeros] = useState('');
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setResultado(null);
    setLoading(true);
    try {
      let url = `https://mathapi.onrender.com/estatistica/${tipo}`;
      let data = { numeros: numeros.split(',').map(Number) };
      const res = await axios.post(url, data);
      setResultado(res.data.resultado);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao calcular');
    } finally {
      setLoading(false);
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
            <a href="/">Home</a>
          </li>
          <li class="breadcrumb-item">
            <a href="/matematica">Matematica</a>
          </li>
          <li class="breadcrumb-item active" aria-current="page">
            Estatísticas
          </li>
        </ol>
      </nav>
    <div className="container mt-5 row">
      <h2 className="mb-4 text-center">Estatística</h2>
      <form className="card p-4 shadow-sm" onSubmit={handleSubmit} aria-label="Formulário de estatística">
        <div className="mb-3">
          <label className="form-label">Tipo</label>
          <select className="form-select" value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="media">Média</option>
            <option value="mediana">Mediana</option>
            <option value="moda">Moda</option>
          </select>
        </div>
        <div className="mb-3">
          <input type="text" className="form-control" placeholder="Números separados por vírgula (ex: 1,2,3)" value={numeros} onChange={e => setNumeros(e.target.value)} required aria-label="Números para estatística" />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading} aria-busy={loading} aria-label="Calcular estatística">
          {loading ? 'Calculando...' : 'Calcular'}
        </button>
        <button
          type="button"
          className="btn btn-secondary ms-2"
          onClick={handleClear}
          aria-label="Limpar campos"
          title="Limpar campos"
        >
          <FaBroom />
        </button>
        {resultado !== null && (
          <div className="alert alert-success mt-3" role="status">Resultado: {Array.isArray(resultado) ? resultado.join(', ') : resultado}</div>
        )}
        {erro && <div className="alert alert-danger mt-3" role="alert">{erro}</div>}
      </form>
      <div className="mt-3 text-muted small">Digite os números separados por vírgula e clique em Calcular para ver o resultado.</div>
    </div>
    </>
  );
}

export default Estatistica;
