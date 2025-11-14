import React, { useState } from 'react';
import { FaWandMagicSparkles } from 'react-icons/fa6';

import MathApiRepository from '../../infrastructure/api/MathApiRepository';
import CalcularEstatistica from '../../domain/usecases/CalcularEstatistica';
import { useLoading } from '../context/LoadingContext';

// ⬅️ IMPORTANDO TTS
import { speak as speakText } from "../../hooks/useTTS";

function Estatistica() {
  const [tipo, setTipo] = useState('media');
  const [numeros, setNumeros] = useState('');
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const { loading, setLoading } = useLoading();

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

  return (
    <>
      <nav aria-label="breadcrumb" className="nav justify-content-center">
        <ol className="breadcrumb">

          <li className="breadcrumb-item">
            <a
              href="/"
              onMouseEnter={() => speakText("Ir para Home")}
            >
              Home
            </a>
          </li>

          <li className="breadcrumb-item">
            <a
              href="/matematica"
              onMouseEnter={() => speakText("Ir para Matemática")}
            >
              Matemática
            </a>
          </li>

          <li
            className="breadcrumb-item active"
            aria-current="page"
            onMouseEnter={() => speakText("Página Estatística")}
          >
            Estatísticas
          </li>
        </ol>
      </nav>

      <div className="container mt-5 row justify-content-center">

        <h2
          className="mb-4 text-center"
          onMouseEnter={() => speakText("Estatística")}
        >
          Estatística
        </h2>

        <form
          className="card p-4 shadow-sm col-12 col-md-10 col-lg-8 mx-auto"
          onSubmit={handleSubmit}
        >

          {/* SELECT */}
          <div className="mb-3">
            <label className="form-label">Tipo</label>

            <select
              className="form-select"
              value={tipo}
              onMouseEnter={() => speakText("Selecionar tipo de cálculo")}
              onChange={(e) => {
                const novo = e.target.value;
                setTipo(novo);

                const frases = {
                  media: "Você selecionou média.",
                  mediana: "Você selecionou mediana.",
                  moda: "Você selecionou moda."
                };

                speakText(frases[novo]);
              }}
              disabled={loading}
            >
              <option value="media">Média</option>
              <option value="mediana">Mediana</option>
              <option value="moda">Moda</option>
            </select>
          </div>

          {/* INPUT DE NÚMEROS */}
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Números separados por vírgula. Exemplo: 1,2,3"
              value={numeros}
              onMouseEnter={() => speakText("Digite os números separados por vírgula")}
              onChange={(e) => setNumeros(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* BOTÃO CALCULAR */}
          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            onMouseEnter={() => speakText("Botão calcular")}
          >
            {loading ? 'Calculando...' : 'Calcular'}
          </button>

          {/* BOTÃO LIMPAR */}
          <div className="d-flex justify-content-center">
            <button
              type="button"
              className="btn btn-secondary ms-2"
              onClick={handleClear}
              onMouseEnter={() => speakText("Botão limpar campos")}
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

          {/* RESULTADO */}
          {resultado !== null && (
            <div
              className="alert alert-success mt-3"
              onMouseEnter={() =>
                speakText(
                  Array.isArray(resultado)
                    ? `Resultado: ${resultado.join(", ")}`
                    : `Resultado: ${resultado}`
                )
              }
            >
              Resultado: {Array.isArray(resultado) ? resultado.join(', ') : resultado}
            </div>
          )}

          {/* ERRO */}
          {erro && (
            <div
              className="alert alert-danger mt-3"
              onMouseEnter={() => speakText("Erro ao calcular")}
            >
              {erro}
            </div>
          )}

        </form>

        {/* TEXTO INFORMATIVO */}
        <div
          className="mt-3 text-muted small text-center"
          onMouseEnter={() =>
            speakText("Digite os números separados por vírgula e clique em Calcular para ver o resultado")
          }
        >
          Digite os números separados por vírgula e clique em Calcular para ver o resultado.
        </div>

      </div>
    </>
  );
}

export default Estatistica;
