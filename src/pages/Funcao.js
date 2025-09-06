import React, { useState } from "react";
import axios from "axios";
import { FaWandMagicSparkles } from 'react-icons/fa6';
import './Style.css'; // <-- ajuste para importar o CSS correto da página

function Funcao() {
  const [tipo, setTipo] = useState("funcao1");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [c, setC] = useState("");
  const [x, setX] = useState("");
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setResultado(null);
    setLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_MATH_URL;
      let url = `${apiUrl}/funcao/${tipo}`;
      let data = { a: Number(a), b: Number(b) };
      if (tipo === "funcao2") {
        data.c = Number(c);
      }
      if (x !== "") data.x = Number(x);
      const res = await axios.post(url, data);
      setResultado(res.data.resultado);
    } catch (err) {
      setErro(err.response?.data?.error || "Erro ao calcular");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTipo('funcao1');
    setA('');
    setB('');
    setC('');
    setX('');
    setResultado(null);
    setErro('');
    setLoading(false);
  };

  return (
    <>
      <nav aria-label="breadcrumb" className='nav justify-content-center'>
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <a href="/">Home</a>
          </li>
          <li class="breadcrumb-item">
            <a href="/matematica">Matematica</a>
          </li>
          <li class="breadcrumb-item active" aria-current="page">
            Funções
          </li>
        </ol>
      </nav>
      <div className="container mt-5 row align-items-center justify-content-center">
        <h2 className="mb-4 text-center">Função</h2>
        <form
          className="card p-4 shadow-sm col-12 col-md-10 col-lg-8 mx-auto"
          onSubmit={handleSubmit}
          aria-label="Formulário de função"
        >
          <div className="mb-3">
            <label className="form-label">Tipo de Função</label>
            <select
              className="form-select"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
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
                required={tipo === "funcao1"}
                aria-label="Valor de x"
                disabled={loading}
              />
            </div>
          </div>
          <button
            className="btn btn-primary mt-3"
            type="submit"
            disabled={loading}
            aria-busy={loading}
            aria-label="Calcular função"
          >
            {loading ? "Calculando..." : "Calcular"}
          </button>
          <div className="d-flex justify-content-center">
            <button
              type="button"
              className="btn btn-secondary mt-3 ms-2"
              onClick={handleClear}
              aria-label="Limpar campos"
              title="Limpar campos"
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
            <div className="alert alert-success mt-3" role="status">
              Resultado:{" "}
              {Array.isArray(resultado) ? resultado.join(", ") : resultado}
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
    </>
  );
}

export default Funcao;
