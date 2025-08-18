import React, { useState } from 'react';
import axios from 'axios';
import { FaBroom } from 'react-icons/fa';

function AnaliseComb() {
  const [tipo, setTipo] = useState('permutacao');
  const [n, setN] = useState('');
  const [k, setK] = useState('');
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setResultado(null);
    setLoading(true);
    try {
      let url = `https://mathapi.onrender.com/analise/${tipo}`;
      let data = { n: Number(n) };
      if (k !== '') data.k = Number(k);
      const res = await axios.post(url, data);
      setResultado(res.data.resultado);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao calcular');
    } finally {
      setLoading(false);
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
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <a href="/">Home</a>
          </li>
          <li class="breadcrumb-item">
            <a href="/matematica">Matematica</a>
          </li>
          <li class="breadcrumb-item active" aria-current="page">
            Análise Combinatória
          </li>
        </ol>
      </nav>
    <div className="container mt-5 row">
      <h2 className="mb-4 text-center">Análise Combinatória</h2>
      <form className="card p-4 shadow-sm" onSubmit={handleSubmit} aria-label="Formulário de análise combinatória">
        <div className="mb-3">
          <label className="form-label">Tipo</label>
          <select className="form-select" value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="permutacao">Permutação</option>
            <option value="combinacao">Combinação</option>
            <option value="arranjo">Arranjo</option>
            <option value="arranjoRep">Arranjo com Repetição</option>
          </select>
        </div>
        <div className="row g-2">
          <div className="col">
            <input type="number" className="form-control" placeholder="n" value={n} onChange={e => setN(e.target.value)} required aria-label="Valor de n" />
          </div>
          <div className="col">
            <input type="number" className="form-control" placeholder="k (opcional)" value={k} onChange={e => setK(e.target.value)} aria-label="Valor de k" />
          </div>
        </div>
        <button className="btn btn-primary mt-3" type="submit" disabled={loading} aria-busy={loading} aria-label="Calcular análise combinatória">
          {loading ? 'Calculando...' : 'Calcular'}
        </button>
        <button
          type="button"
          className="btn btn-secondary mt-3 ms-2"
          onClick={handleClear}
          aria-label="Limpar campos"
          title="Limpar campos"
        >
          <FaBroom />
        </button>
        {resultado !== null && (
          <div className="alert alert-success mt-3" role="status">Resultado: {resultado}</div>
        )}
        {erro && <div className="alert alert-danger mt-3" role="alert">{erro}</div>}
      </form>
      <div className="mt-3 text-muted small">Preencha os campos e clique em Calcular para ver o resultado.</div>
    </div>
    </>
  );
}

export default AnaliseComb;
