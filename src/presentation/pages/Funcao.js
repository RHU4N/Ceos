import React, { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
// import axios from "axios";
import { FaWandMagicSparkles } from 'react-icons/fa6';
import './Style.css'; // <-- ajuste para importar o CSS correto da página

import MathApiRepository from '../../infrastructure/api/MathApiRepository';
import CalcularFuncao from '../../domain/usecases/CalcularFuncao';
import { useLoading } from '../context/LoadingContext';
import { useAuth } from '../context/AuthContext';
import { saveHistorico } from '../../infrastructure/api/historicoClient';
import { speak } from '../../hooks/useTTS';

function Funcao() {
  const [tipo, setTipo] = useState("funcao1");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [c, setC] = useState("");
  const [x, setX] = useState("");
  const [resultado, setResultado] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [erro, setErro] = useState("");
  const { loading, setLoading } = useLoading();
  const { user } = useAuth();

  const location = useLocation();

  useEffect(() => {
    if (location && location.state && location.state.initialValues) {
      const vals = location.state.initialValues || {};
      // tipo may be in state.subtype
      if (location.state.subtype) setTipo(location.state.subtype);
      if (vals.a !== undefined) setA(String(vals.a));
      if (vals.b !== undefined) setB(String(vals.b));
      if (vals.c !== undefined) setC(String(vals.c));
      if (vals.x !== undefined) setX(String(vals.x));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setResultado(null);
    setLoading(true);
    document.body.classList.add('loading-global');
    const mathRepository = new MathApiRepository();
    const calcularFuncao = new CalcularFuncao(mathRepository);
    try {
      let data = { a: Number(a), b: Number(b) };
      if (tipo === "funcao2") {
        data.c = Number(c);
      }
      if (x !== "") data.x = Number(x);
      const resultado = await calcularFuncao.execute({ tipo, data });
      // keep raw result and also build an explanation
      setResultado(resultado);
      try {
        if (user) {
          const valores = Object.entries(data).map(([k, v]) => `${k}=${v}`).join(', ');
          const resultadoStr = Array.isArray(resultado) ? resultado.join(', ') : String(resultado);
          await saveHistorico({ tipo: `Matematica:Funcao:${tipo}`, valores, resultado: resultadoStr });
        }
      } catch (err) {
        console.warn('Não foi possível salvar histórico:', err?.message || err);
      }
      setExplanation(buildExplanation(tipo, { a: Number(a), b: Number(b), c: Number(c), x: x !== '' ? Number(x) : undefined }, resultado));
    } catch (err) {
      setErro(err.message || "Erro ao calcular");
    } finally {
      setLoading(false);
      document.body.classList.remove('loading-global');
    }
  };

  const handleClear = () => {
    setTipo('funcao1');
    setA('');
    setB('');
    setC('');
    setX('');
    setResultado(null);
    setExplanation(null);
    setErro('');
    setLoading(false);
  };

  function fmt(n) {
    if (n == null || n === '') return '';
    if (typeof n === 'number') return Number.isInteger(n) ? String(n) : n.toFixed(4).replace(/\.0+$/, '');
    return String(n);
  }

  function buildExplanation(tipo, inputs, resultado) {
    // tipo: 'funcao1' or 'funcao2'
    const { a, b, c, x } = inputs || {};
    const t = String(tipo).toLowerCase();
    try {
      if (t === 'funcao1') {
        // linear
        if (x !== undefined) {
          const formula = 'f(x) = a*x + b';
          const substituted = `f(${fmt(x)}) = ${fmt(a)}*${fmt(x)} + ${fmt(b)}`;
          const value = Number(a) * Number(x) + Number(b);
          const explanation = `Avaliação da função linear no ponto x=${fmt(x)}.`;
          return { title: 'Função Linear — Avaliação', formula, substituted, value: fmt(value), explanation };
        } else {
          // solve ax + b = 0 => x = -b/a
          const formula = 'ax + b = 0 → x = -b / a';
          if (a === 0) {
            if (b === 0) return { title: 'Função Linear — Solução', formula, explanation: 'Equação degenerada: 0 = 0 → infinitas soluções.' };
            return { title: 'Função Linear — Solução', formula, explanation: 'Sem solução (a = 0 e b ≠ 0).' };
          }
          const substituted = `x = -(${fmt(b)}) / ${fmt(a)} = ${fmt(-b / a)}`;
          const explanation = `Resolução da equação linear para x quando f(x)=0.`;
          return { title: 'Função Linear — Solução', formula, substituted, value: fmt(-b / a), explanation };
        }
      }

      if (t === 'funcao2') {
        // quadratic
        if (x !== undefined) {
          const formula = 'f(x) = a*x^2 + b*x + c';
          const substituted = `f(${fmt(x)}) = ${fmt(a)}*${fmt(x)}^2 + ${fmt(b)}*${fmt(x)} + ${fmt(c)}`;
          const value = Number(a) * x * x + Number(b) * x + Number(c);
          return { title: 'Função Quadrática — Avaliação', formula, substituted, value: fmt(value), explanation: `Avaliação da função quadrática no ponto x=${fmt(x)}.` };
        } else {
          // solving: resultado may contain delta and raizes
          const formula = 'ax^2 + bx + c = 0';
          const delta = resultado && resultado.delta !== undefined ? resultado.delta : (Number(b) * Number(b) - 4 * Number(a) * Number(c));
          const deltaText = `Δ = b² - 4ac = ${fmt(b)}² - 4*${fmt(a)}*${fmt(c)} = ${fmt(delta)}`;
          if (a === 0) {
            // degenerates to linear
            if (b === 0) {
              if (c === 0) return { title: 'Função Quadrática — Degenerada', formula, explanation: 'Equação degenerada: 0 = 0 → infinitas soluções.' };
              return { title: 'Função Quadrática — Degenerada', formula, explanation: 'Sem solução (a=0 e b=0 e c≠0).' };
            }
            const raiz = -c / b;
            return { title: 'Função Quadrática (degenerada) — Solução Linear', formula, substituted: `x = -c / b = -(${fmt(c)}) / ${fmt(b)} = ${fmt(raiz)}`, value: fmt(raiz), explanation: 'Equação degenera para linear; solução abaixo.' };
          }
          // format roots
          let rootsText = '';
          if (resultado && resultado.raizes) {
            rootsText = Array.isArray(resultado.raizes) ? resultado.raizes.map(r => {
              if (r && typeof r === 'object' && r.real !== undefined && r.imag !== undefined) {
                return `${fmt(r.real)}${r.imag >= 0 ? '+' : ''}${fmt(r.imag)}i`;
              }
              return fmt(r);
            }).join(', ') : String(resultado.raizes);
          } else if (delta < 0) {
            // complex roots
            const realPart = -Number(b) / (2 * Number(a));
            const imag = Math.sqrt(-delta) / (2 * Number(a));
            rootsText = `${fmt(realPart)}${fmt(-imag)}i, ${fmt(realPart)}+${fmt(imag)}i`;
          } else if (delta === 0) {
            const x0 = -Number(b) / (2 * Number(a));
            rootsText = fmt(x0);
          } else {
            const sqrt = Math.sqrt(delta);
            const x1 = (-Number(b) - sqrt) / (2 * Number(a));
            const x2 = (-Number(b) + sqrt) / (2 * Number(a));
            rootsText = `${fmt(x1)}, ${fmt(x2)}`;
          }
          const explanation = `Delta calculado e raízes encontradas conforme mostrado.`;
          return { title: 'Função Quadrática — Solução (raízes)', formula, delta: deltaText, roots: rootsText, explanation };
        }
      }
    } catch (err) {
      return { title: 'Explicação indisponível', explanation: 'Não foi possível gerar a explicação detalhada.' };
    }
    return null;
  }

  return (
    <>
<nav aria-label="breadcrumb" className="nav justify-content-center">
  <ol className="breadcrumb">
    <li className="breadcrumb-item">
      <a
        href="/"
        tabIndex={loading ? -1 : 0}
        style={{ pointerEvents: loading ? "none" : undefined, opacity: loading ? 0.6 : undefined }}
        onClick={e => loading && e.preventDefault()}
      >
        Home
      </a>
    </li>
    <li className="breadcrumb-item">
      <a
        href="/matematica"
        tabIndex={loading ? -1 : 0}
        style={{ pointerEvents: loading ? "none" : undefined, opacity: loading ? 0.6 : undefined }}
        onClick={e => loading && e.preventDefault()}
      >
        Matemática
      </a>
    </li>
    <li className="breadcrumb-item active" aria-current="page">
      Funções
    </li>
  </ol>
</nav>

<div className="container mt-4">
  <div className="row justify-content-center">
    <div className="col-12 text-center">
      <h2 className="mb-4">Função</h2>
    </div>

    <div className="col-12 col-md-10 col-lg-8">
      <form
        className="op-card p-4 shadow-sm mx-auto"
        onSubmit={handleSubmit}
        aria-label="Formulário de função"
      >
        <div className="mb-3">
          <label className="form-label">Tipo de Função</label>
          <select
            className="form-select"
            value={tipo}
            onChange={(e) => { setTipo(e.target.value); try { speak(`Tipo selecionado: ${e.target.options[e.target.selectedIndex].text}`); } catch (err) {} }}
            onMouseEnter={() => speak('Tipo de função')}
            onFocus={() => speak('Tipo de função')}
            onKeyUp={(e) => {
              try {
                const sel = e.target;
                const text = sel.options[sel.selectedIndex] && sel.options[sel.selectedIndex].text;
                if (text) speak(text);
              } catch (err) {}
            }}
          >
            <option value="funcao1">1º Grau (ax + b)</option>
            <option value="funcao2">2º Grau (ax² + bx + c)</option>
          </select>
        </div>

        <div className="row g-2">
          <div className="col">
            <input
              type="number"
              className="form-control"
              placeholder="a"
              value={a}
              onChange={(e) => setA(e.target.value)}
              required
              aria-label="Coeficiente a"
              disabled={loading}
            />
          </div>

          <div className="col">
            <input
              type="number"
              className="form-control"
              placeholder="b"
              value={b}
              onChange={(e) => setB(e.target.value)}
              required
              aria-label="Coeficiente b"
              disabled={loading}
            />
          </div>

          {tipo === "funcao2" && (
            <div className="col">
              <input
                type="number"
                className="form-control"
                placeholder="c"
                value={c}
                onChange={(e) => setC(e.target.value)}
                required
                aria-label="Coeficiente c"
                disabled={loading}
              />
            </div>
          )}

          <div className="col">
            <input
              type="number"
              className="form-control"
              placeholder="x"
              value={x}
              onChange={(e) => setX(e.target.value)}
              aria-label="Valor de x"
              disabled={loading}
            />
          </div>
        </div>

        <button
          className="btn btn-primary mt-3 w-100"
          type="submit"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? "Calculando..." : "Calcular"}
        </button>

        <div className="d-flex justify-content-center">
          <button
            type="button"
            className="btn btn-secondary mt-3"
            onClick={handleClear}
            aria-label="Limpar campos"
            title="Limpar campos"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontWeight: 600,
              width: "140px"
            }}
          >
            <FaWandMagicSparkles style={{ fontSize: 22, color: "#a883ee" }} />
            <span style={{ fontSize: 15 }}>Limpar</span>
          </button>
        </div>

        {resultado !== null && (
          <div className="alert alert-success mt-3">
            Resultado:{" "}
            {(() => {
              if (Array.isArray(resultado)) {
                return resultado.map((r) => {
                  if (r?.real !== undefined && r?.imag !== undefined) {
                    return `${r.real}${r.imag >= 0 ? "+" : ""}${r.imag}i`;
                  }
                  return String(r);
                }).join(", ");
              }

              if (resultado && typeof resultado === "object") {
                if (resultado.raizes) {
                  return resultado.raizes.join(", ");
                }
                if (resultado.value !== undefined) return String(resultado.value);
                if (resultado.result !== undefined) return String(resultado.result);
                return JSON.stringify(resultado);
              }

              return String(resultado);
            })()}
          </div>
        )}

        {explanation && (
          <div className="card mt-3 p-3 math-explain">
            <h5>{explanation.title}</h5>
            {explanation.formula && (
              <div>
                <strong>Fórmula:</strong> <code>{explanation.formula}</code>
              </div>
            )}
            {explanation.substituted && (
              <div>
                <strong>Substituição:</strong> <code>{explanation.substituted}</code>
              </div>
            )}
            {explanation.delta && (
              <div>
                <strong>Delta:</strong> <code>{explanation.delta}</code>
              </div>
            )}
            {explanation.roots && (
              <div>
                <strong>Raízes:</strong> {explanation.roots}
              </div>
            )}
            {explanation.value !== undefined && (
              <div>
                <strong>Resultado:</strong> {explanation.value}
              </div>
            )}
            {explanation.explanation && (
              <div className="mt-2">
                <em>{explanation.explanation}</em>
              </div>
            )}
          </div>
        )}

        {erro && (
          <div className="alert alert-danger mt-3" role="alert">
            {erro}
          </div>
        )}
      </form>

      <div className="mt-3 text-muted small text-center">
        Preencha os campos e clique em Calcular para ver o resultado.
      </div>
    </div>
  </div>
</div>

    </>
  );
}

export default Funcao;
