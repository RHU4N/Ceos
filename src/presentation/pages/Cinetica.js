import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import PhysicsApiRepository from '../../infrastructure/api/PhysicsApiRepository';
import CalcularCinetica from '../../domain/usecases/CalcularCinetica';
import { useLoading } from '../context/LoadingContext';
import { useAuth } from '../context/AuthContext';
import { saveHistorico } from '../../infrastructure/api/historicoClient';
import { speak } from '../../hooks/useTTS';
import ExplanationCard from '../components/ExplanationCard';

const repo = new PhysicsApiRepository();

function Cinetica() {
  const [tipo, setTipo] = useState('velocidade');
  const [s0, setS0] = useState('');
  const [sf, setSf] = useState('');
  const [t0, setT0] = useState('');
  const [tf, setTf] = useState('');
  const [v0, setV0] = useState('');
  const [vf, setVf] = useState('');
  const [v, setV] = useState('');
  const [a, setA] = useState('');
  const [result, setResult] = useState(null);
  const [erro, setErro] = useState('');
  const { loading, setLoading } = useLoading();
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const values = location?.state?.initialValues;
    const subtype = location?.state?.subtype;
    if (values) {
      if (values.s0 !== undefined) setS0(String(values.s0));
      if (values.sf !== undefined) setSf(String(values.sf));
      if (values.t0 !== undefined) setT0(String(values.t0));
      if (values.tf !== undefined) setTf(String(values.tf));
      if (values.v0 !== undefined) setV0(String(values.v0));
      if (values.vf !== undefined) setVf(String(values.vf));
      if (values.v !== undefined) setV(String(values.v));
      if (values.a !== undefined) setA(String(values.a));
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
      if (t === 'velocidade') data = { s0: Number(s0), sf: Number(sf), t0: Number(t0), tf: Number(tf) };
      if (t === 'aceleracao') data = { v0: Number(v0), vf: Number(vf), t0: Number(t0), tf: Number(tf) };
      if (t === 'mru') data = { s0: Number(s0), v: Number(v), t: Number(tf) };
      if (t === 'mruv-posicao') data = { s0: Number(s0), v0: Number(v0), a: Number(a), t: Number(tf) };
      if (t === 'mruv-velocidade') data = { v0: Number(v0), a: Number(a), t: Number(tf) };
      if (t === 'torricelli') data = { v0: Number(v0), a: Number(a), s: Number(sf), s0: Number(s0) };
      if (t === 'mcu-velocidade-angular') data = { periodo: Number(tf) };
      if (t === 'mcu-velocidade-linear') data = { omega: Number(v), raio: Number(a) };
      if (t.startsWith('lancamento')) data = { v0: Number(v0), angulo: Number(a), t: Number(tf) };

      const calcular = new CalcularCinetica(new PhysicsApiRepository());
      const res = await calcular.execute({ action: tipo, data });
      setResult(res);
      try {
        if (user) {
          const valores = Object.entries(data).map(([k, v]) => `${k}=${v}`).join(', ');
          const resultadoStr = typeof res === 'object' ? JSON.stringify(res) : String(res);
          await saveHistorico({ tipo: `Fisica:Cinetica:${tipo}`, valores, resultado: resultadoStr });
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

  const handleClear = () => {
    setTipo('velocidade'); setS0(''); setSf(''); setT0(''); setTf(''); setV0(''); setVf(''); setV(''); setA(''); setResult(null); setErro('');
    setLoading(false);
    speak('Campos limpos');
  };

  const examples = {
    velocidade: { s0: 0, sf: 10, t0: 0, tf: 2, result: '5 m/s', formula: 'v = (sf - s0) / (tf - t0)' },
    aceleracao: { v0: 0, vf: 10, t0: 0, tf: 2, result: '5 m/s²', formula: 'a = (vf - v0) / (tf - t0)' },
    mru: { s0: 0, v: 5, tf: 2, result: '10', formula: 's = s0 + v*t' }
  };

  const fillExample = (key) => {
    const ex = examples[key] || {};
    setTipo(key);
    if (ex.s0 !== undefined) setS0(String(ex.s0)); else setS0('');
    if (ex.sf !== undefined) setSf(String(ex.sf)); else setSf('');
    if (ex.t0 !== undefined) setT0(String(ex.t0)); else setT0('');
    if (ex.tf !== undefined) setTf(String(ex.tf)); else setTf('');
    if (ex.v0 !== undefined) setV0(String(ex.v0)); else setV0('');
    if (ex.vf !== undefined) setVf(String(ex.vf)); else setVf('');
    if (ex.v !== undefined) setV(String(ex.v)); else setV('');
    if (ex.a !== undefined) setA(String(ex.a)); else setA('');
    speak('Exemplo copiado. ' + (ex.formula || ''));
  };

  const renderExplanation = (key) => {
    const ex = examples[key];
    if (!ex) return null;
    const pairs = Object.keys(ex).filter(k=>['s0','sf','t0','tf','v','v0','vf','a'].includes(k)).map(k=>`${k}=${ex[k]}`);
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
          <li className="breadcrumb-item active" aria-current="page">Cinemática</li>
        </ol>
      </nav>

      <div className="container mt-5">
        <div className="row justify-content-center">
          <h2 className="mb-4 text-center">Cinemática</h2>

          <form className="op-card p-4 col-12 col-md-10 col-lg-8" onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Tipo</label>
              <select className="form-select" value={tipo} onChange={e => { setTipo(e.target.value); speak(e.target.value); }} disabled={loading}>
                <option value="velocidade">Velocidade média</option>
                <option value="aceleracao">Aceleração média</option>
                <option value="mru">MRU (posição final)</option>
                <option value="mruv-posicao">MRUV (posição final)</option>
                <option value="mruv-velocidade">MRUV (velocidade final)</option>
                <option value="torricelli">Torricelli</option>
                <option value="mcu-velocidade-angular">MCU (velocidade angular)</option>
                <option value="mcu-velocidade-linear">MCU (velocidade linear)</option>
                <option value="lancamento-velocidade">Lançamento (velocidade)</option>
                <option value="lancamento-alcance">Lançamento (alcance)</option>
                <option value="lancamento-altura-maxima">Lançamento (altura máxima)</option>
                <option value="lancamento-tempo-voo">Lançamento (tempo de voo)</option>
              </select>
            </div>

            {/* Inputs: render a set of common inputs; many actions reuse these names */}
            <div className="row g-2">
              <div className="col">
                <input type="number" className="form-control" placeholder="s0" value={s0} onChange={e => setS0(e.target.value)} disabled={loading} />
              </div>
              <div className="col">
                <input type="number" className="form-control" placeholder="sf / s" value={sf} onChange={e => setSf(e.target.value)} disabled={loading} />
              </div>
              <div className="col">
                <input type="number" className="form-control" placeholder="t0" value={t0} onChange={e => setT0(e.target.value)} disabled={loading} />
              </div>
              <div className="col">
                <input type="number" className="form-control" placeholder="tf / t" value={tf} onChange={e => setTf(e.target.value)} disabled={loading} />
              </div>
            </div>

            <div className="row g-2 mt-2">
              <div className="col">
                <input type="number" className="form-control" placeholder="v0" value={v0} onChange={e => setV0(e.target.value)} disabled={loading} />
              </div>
              <div className="col">
                <input type="number" className="form-control" placeholder="vf" value={vf} onChange={e => setVf(e.target.value)} disabled={loading} />
              </div>
              <div className="col">
                <input type="number" className="form-control" placeholder="v / ω" value={v} onChange={e => setV(e.target.value)} disabled={loading} />
              </div>
              <div className="col">
                <input type="number" className="form-control" placeholder="a / raio / angulo" value={a} onChange={e => setA(e.target.value)} disabled={loading} />
              </div>
            </div>

            <button className="btn btn-primary mt-3" type="submit" disabled={loading}>{loading ? 'Calculando...' : 'Calcular'}</button>

            <div className="d-flex justify-content-center">
              <button type="button" className="btn btn-secondary mt-3 ms-2" onClick={handleClear}> 
                <FaWandMagicSparkles style={{ fontSize: 22, color: "#a883ee" }} />
                <span style={{ fontSize: 15, marginLeft: 8 }}>Limpar</span>
              </button>
            </div>

            {result !== null && (
              <div className="alert alert-success mt-3">{typeof result === 'object' ? JSON.stringify(result) : String(result)}</div>
            )}

            {erro && (<div className="alert alert-danger mt-3">{erro}</div>)}
            {renderExplanation(tipo)}
          </form>

          <div className="mt-3 text-muted small text-center">Preencha os campos e clique em Calcular para ver o resultado.</div>
        </div>
      </div>
    </>
  );
}

export default Cinetica;
