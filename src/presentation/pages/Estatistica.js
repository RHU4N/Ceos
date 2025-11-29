import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaWandMagicSparkles } from 'react-icons/fa6';

import MathApiRepository from '../../infrastructure/api/MathApiRepository';
import CalcularEstatistica from '../../domain/usecases/CalcularEstatistica';
import { useLoading } from '../context/LoadingContext';
import { useAuth } from '../context/AuthContext';
import { saveHistorico } from '../../infrastructure/api/historicoClient';
import { speak as speakText } from "../../hooks/useTTS";
import ExplanationCard from '../components/ExplanationCard';

function Estatistica() {
  const [tipo, setTipo] = useState('media');
  const [numeros, setNumeros] = useState('');
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const { user } = useAuth();
  const location = useLocation();
  const { loading, setLoading } = useLoading();

  useEffect(() => {
    const values = location?.state?.initialValues;
    const subtype = location?.state?.subtype;
    if (values) {
      if (values.numeros !== undefined) setNumeros(String(values.numeros));
    }
    if (subtype) setTipo(subtype);
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setResultado(null);
    setLoading(true);

    document.body.classList.add('loading-global');

    const mathRepository = new MathApiRepository();
    const calcular = new CalcularEstatistica(mathRepository);

    try {
      let data = { numeros: numeros.split(',').map(Number) };

      const resultado = await calcular.execute({ tipo, data });

      setResultado(resultado);
      try {
        if (user) {
          const valores = (numeros || '').trim();
          const resultadoStr = Array.isArray(resultado) ? resultado.join(', ') : String(resultado);
          await saveHistorico({ tipo: `Matematica:Estatistica:${tipo}`, valores, resultado: resultadoStr });
        }
      } catch (err) {
        console.warn('Não foi possível salvar histórico:', err?.message || err);
      }

      speakText(
        Array.isArray(resultado)
          ? `O resultado é ${resultado.join(", ")}`
          : `O resultado é ${resultado}`
      );

    } catch (err) {
      setErro(err.message || 'Erro ao calcular');
      speakText("Ocorreu um erro ao calcular.");
    } finally {
      setLoading(false);
      document.body.classList.remove('loading-global');
    }
  };

  const handleClear = () => {
    setTipo('media');
    setNumeros('');
    setResultado(null);
    setErro('');
    setLoading(false);
    speakText("Campos limpos.");
  };

  const examples = {
    media: { numeros: '1,2,3,4', result: '2.5', formula: 'média = soma / n' },
    mediana: { numeros: '1,3,5,7,9', result: '5', formula: 'mediana = valor central ordenado' },
    moda: { numeros: '1,2,2,3', result: '2', formula: 'moda = valor mais frequente' }
  };

  const fillExample = (key) => {
    const ex = examples[key] || {};
    setTipo(key);
    setNumeros(ex.numeros || '');
    speakText('Exemplo copiado. ' + (ex.formula || ''));
  };

  const renderExplanation = (key) => {
    const ex = examples[key];
    if (!ex) return null;
    const pairs = Object.keys(ex).filter(k => k !== 'result' && k !== 'formula').map(k => `${k}=${ex[k]}`);
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
              onMouseEnter={() => speakText("Ir para Home")}
              onFocus={() => speakText("Ir para Home")}
            >Home</a>
          </li>

          <li className="breadcrumb-item">
            <a
              href="/matematica"
              tabIndex={loading ? -1 : 0}
              style={{ pointerEvents: loading ? 'none' : undefined, opacity: loading ? 0.6 : undefined }}
              onClick={e => loading && e.preventDefault()}
              onMouseEnter={() => speakText("Ir para Matemática")}
              onFocus={() => speakText("Ir para Matemática")}
            >Matemática</a>
          </li>

          <li className="breadcrumb-item active" aria-current="page">
            Estatísticas
          </li>
        </ol>
      </nav>

      {/* ESTRUTURA CORRIGIDA */}
      <div className="container mt-5">
        <div className="row justify-content-center">

          <h2 className="mb-4 text-center" onMouseEnter={() => speakText("Estatística")} onFocus={() => speakText("Estatística")}>Estatística</h2>

          <form
            className="op-card p-4 col-12 col-md-10 col-lg-8"
            onSubmit={handleSubmit}
            aria-label="Formulário de estatística"
          >
            <div className="mb-3">
              <label className="form-label">Tipo</label>
              <select
                className="form-select"
                value={tipo}
                onChange={e => { const novo = e.target.value; setTipo(novo); const frases = { media: "Você selecionou média.", mediana: "Você selecionou mediana.", moda: "Você selecionou moda." }; speakText(frases[novo]); }}
                  disabled={loading}
                  onMouseEnter={() => speakText("Selecionar tipo de cálculo")}
                  onFocus={() => speakText("Selecionar tipo de cálculo")}
                  onKeyUp={(e) => {
                    try {
                      const sel = e.target;
                      const text = sel.options[sel.selectedIndex] && sel.options[sel.selectedIndex].text;
                      if (text) speakText(text);
                    } catch (err) {}
                  }}
              >
                <option value="media">Média</option>
                <option value="mediana">Mediana</option>
                <option value="moda">Moda</option>
              </select>
            </div>

            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Números separados por vírgula (ex: 1,2,3)"
                value={numeros}
                onChange={e => setNumeros(e.target.value)}
                required
                aria-label="Números para estatística"
                disabled={loading}
                onMouseEnter={() => speakText("Digite os números separados por vírgula")}
                onFocus={() => speakText("Digite os números separados por vírgula")}
              />
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              aria-busy={loading}
              aria-label="Calcular estatística"
              onMouseEnter={() => speakText("Botão calcular")}
              onFocus={() => speakText("Botão calcular")}
            >
              {loading ? 'Calculando...' : 'Calcular'}
            </button>

            <div className="d-flex justify-content-center">
              <button
                type="button"
                className="btn btn-secondary ms-2"
                onClick={handleClear}
                aria-label="Limpar campos"
                title="Limpar campos"
                onMouseEnter={() => speakText("Botão limpar campos")}
                onFocus={() => speakText("Botão limpar campos")}
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
              <div className="alert alert-success mt-3" role="status" onMouseEnter={() => speakText(Array.isArray(resultado) ? `Resultado: ${resultado.join(", ")}` : `Resultado: ${resultado}`)} onFocus={() => speakText(Array.isArray(resultado) ? `Resultado: ${resultado.join(", ")}` : `Resultado: ${resultado}`)}>
                Resultado: {Array.isArray(resultado) ? resultado.join(', ') : resultado}
              </div>
            )}

            {erro && (
              <div className="alert alert-danger mt-3" role="alert" onMouseEnter={() => speakText("Erro ao calcular")} onFocus={() => speakText("Erro ao calcular")} >{erro}</div>
            )}
            {renderExplanation(tipo)}
          </form>

          <div className="mt-3 text-muted small text-center" onMouseEnter={() => speakText("Digite os números separados por vírgula e clique em Calcular para ver o resultado")} onFocus={() => speakText("Digite os números separados por vírgula e clique em Calcular para ver o resultado") }>
            Digite os números separados por vírgula e clique em Calcular para ver o resultado.
          </div>
        </div>
      </div>
    </>
  );
}

export default Estatistica;
