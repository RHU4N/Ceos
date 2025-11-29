import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import './Style.css';

import MathApiRepository from '../../infrastructure/api/MathApiRepository';
import CalcularAnaliseComb from '../../domain/usecases/CalcularAnaliseComb';
import { useLoading } from '../context/LoadingContext';
import { useAuth } from '../context/AuthContext';
import { saveHistorico } from '../../infrastructure/api/historicoClient';
import { speak } from "../../hooks/useTTS";
import ExplanationCard from '../components/ExplanationCard';

function AnaliseComb() {
  const [tipo, setTipo] = useState('permutacao');
  const [n, setN] = useState('');
  const [k, setK] = useState('');
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const { loading, setLoading } = useLoading();
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const values = location?.state?.initialValues;
    const subtype = location?.state?.subtype;
    if (values) {
      if (values.n !== undefined) setN(String(values.n));
      if (values.k !== undefined) setK(String(values.k));
    }
    if (subtype) setTipo(subtype);
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    speak("Calculando");

    setErro('');
    setResultado(null);
    setLoading(true);
    document.body.classList.add('loading-global');

    const mathRepository = new MathApiRepository();
    const calcularAnaliseComb = new CalcularAnaliseComb(mathRepository);

    try {
      let data = { n: Number(n) };
      if (k !== '') data.k = Number(k);

      const resultado = await calcularAnaliseComb.execute({ tipo, data });
      setResultado(resultado);

      try {
        if (user) {
          const valores = Object.entries(data).map(([k, v]) => `${k}=${v}`).join(', ');
          const resultadoStr = Array.isArray(resultado) ? resultado.join(', ') : String(resultado);
          await saveHistorico({ tipo: `Matematica:AnaliseCombinatoria:${tipo}`, valores, resultado: resultadoStr });
        }
      } catch (err) {
        console.warn('Não foi possível salvar histórico:', err?.message || err);
      }

      speak(`Resultado: ${resultado}`);
    } catch (err) {
      setErro(err.message || 'Erro ao calcular');
      speak("Erro ao calcular");
    } finally {
      setLoading(false);
      document.body.classList.remove('loading-global');
    }
  };

  const handleClear = () => {
    setTipo('permutacao');
    setN('');
    setK('');
    setResultado(null);
    setErro('');
    setLoading(false);

    speak("Campos limpos");
  };

  const examples = {
    permutacao: { n: 5, k: undefined, result: '120', formula: 'P(n) = n!' },
    combinacao: { n: 5, k: 2, result: '10', formula: 'C(n,k) = n! / (k! (n-k)!)' },
    arranjo: { n: 5, k: 2, result: '20', formula: 'A(n,k) = n! / (n-k)!' },
    arranjoRep: { n: 3, k: 2, result: '9', formula: 'A_rep = n^k' }
  };

  const fillExample = (key) => {
    const ex = examples[key] || {};
    setTipo(key);
    if (ex.n !== undefined) setN(String(ex.n)); else setN('');
    if (ex.k !== undefined) setK(String(ex.k)); else setK('');
    speak('Exemplo copiado. ' + (ex.formula || ''));
  };

  const renderExplanation = (key) => {
    const ex = examples[key];
    if (!ex) return null;
    const pairs = Object.keys(ex).filter(k=>['n','k'].includes(k)).map(k=>`${k}=${ex[k]}`);
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
      <nav aria-label="breadcrumb" className='nav justify-content-center'>
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a
              href="/"
              tabIndex={loading ? -1 : 0}
              style={{ pointerEvents: loading ? 'none' : undefined, opacity: loading ? 0.6 : undefined }}
              onClick={e => loading && e.preventDefault()}
              onMouseEnter={() => speak("Voltar para Home")}
              onFocus={() => speak("Voltar para Home")}
            >Home</a>
          </li>

          <li className="breadcrumb-item">
            <a
              href="/matematica"
              tabIndex={loading ? -1 : 0}
              style={{ pointerEvents: loading ? 'none' : undefined, opacity: loading ? 0.6 : undefined }}
              onClick={e => loading && e.preventDefault()}
              onMouseEnter={() => speak("Voltar para Matemática")}
              onFocus={() => speak("Voltar para Matemática")}
            >Matemática</a>
          </li>

          <li className="breadcrumb-item active" aria-current="page">
            Análise Combinatória
          </li>
        </ol>
      </nav>

      <div className="container mt-5">
        <div className="row justify-content-center">

          <h2 className="mb-4 text-center" onMouseEnter={() => speak("Análise combinatória")} onFocus={() => speak("Análise combinatória")}>Análise Combinatória</h2>

          <form
            className="op-card p-4 col-12 col-md-10 col-lg-8"
            onSubmit={handleSubmit}
            aria-label="Formulário de análise combinatória"
          >
            <div className="mb-3">
              <label className="form-label">Tipo</label>
              <select
                className="form-select"
                value={tipo}
                onChange={e => { setTipo(e.target.value); speak(`Tipo de cálculo alterado para ${e.target.value}`); }}
                disabled={loading}
                onMouseEnter={() => speak("Lista de tipos de cálculo")}
                onFocus={() => speak("Lista de tipos de cálculo")}
                onKeyUp={(e) => {
                  try {
                    const sel = e.target;
                    const text = sel.options[sel.selectedIndex] && sel.options[sel.selectedIndex].text;
                    if (text) speak(text);
                  } catch (err) {}
                }}
              >
                <option value="permutacao">Permutação</option>
                <option value="combinacao">Combinação</option>
                <option value="arranjo">Arranjo</option>
                <option value="arranjoRep">Arranjo com Repetição</option>
              </select>
            </div>

            <div className="row g-2">
              <div className="col">
                <input
                  type="number"
                  className="form-control"
                  placeholder="n"
                  value={n}
                  onChange={e => setN(e.target.value)}
                  required
                  aria-label="Valor de n"
                  disabled={loading}
                  onMouseEnter={() => speak("Campo N, número total de elementos")}
                  onFocus={() => speak("Campo N, número total de elementos")}
                />
              </div>

              <div className="col">
                <input
                  type="number"
                  className="form-control"
                  placeholder="k (opcional)"
                  value={k}
                  onChange={e => setK(e.target.value)}
                  aria-label="Valor de k"
                  disabled={loading}
                  onMouseEnter={() => speak("Campo K, quantidade de escolhas")}
                  onFocus={() => speak("Campo K, quantidade de escolhas")}
                />
              </div>
            </div>

            <button
              className="btn btn-primary mt-3"
              type="submit"
              disabled={loading}
              aria-busy={loading}
              aria-label="Calcular análise combinatória"
              onMouseEnter={() => speak("Calcular")}
              onFocus={() => speak("Calcular")}
            >
              {loading ? 'Calculando...' : 'Calcular'}
            </button>

            <div className="d-flex justify-content-center">
              <button
                type="button"
                className="btn btn-secondary mt-3 ms-2"
                onClick={handleClear}
                aria-label="Limpar campos"
                title="Limpar campos"
                onMouseEnter={() => speak("Limpar campos")}
                onFocus={() => speak("Limpar campos")}
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
              <div className="alert alert-success mt-3" role="status" onMouseEnter={() => speak(`Resultado: ${resultado}`)} onFocus={() => speak(`Resultado: ${resultado}`)}>
                {resultado}
              </div>
            )}

            {erro && (
              <div className="alert alert-danger mt-3" role="alert" onMouseEnter={() => speak(`Erro: ${erro}`)} onFocus={() => speak(`Erro: ${erro}`)}>
                {erro}
              </div>
            )}
            {renderExplanation(tipo)}
          </form>

          <div className="mt-3 text-muted small text-center" onMouseEnter={() => speak("Preencha os campos e clique em Calcular para ver o resultado")} onFocus={() => speak("Preencha os campos e clique em Calcular para ver o resultado") }>
            Preencha os campos e clique em Calcular para ver o resultado.
          </div>
        </div>
      </div>
    </>
  );
}

export default AnaliseComb;
