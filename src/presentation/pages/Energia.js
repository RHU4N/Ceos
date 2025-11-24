import React, { useState } from 'react';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import PhysicsApiRepository from '../../infrastructure/api/PhysicsApiRepository';
import CalcularEnergia from '../../domain/usecases/CalcularEnergia';
import { useLoading } from '../context/LoadingContext';
import { speak } from '../../hooks/useTTS';

const repo = new PhysicsApiRepository();

function Energia() {
  const [tipo, setTipo] = useState('trabalho');
  const [forca, setForca] = useState('');
  const [desloc, setDesloc] = useState('');
  const [massa, setMassa] = useState('');
  const [vel, setVel] = useState('');
  const [g, setG] = useState('9.81');
  const [k, setK] = useState('');
  const [x, setX] = useState('');
  const [result, setResult] = useState(null);
  const [erro, setErro] = useState('');
  const { loading, setLoading } = useLoading();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setResult(null);
    setLoading(true);
    document.body.classList.add('loading-global');
    try {
      let data = {};
      const t = String(tipo).toLowerCase();
      if (t === 'trabalho') data = { F: Number(forca), d: Number(desloc), angulo: 0 };
      if (t === 'cinetica') data = { m: Number(massa), v: Number(vel) };
      if (t === 'potencial-gravitacional') data = { m: Number(massa), h: Number(x) };
      if (t === 'potencial-elastica') data = { k: Number(k), x: Number(x) };
      if (t === 'potencia') data = { T: Number(forca), s0: Number(desloc), sf: Number(massa) };

      const calcular = new CalcularEnergia(new PhysicsApiRepository());
      const res = await calcular.execute({ action: tipo, data });
      setResult(res);
      speak(`Resultado: ${typeof res === 'object' ? JSON.stringify(res) : String(res)}`);
    } catch (err) {
      setErro(err.message || 'Erro ao calcular');
      speak('Erro ao calcular');
    } finally {
      setLoading(false);
      document.body.classList.remove('loading-global');
    }
  };

  const handleClear = () => { setTipo('trabalho'); setForca(''); setDesloc(''); setMassa(''); setVel(''); setG('9.81'); setK(''); setX(''); setResult(null); setErro(''); setLoading(false); speak('Campos limpos'); };

  const examples = {
    trabalho: { forca: 10, desloc: 5, result: '50 J', formula: 'W = F * d' },
    cinetica: { massa: 2, vel: 3, result: '9 J', formula: 'E_k = 1/2 * m * v^2' },
    'potencial-gravitacional': { massa: 2, x: 5, g: 9.81, result: '98.1 J', formula: 'E_p = m * g * h' }
  };

  const fillExample = (key) => {
    const ex = examples[key] || {};
    setTipo(key);
    if (ex.forca !== undefined) setForca(String(ex.forca)); else setForca('');
    if (ex.desloc !== undefined) setDesloc(String(ex.desloc)); else setDesloc('');
    if (ex.massa !== undefined) setMassa(String(ex.massa)); else setMassa('');
    if (ex.vel !== undefined) setVel(String(ex.vel)); else setVel('');
    if (ex.g !== undefined) setG(String(ex.g)); else setG('9.81');
    if (ex.k !== undefined) setK(String(ex.k)); else setK('');
    if (ex.x !== undefined) setX(String(ex.x)); else setX('');
    speak('Exemplo copiado. ' + (ex.formula || ''));
  };

  const renderExplanation = (key) => {
    const ex = examples[key];
    if (!ex) return null;
    return (
      <div className="card mt-3 physics-explain">
        <div className="card-body">
          <h6 className="card-title">Como a conta é feita</h6>
          <p><strong>Fórmula:</strong> {ex.formula}</p>
          <p><strong>Exemplo:</strong> {Object.keys(ex).filter(k=>['forca','desloc','massa','vel','g','k','x'].includes(k)).map(k=>`${k}=${ex[k]}`).join(', ')} → <em>{ex.result}</em></p>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={() => fillExample(key)}>Copiar exemplo</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <nav aria-label="breadcrumb" className="nav justify-content-center">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="/">Home</a></li>
          <li className="breadcrumb-item"><a href="/fisica">Física</a></li>
          <li className="breadcrumb-item active" aria-current="page">Energia</li>
        </ol>
      </nav>

      <div className="container mt-5">
        <div className="row justify-content-center">
          <h2 className="mb-4 text-center">Energia</h2>

          <form className="op-card p-4 col-12 col-md-10 col-lg-8" onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Tipo</label>
              <select className="form-select" value={tipo} onChange={e => { setTipo(e.target.value); speak(e.target.value); }} disabled={loading}>
                <option value="trabalho">Trabalho</option>
                <option value="cinetica">Energia cinética</option>
                <option value="potencial-gravitacional">Potencial gravitacional</option>
                <option value="potencial-elastica">Potencial elástica</option>
                <option value="potencia">Potência</option>
              </select>
            </div>

            <div className="row g-2">
              <div className="col">
                <input type="number" className="form-control" placeholder="força / trabalho" value={forca} onChange={e => setForca(e.target.value)} disabled={loading} />
              </div>
              <div className="col">
                <input type="number" className="form-control" placeholder="deslocamento / tempo / altura" value={desloc} onChange={e => setDesloc(e.target.value)} disabled={loading} />
              </div>
              <div className="col">
                <input type="number" className="form-control" placeholder="massa" value={massa} onChange={e => setMassa(e.target.value)} disabled={loading} />
              </div>
              <div className="col">
                <input type="number" className="form-control" placeholder="velocidade" value={vel} onChange={e => setVel(e.target.value)} disabled={loading} />
              </div>
            </div>

            <div className="row g-2 mt-2">
              <div className="col">
                <input type="number" className="form-control" placeholder="g (m/s²)" value={g} onChange={e => setG(e.target.value)} disabled={loading} />
              </div>
              <div className="col">
                <input type="number" className="form-control" placeholder="k (constante elástica)" value={k} onChange={e => setK(e.target.value)} disabled={loading} />
              </div>
              <div className="col">
                <input type="number" className="form-control" placeholder="x (altura / deformação)" value={x} onChange={e => setX(e.target.value)} disabled={loading} />
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

export default Energia;
