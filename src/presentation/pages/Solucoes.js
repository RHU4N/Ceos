import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import { useLoading } from '../context/LoadingContext';
import { useAuth } from '../context/AuthContext';
import { saveHistorico } from '../../infrastructure/api/historicoClient';
import CalcularQuimica from '../../domain/usecases/CalcularQuimica';
import ChemistryApiRepository from '../../infrastructure/api/ChemistryApiRepository';
import { speak } from '../../hooks/useTTS';
import ExplanationCard from '../components/ExplanationCard';

function Solucoes() {
  const [action, setAction] = useState('molaridade');
  const [soluto, setSoluto] = useState('');
  const [volume, setVolume] = useState('');
  const [solvente, setSolvente] = useState('');
  const [n1, setN1] = useState('');
  const [n2, setN2] = useState('');
  const [massa, setMassa] = useState('');
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const { loading, setLoading } = useLoading();
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const values = location?.state?.initialValues;
    const subtype = location?.state?.subtype;
    if (values) {
      if (values.soluto !== undefined) setSoluto(String(values.soluto));
      if (values.volume !== undefined) setVolume(String(values.volume));
      if (values.solvente !== undefined) setSolvente(String(values.solvente));
      if (values.n1 !== undefined) setN1(String(values.n1));
      if (values.n2 !== undefined) setN2(String(values.n2));
      if (values.massa !== undefined) setMassa(String(values.massa));
    }
    if (subtype) setAction(subtype);
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(''); setResultado(null); setLoading(true); document.body.classList.add('loading-global');
    try {
      const act = String(action).toLowerCase();
      let data = {};
      if (act === 'molaridade') data = { soluto: Number(soluto), volume: Number(volume) };
      if (act === 'concentracao-comum') data = { soluto: Number(soluto), volume: Number(volume) };
      if (act === 'molalidade') data = { soluto: Number(soluto), solvente: Number(solvente) };
      if (act === 'fracao-molar') data = { n1: Number(n1), n2: Number(n2) };
      if (act === 'densidade') data = { massa: Number(massa), volume: Number(volume) };

      const calcular = new CalcularQuimica(new ChemistryApiRepository());
      const res = await calcular.execute({ action: act, data });
      setResultado(res);
      try {
        if (user) {
          const valores = Object.entries(data).map(([k, v]) => `${k}=${v}`).join(', ');
          const resultadoStr = typeof res === 'object' ? JSON.stringify(res) : String(res);
          await saveHistorico({ tipo: `Quimica:Solucoes:${act}`, valores, resultado: resultadoStr });
        }
      } catch (err) {
        console.warn('Não foi possível salvar histórico:', err?.message || err);
      }
      speak('Resultado: ' + (typeof res === 'object' ? JSON.stringify(res) : String(res)));
    } catch (err) {
      setErro(err.message || 'Erro ao calcular');
      speak('Erro ao calcular');
    } finally {
      setLoading(false); document.body.classList.remove('loading-global');
    }
  };

  const handleClear = () => {
    setAction('molaridade'); setSoluto(''); setVolume(''); setSolvente(''); setN1(''); setN2(''); setMassa(''); setResultado(null); setErro(''); setLoading(false); speak('Campos limpos');
  };

  const examples = {
    'molaridade': { soluto: 3, volume: 1, result: '3 mol/L', formula: 'M = soluto / volume' },
    'concentracao-comum': { soluto: 10, volume: 2, result: '5 g/L', formula: 'C = soluto / volume' },
    'molalidade': { soluto: 2, solvente: 0.5, result: '4 mol/kg', formula: 'm = soluto / solvente' },
    'fracao-molar': { n1: 2, n2: 3, result: '0.4', formula: 'X1 = n1 / (n1 + n2)' },
    'densidade': { massa: 10, volume: 5, result: '2 g/mL', formula: 'ρ = massa / volume' }
  };

  const fillExample = (actKey) => {
    const ex = examples[actKey] || {};
    setAction(actKey);
    if (ex.soluto !== undefined) setSoluto(String(ex.soluto));
    if (ex.volume !== undefined) setVolume(String(ex.volume));
    if (ex.solvente !== undefined) setSolvente(String(ex.solvente));
    if (ex.n1 !== undefined) setN1(String(ex.n1));
    if (ex.n2 !== undefined) setN2(String(ex.n2));
    if (ex.massa !== undefined) setMassa(String(ex.massa));
    // speak a confirmation and the formula (TTS enabled, no separate "Ouvir" button)
    speak('Exemplo copiado para o formulário. ' + (ex.formula || ''));
  };

  const renderExplanation = (actKey) => {
    const ex = examples[actKey];
    if (!ex) return null;
    const pairs = Object.keys(ex).filter(k => ['soluto','volume','solvente','n1','n2','massa'].includes(k)).map(k => `${k}=${ex[k]}`);
    return (
      <ExplanationCard
        formula={ex.formula}
        examplePairs={pairs}
        exampleText={pairs.join(', ') + (ex.result ? ` → ${ex.result}` : '')}
        onCopyExample={() => fillExample(actKey)}
      />
    );
  };

  return (
    <>
      <nav aria-label="breadcrumb" className="nav justify-content-center mt-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="/">Home</a></li>
          <li className="breadcrumb-item"><a href="/quimica">Química</a></li>
          <li className="breadcrumb-item active" aria-current="page">Soluções</li>
        </ol>
      </nav>

      <div className="container mt-5">
        <div className="row justify-content-center">
          <h2 className="mb-4 text-center">Soluções</h2>

          <form className="op-card p-4 col-12 col-md-10 col-lg-8" onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Operação</label>
              <select className="form-select" value={action} onChange={e => { setAction(e.target.value); speak(e.target.value); }} disabled={loading}>
                <option value="concentracao-comum">Concentração comum (g/L)</option>
                <option value="molaridade">Molaridade (mol/L)</option>
                <option value="molalidade">Molalidade (mol/kg)</option>
                <option value="fracao-molar">Fração molar</option>
                <option value="densidade">Densidade (g/mL)</option>
              </select>
            </div>

            {(action === 'concentracao-comum' || action === 'molaridade' || action === 'densidade') && (
              <div className="row g-2">
                <div className="col">
                  <input type="number" className="form-control" placeholder="soluto (g ou mol conforme operação)" value={soluto} onChange={e => setSoluto(e.target.value)} disabled={loading} />
                </div>
                <div className="col">
                  <input type="number" className="form-control" placeholder="volume (L ou mL conforme operação)" value={volume} onChange={e => setVolume(e.target.value)} disabled={loading} />
                </div>
              </div>
            )}

            {action === 'molalidade' && (
              <div className="row g-2">
                <div className="col">
                  <input type="number" className="form-control" placeholder="soluto (mol)" value={soluto} onChange={e => setSoluto(e.target.value)} disabled={loading} />
                </div>
                <div className="col">
                  <input type="number" className="form-control" placeholder="solvente (kg)" value={solvente} onChange={e => setSolvente(e.target.value)} disabled={loading} />
                </div>
              </div>
            )}

            {action === 'fracao-molar' && (
              <div className="row g-2">
                <div className="col">
                  <input type="number" className="form-control" placeholder="n1 (mol)" value={n1} onChange={e => setN1(e.target.value)} disabled={loading} />
                </div>
                <div className="col">
                  <input type="number" className="form-control" placeholder="n2 (mol)" value={n2} onChange={e => setN2(e.target.value)} disabled={loading} />
                </div>
              </div>
            )}

            <button className="btn btn-primary chemistry-btn mt-3 w-100" type="submit" disabled={loading}>{loading ? 'Calculando...' : 'Calcular'}</button>

            <div className="d-flex justify-content-center">
              <button type="button" className="btn btn-secondary mt-3 ms-2" onClick={handleClear} disabled={loading}>
                <FaWandMagicSparkles style={{ fontSize: 18, color: "#6b5cff" }} />
                <span style={{ fontSize: 15, marginLeft: 8 }}>Limpar</span>
              </button>
            </div>

            {resultado !== null && (
              <div className="alert alert-success mt-3">{typeof resultado === 'object' ? JSON.stringify(resultado) : String(resultado)}</div>
            )}

            {erro && (<div className="alert alert-danger mt-3">{erro}</div>)}

            {renderExplanation(action)}
          </form>

          <div className="mt-3 text-muted small text-center">Use as operações disponíveis para cálculos de soluções químicas.</div>
        </div>
      </div>
    </>
  );
}

export default Solucoes;
