import React, { useState } from 'react';
import { FaTemperatureHigh } from 'react-icons/fa6';
import { useLoading } from '../context/LoadingContext';
import CalcularQuimica from '../../domain/usecases/CalcularQuimica';
import ChemistryApiRepository from '../../infrastructure/api/ChemistryApiRepository';
import { speak } from '../../hooks/useTTS';

function Termoquimica() {
  const [action, setAction] = useState('entalpia');
  const [entalpiaMolar, setEntalpiaMolar] = useState('');
  const [moles, setMoles] = useState('');
  const [massa, setMassa] = useState('');
  const [calorEspecifico, setCalorEspecifico] = useState('');
  const [deltaT, setDeltaT] = useState('');
  const [calor, setCalor] = useState('');
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const { loading, setLoading } = useLoading();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(''); setResultado(null); setLoading(true); document.body.classList.add('loading-global');
    try {
      const act = String(action).toLowerCase();
      let data = {};
      if (act === 'entalpia') data = { entalpia_molar: Number(entalpiaMolar), moles: Number(moles) };
      if (act === 'calor') data = { massa: Number(massa), calor_especifico: Number(calorEspecifico), delta_t: Number(deltaT) };
      if (act === 'var-temp') data = { calor: Number(calor), massa: Number(massa), calor_especifico: Number(calorEspecifico) };

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

  const handleClear = () => { setAction('entalpia'); setEntalpiaMolar(''); setMoles(''); setMassa(''); setCalorEspecifico(''); setDeltaT(''); setCalor(''); setResultado(null); setErro(''); setLoading(false); speak('Campos limpos'); };

  const examples = {
    entalpia: { entalpia_molar: -285.8, moles: 1, result: '-285.8 kJ', formula: 'ΔH = entalpia_molar * n' },
    calor: { massa: 100, calor_especifico: 4.18, delta_t: 10, result: '4180 J', formula: 'Q = m * c * ΔT' },
    'var-temp': { calor: 4180, massa: 100, calor_especifico: 4.18, result: 'ΔT = 10°C', formula: 'ΔT = Q / (m * c)' }
  };

  const fillExample = (key) => {
    const ex = examples[key] || {};
    setAction(key);
    if (ex.entalpia_molar !== undefined) setEntalpiaMolar(String(ex.entalpia_molar)); else setEntalpiaMolar('');
    if (ex.moles !== undefined) setMoles(String(ex.moles)); else setMoles('');
    if (ex.massa !== undefined) setMassa(String(ex.massa)); else setMassa('');
    if (ex.calor_especifico !== undefined) setCalorEspecifico(String(ex.calor_especifico)); else setCalorEspecifico('');
    if (ex.delta_t !== undefined) setDeltaT(String(ex.delta_t)); else setDeltaT('');
    if (ex.calor !== undefined) setCalor(String(ex.calor)); else setCalor('');
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
          <p><strong>Exemplo:</strong> {Object.keys(ex).filter(k=>['entalpia_molar','moles','massa','calor_especifico','delta_t','calor'].includes(k)).map(k=>`${k}=${ex[k]}`).join(', ')} → <em>{ex.result}</em></p>
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
          <li className="breadcrumb-item active" aria-current="page">Termoquímica</li>
        </ol>
      </nav>

      <div className="container mt-5">
        <div className="row justify-content-center">
          <h2 className="mb-4 text-center">Termoquímica</h2>

          <form className="op-card p-4 col-12 col-md-10 col-lg-8" onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Tipo</label>
              <select className="form-select" value={action} onChange={e => { setAction(e.target.value); speak(e.target.value); }} disabled={loading}>
                <option value="entalpia">Entalpia</option>
                <option value="calor">Calor trocado</option>
                <option value="var-temp">Variação de temperatura</option>
              </select>
            </div>

            {action === 'entalpia' && (
              <div className="row g-2">
                <div className="col">
                  <input type="number" className="form-control" placeholder="entalpia molar (kJ/mol)" value={entalpiaMolar} onChange={e => setEntalpiaMolar(e.target.value)} disabled={loading} />
                </div>
                <div className="col">
                  <input type="number" className="form-control" placeholder="moles (mol)" value={moles} onChange={e => setMoles(e.target.value)} disabled={loading} />
                </div>
              </div>
            )}

            {action === 'calor' && (
              <div className="row g-2">
                <div className="col">
                  <input type="number" className="form-control" placeholder="massa (g)" value={massa} onChange={e => setMassa(e.target.value)} disabled={loading} />
                </div>
                <div className="col">
                  <input type="number" className="form-control" placeholder="calor específico (J/g°C)" value={calorEspecifico} onChange={e => setCalorEspecifico(e.target.value)} disabled={loading} />
                </div>
                <div className="col-12 mt-2">
                  <input type="number" className="form-control" placeholder="ΔT (°C)" value={deltaT} onChange={e => setDeltaT(e.target.value)} disabled={loading} />
                </div>
              </div>
            )}

            {action === 'var-temp' && (
              <div className="row g-2">
                <div className="col">
                  <input type="number" className="form-control" placeholder="calor (J)" value={calor} onChange={e => setCalor(e.target.value)} disabled={loading} />
                </div>
                <div className="col">
                  <input type="number" className="form-control" placeholder="massa (g)" value={massa} onChange={e => setMassa(e.target.value)} disabled={loading} />
                </div>
                <div className="col">
                  <input type="number" className="form-control" placeholder="calor específico (J/g°C)" value={calorEspecifico} onChange={e => setCalorEspecifico(e.target.value)} disabled={loading} />
                </div>
              </div>
            )}

            <button className="btn btn-primary mt-3 w-100" type="submit" disabled={loading}>{loading ? 'Calculando...' : 'Calcular'}</button>

            <div className="d-flex justify-content-center">
              <button type="button" className="btn btn-secondary mt-3 ms-2" onClick={handleClear}>
                <FaTemperatureHigh style={{ fontSize: 22, color: "#ff7a45" }} />
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

export default Termoquimica;
