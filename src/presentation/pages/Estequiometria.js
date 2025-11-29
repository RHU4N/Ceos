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

function Estequiometria() {
  const [action, setAction] = useState('balanceamento');
  const [equation, setEquation] = useState('H2 + O2 -> H2O');
  const [massa, setMassa] = useState('');
  const [massaMol, setMassaMol] = useState('');
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const { loading, setLoading } = useLoading();
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const values = location?.state?.initialValues;
    const subtype = location?.state?.subtype;
    if (values) {
      if (values.equation !== undefined) setEquation(String(values.equation));
      if (values.massa !== undefined) setMassa(String(values.massa));
      if (values.massa_molar !== undefined) setMassaMol(String(values.massa_molar));
    }
    if (subtype) setAction(subtype);
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setResultado(null);
    setLoading(true);
    document.body.classList.add('loading-global');
    try {
      const data = {};
      const act = String(action).toLowerCase();
      if (act === 'balanceamento') data.equation = equation;
      if (act === 'calculo-reagente') data = { massa: Number(massa), massa_molar: Number(massaMol) };
      if (act === 'calculo-produto') data = { massa: Number(massa), massa_molar: Number(massaMol) };

      const calcular = new CalcularQuimica(new ChemistryApiRepository());
      const res = await calcular.execute({ action: act, data });
      setResultado(res);
      try {
        if (user) {
          const valores = Object.entries(data).map(([k, v]) => `${k}=${v}`).join(', ');
          const resultadoStr = typeof res === 'object' ? JSON.stringify(res) : String(res);
          await saveHistorico({ tipo: `Quimica:Estequiometria:${act}`, valores, resultado: resultadoStr });
        }
      } catch (err) {
        console.warn('Não foi possível salvar histórico:', err?.message || err);
      }
      speak('Resultado: ' + (typeof res === 'object' ? JSON.stringify(res) : String(res)));
    } catch (err) {
      setErro(err.message || 'Erro ao calcular');
      speak('Erro ao calcular');
    } finally {
      setLoading(false);
      document.body.classList.remove('loading-global');
    }
  };

  const handleClear = () => {
    setAction('balanceamento'); setEquation('H2 + O2 -> H2O'); setMassa(''); setMassaMol(''); setResultado(null); setErro('');
    setLoading(false);
    speak('Campos limpos');
  };

  const examples = {
    balanceamento: { equation: 'H2 + O2 -> H2O', result: '2 H2 + O2 -> 2 H2O', formula: 'Balanceamento por inspeção' },
    'calculo-reagente': { massa: 10, massa_molar: 18, result: '0.555 mol', formula: 'n = massa / massa_molar' },
    'calculo-produto': { massa: 5, massa_molar: 18, result: '0.278 mol', formula: 'n = massa / massa_molar' }
  };

  const fillExample = (key) => {
    const ex = examples[key] || {};
    setAction(key);
    if (ex.equation !== undefined) setEquation(String(ex.equation)); else setEquation('');
    if (ex.massa !== undefined) setMassa(String(ex.massa)); else setMassa('');
    if (ex.massa_molar !== undefined) setMassaMol(String(ex.massa_molar)); else setMassaMol('');
    speak('Exemplo copiado. ' + (ex.formula || ''));
  };

  const renderExplanation = (key) => {
    const ex = examples[key];
    if (!ex) return null;
    const pairs = Object.keys(ex).filter(k=>['equation','massa','massa_molar'].includes(k)).map(k=>`${k}=${ex[k]}`);
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
      <nav aria-label="breadcrumb" className="nav justify-content-center mt-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="/">Home</a></li>
          <li className="breadcrumb-item"><a href="/quimica">Química</a></li>
          <li className="breadcrumb-item active" aria-current="page">Estequiometria</li>
        </ol>
      </nav>

      <div className="container mt-5">
        <div className="row justify-content-center">
          <h2 className="mb-4 text-center">Estequiometria</h2>

          <form className="op-card p-4 col-12 col-md-10 col-lg-8" onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Ação</label>
              <select className="form-select" value={action} onChange={e => { setAction(e.target.value); speak(e.target.value); }} disabled={loading}>
                <option value="balanceamento">Balanceamento</option>
                <option value="calculo-reagente">Cálculo de reagente</option>
                <option value="calculo-produto">Cálculo de produto</option>
              </select>
            </div>

            {action === 'balanceamento' && (
              <div className="mb-3">
                <label className="form-label">Equação</label>
                <input type="text" className="form-control" value={equation} onChange={e => setEquation(e.target.value)} disabled={loading} />
              </div>
            )}

            {(action === 'calculo-reagente' || action === 'calculo-produto') && (
              <>
                <div className="row g-2">
                  <div className="col">
                    <input type="number" className="form-control" placeholder="massa (g)" value={massa} onChange={e => setMassa(e.target.value)} disabled={loading} />
                  </div>
                  <div className="col">
                    <input type="number" className="form-control" placeholder="massa molar (g/mol)" value={massaMol} onChange={e => setMassaMol(e.target.value)} disabled={loading} />
                  </div>
                </div>
              </>
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

export default Estequiometria;
