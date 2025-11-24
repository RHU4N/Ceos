import React, { useState } from 'react';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import { useLoading } from '../context/LoadingContext';
import CalcularQuimica from '../../domain/usecases/CalcularQuimica';
import ChemistryApiRepository from '../../infrastructure/api/ChemistryApiRepository';
import { speak } from '../../hooks/useTTS';

function Concentracao() {
  const [action, setAction] = useState('molaridade');
  const [massaSoluto, setMassaSoluto] = useState('');
  const [massaSolucao, setMassaSolucao] = useState('');
  const [moles, setMoles] = useState('');
  const [volume, setVolume] = useState('');
  const [equivalentes, setEquivalentes] = useState('');
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const { loading, setLoading } = useLoading();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(''); setResultado(null); setLoading(true); document.body.classList.add('loading-global');
    try {
      const act = String(action).toLowerCase();
      let data = {};
      if (act === 'molaridade') data = { moles: Number(moles), volume: Number(volume) };
      if (act === 'normalidade') data = { equivalentes: Number(equivalentes), volume: Number(volume) };
      if (act === 'percentual') data = { massa_soluto: Number(massaSoluto), massa_solucao: Number(massaSolucao) };

      const calcular = new CalcularQuimica(new ChemistryApiRepository());
      const res = await calcular.execute({ action: act, data });
      setResultado(res);
      speak('Resultado: ' + (typeof res === 'object' ? JSON.stringify(res) : String(res)));
    } catch (err) {
      setErro(err.message || 'Erro ao calcular');
      speak('Erro ao calcular');
    } finally {
      setLoading(false); document.body.classList.remove('loading-global');
    }
  };

  const handleClear = () => { setAction('molaridade'); setMassaSoluto(''); setMassaSolucao(''); setMoles(''); setVolume(''); setEquivalentes(''); setResultado(null); setErro(''); setLoading(false); speak('Campos limpos'); };

  const examples = {
    molaridade: { moles: 2, volume: 1, result: '2 mol/L', formula: 'M = moles / volume' },
    normalidade: { equivalentes: 1, volume: 0.5, result: '2 N', formula: 'N = equivalentes / volume' },
    percentual: { massa_soluto: 10, massa_solucao: 100, result: '10 %', formula: '% = massa_soluto / massa_solucao * 100' }
  };

  const fillExample = (key) => {
    const ex = examples[key] || {};
    setAction(key);
    if (ex.moles !== undefined) setMoles(String(ex.moles)); else setMoles('');
    if (ex.volume !== undefined) setVolume(String(ex.volume)); else setVolume('');
    if (ex.equivalentes !== undefined) setEquivalentes(String(ex.equivalentes)); else setEquivalentes('');
    if (ex.massa_soluto !== undefined) setMassaSoluto(String(ex.massa_soluto)); else setMassaSoluto('');
    if (ex.massa_solucao !== undefined) setMassaSolucao(String(ex.massa_solucao)); else setMassaSolucao('');
    speak('Exemplo copiado. ' + (ex.formula || ''));
  };

  const renderExplanation = (key) => {
    const ex = examples[key];
    if (!ex) return null;
    return (
      <div className="card mt-3 chemistry-explain">
        <div className="card-body">
          <h6 className="card-title">Como a conta é feita</h6>
          <p><strong>Fórmula:</strong> {ex.formula}</p>
          <p><strong>Exemplo:</strong> {Object.keys(ex).filter(k=>['moles','volume','equivalentes','massa_soluto','massa_solucao'].includes(k)).map(k=>`${k}=${ex[k]}`).join(', ')} → <em>{ex.result}</em></p>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => fillExample(key)}>Copiar exemplo</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <nav aria-label="breadcrumb" className="nav justify-content-center mt-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="/">Home</a></li>
          <li className="breadcrumb-item"><a href="/quimica">Química</a></li>
          <li className="breadcrumb-item active" aria-current="page">Concentração</li>
        </ol>
      </nav>

      <div className="container mt-5">
        <div className="row justify-content-center">
          <h2 className="mb-4 text-center">Concentração</h2>

          <form className="op-card p-4 col-12 col-md-10 col-lg-8" onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Tipo</label>
              <select className="form-select" value={action} onChange={e => { setAction(e.target.value); speak(e.target.value); }} disabled={loading}>
                <option value="molaridade">Molaridade</option>
                <option value="normalidade">Normalidade</option>
                <option value="percentual">Percentual</option>
              </select>
            </div>

            {action === 'molaridade' && (
              <div className="row g-2">
                <div className="col">
                  <input type="number" className="form-control" placeholder="moles" value={moles} onChange={e => setMoles(e.target.value)} disabled={loading} />
                </div>
                <div className="col">
                  <input type="number" className="form-control" placeholder="volume (L)" value={volume} onChange={e => setVolume(e.target.value)} disabled={loading} />
                </div>
              </div>
            )}

            {action === 'normalidade' && (
              <div className="row g-2">
                <div className="col">
                  <input type="number" className="form-control" placeholder="equivalentes" value={equivalentes} onChange={e => setEquivalentes(e.target.value)} disabled={loading} />
                </div>
                <div className="col">
                  <input type="number" className="form-control" placeholder="volume (L)" value={volume} onChange={e => setVolume(e.target.value)} disabled={loading} />
                </div>
              </div>
            )}

            {action === 'percentual' && (
              <div className="row g-2">
                <div className="col">
                  <input type="number" className="form-control" placeholder="massa soluto (g)" value={massaSoluto} onChange={e => setMassaSoluto(e.target.value)} disabled={loading} />
                </div>
                <div className="col">
                  <input type="number" className="form-control" placeholder="massa solução (g)" value={massaSolucao} onChange={e => setMassaSolucao(e.target.value)} disabled={loading} />
                </div>
              </div>
            )}

            <button className="btn btn-primary mt-3 w-100" type="submit" disabled={loading}>{loading ? 'Calculando...' : 'Calcular'}</button>

            <div className="d-flex justify-content-center">
              <button type="button" className="btn btn-secondary mt-3 ms-2" onClick={handleClear}>
                <FaWandMagicSparkles style={{ fontSize: 22, color: "#a883ee" }} />
                <span style={{ fontSize: 15, marginLeft: 8 }}>Limpar</span>
              </button>
            </div>

            {resultado !== null && (
              <div className="alert alert-success mt-3">{typeof resultado === 'object' ? JSON.stringify(resultado) : String(resultado)}</div>
            )}
            {erro && (<div className="alert alert-danger mt-3">{erro}</div>)}
            {renderExplanation(action)}
          </form>

          <div className="mt-3 text-muted small text-center">Preencha os campos e clique em Calcular para ver o resultado.</div>
        </div>
      </div>
    </>
  );
}

export default Concentracao;
