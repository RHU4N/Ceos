import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import PhysicsApiRepository from '../../infrastructure/api/PhysicsApiRepository';
import CalcularDinamica from '../../domain/usecases/CalcularDinamica';
import { useLoading } from '../context/LoadingContext';
import { useAuth } from '../context/AuthContext';
import { saveHistorico } from '../../infrastructure/api/historicoClient';
import { speak } from '../../hooks/useTTS';
import ExplanationCard from '../components/ExplanationCard';

const repo = new PhysicsApiRepository();

function Dinamica() {
  const [tipo, setTipo] = useState('forca-resultante');
  const [m, setM] = useState('');
  const [g, setG] = useState('9.81');
  const [mu, setMu] = useState('');
  const [N, setN] = useState('');
  const [a, setA] = useState('');
  const [k, setK] = useState('');
  const [x, setX] = useState('');
  const [result, setResult] = useState(null);
  const [erro, setErro] = useState('');
  const { loading, setLoading } = useLoading();
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const values = location?.state?.initialValues;
    const subtype = location?.state?.subtype;
    if (values) {
      if (values.m !== undefined) setM(String(values.m));
      if (values.g !== undefined) setG(String(values.g));
      if (values.mu !== undefined) setMu(String(values.mu));
      if (values.N !== undefined) setN(String(values.N));
      if (values.a !== undefined) setA(String(values.a));
      if (values.k !== undefined) setK(String(values.k));
      if (values.x !== undefined) setX(String(values.x));
    }
    if (subtype) setTipo(subtype);
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setResult(null);
    setLoading(true);
    document.body.classList.add('loading-global');
    try {
      let data = {};
      const t = String(tipo).toLowerCase();
      if (t === 'forca-resultante') data = { m: Number(m), a: Number(a) };
      if (t === 'peso') data = { m: Number(m) };
      if (t === 'forca-atrito') data = { mu: Number(mu), N: Number(N) };
      if (t === 'forca-elastica') data = { k: Number(k), x: Number(x) };

      const calcular = new CalcularDinamica(new PhysicsApiRepository());
      const res = await calcular.execute({ action: tipo, data });
      setResult(res);
      try {
        if (user) {
          const valores = Object.entries(data).map(([k, v]) => `${k}=${v}`).join(', ');
          const resultadoStr = typeof res === 'object' ? JSON.stringify(res) : String(res);
          await saveHistorico({ tipo: `Fisica:Dinamica:${tipo}`, valores, resultado: resultadoStr });
        }
      } catch (err) {
        console.warn('Não foi possível salvar histórico:', err?.message || err);
      }
      speak(`Resultado: ${typeof res === 'object' ? JSON.stringify(res) : String(res)}`);
    } catch (err) {
      setErro(err.message || 'Erro ao calcular');
      speak('Erro ao calcular');
    } finally {
      setLoading(false);
      document.body.classList.remove('loading-global');
    }
  };

  const handleClear = () => { setTipo('forca-resultante'); setM(''); setG('9.81'); setMu(''); setN(''); setA(''); setK(''); setX(''); setResult(null); setErro(''); setLoading(false); speak('Campos limpos'); };

  const examples = {
    'forca-resultante': { m: 10, a: 2, result: '20 N', formula: 'F = m * a' },
    'peso': { m: 10, g: 9.81, result: '98.1 N', formula: 'P = m * g' },
    'forca-atrito': { mu: 0.3, N: 50, result: '15 N', formula: 'F_atrito = μ * N' },
    'forca-elastica': { k: 200, x: 0.1, result: '20 N', formula: 'F = k * x' }
  };

  const fillExample = (key) => {
    const ex = examples[key] || {};
    setTipo(key);
    if (ex.m !== undefined) setM(String(ex.m)); else setM('');
    if (ex.g !== undefined) setG(String(ex.g)); else setG('9.81');
    if (ex.a !== undefined) setA(String(ex.a)); else setA('');
    if (ex.mu !== undefined) setMu(String(ex.mu)); else setMu('');
    if (ex.N !== undefined) setN(String(ex.N)); else setN('');
    if (ex.k !== undefined) setK(String(ex.k)); else setK('');
    if (ex.x !== undefined) setX(String(ex.x)); else setX('');
    speak('Exemplo copiado. ' + (ex.formula || ''));
  };

  const renderExplanation = (key) => {
    const ex = examples[key];
    if (!ex) return null;
    const pairs = Object.keys(ex).filter(k=>['m','g','a','mu','N','k','x'].includes(k)).map(k=>`${k}=${ex[k]}`);
    return (
      <ExplanationCard
        formula={ex.formula}
        examplePairs={pairs}
        exampleText={pairs.join(', ') + (ex.result ? ` → ${ex.result}` : '')}
        onCopyExample={() => fillExample(key)}
      />
    );
  };

  return (
    <>
      <nav aria-label="breadcrumb" className="nav justify-content-center">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="/">Home</a></li>
          <li className="breadcrumb-item"><a href="/fisica">Física</a></li>
          <li className="breadcrumb-item active" aria-current="page">Dinâmica</li>
        </ol>
      </nav>

      <div className="container mt-5">
        <div className="row justify-content-center">
          <h2 className="mb-4 text-center">Dinâmica</h2>

          <form className="op-card p-4 col-12 col-md-10 col-lg-8" onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Tipo</label>
              <select className="form-select" value={tipo} onChange={e => { setTipo(e.target.value); speak(e.target.value); }} disabled={loading}>
                <option value="forca-resultante">Força resultante</option>
                <option value="peso">Peso</option>
                <option value="forca-atrito">Força de atrito</option>
                <option value="forca-elastica">Força elástica</option>
              </select>
            </div>

            <div className="row g-2">
              <div className="col">
                <input type="number" className="form-control" placeholder="massa (kg)" value={m} onChange={e => setM(e.target.value)} disabled={loading} />
              </div>
              <div className="col">
                <input type="number" className="form-control" placeholder="g (m/s²)" value={g} onChange={e => setG(e.target.value)} disabled={loading} />
              </div>
              <div className="col">
                <input type="number" className="form-control" placeholder="μ (coef. atrito)" value={mu} onChange={e => setMu(e.target.value)} disabled={loading} />
              </div>
              <div className="col">
                <input type="number" className="form-control" placeholder="N (força normal)" value={N} onChange={e => setN(e.target.value)} disabled={loading} />
              </div>
            </div>

            <div className="row g-2 mt-2">
              <div className="col">
                <input type="number" className="form-control" placeholder="a (aceleração)" value={a} onChange={e => setA(e.target.value)} disabled={loading} />
              </div>
              <div className="col">
                <input type="number" className="form-control" placeholder="k (constante elástica)" value={k} onChange={e => setK(e.target.value)} disabled={loading} />
              </div>
              <div className="col">
                <input type="number" className="form-control" placeholder="x (deformação)" value={x} onChange={e => setX(e.target.value)} disabled={loading} />
              </div>
            </div>

            <button className="btn btn-primary mt-3" type="submit" disabled={loading}>{loading ? 'Calculando...' : 'Calcular'}</button>

            <div className="d-flex justify-content-center">
              <button type="button" className="btn btn-secondary mt-3 ms-2" onClick={handleClear}>
                <FaWandMagicSparkles style={{ fontSize: 22, color: "#a883ee" }} />
                <span style={{ fontSize: 15, marginLeft: 8 }}>Limpar</span>
              </button>
            </div>

            {result !== null && (<div className="alert alert-success mt-3">{typeof result === 'object' ? JSON.stringify(result) : String(result)}</div>)}
            {erro && (<div className="alert alert-danger mt-3">{erro}</div>)}
            {renderExplanation(tipo)}
          </form>

          <div className="mt-3 text-muted small text-center">Preencha os campos e clique em Calcular para ver o resultado.</div>
        </div>
      </div>
    </>
  );
}

export default Dinamica;
