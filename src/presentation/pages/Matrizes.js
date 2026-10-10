import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './Style.css';
import MathApiRepository from '../../infrastructure/api/MathApiRepository';
import { useLoading } from '../context/LoadingContext';

const OPERATION_OPTIONS = [
  { value: 'soma', label: 'Adição de matriz' },
  { value: 'subtracao', label: 'Subtração de matriz' },
  { value: 'multiplicacao', label: 'Multiplicação de matriz' },
];

function buildMatrix(rows, cols) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));
}

function resizeMatrix(matrix, nextRows, nextCols) {
  return Array.from({ length: nextRows }, (_, rowIndex) =>
    Array.from({ length: nextCols }, (_, colIndex) => {
      const currentValue = matrix?.[rowIndex]?.[colIndex];
      return currentValue ?? '';
    })
  );
}

function normalizeMatrix(matrix) {
  return matrix.map((row) => row.map((cell) => (cell === '' || cell === null || cell === undefined ? 0 : Number(cell))));
}

function MatrixBoard({ title, matrix, rows, cols, onCellChange }) {
  return (
    <div className="text-center">
      <div className="fw-semibold mb-2">{title}</div>
      <div
        className="d-grid gap-2 p-3 border rounded bg-light mx-auto"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 54px))`, width: 'fit-content' }}
      >
        {Array.from({ length: rows }).map((_, rowIndex) =>
          Array.from({ length: cols }).map((__, colIndex) => (
            <input
              key={`${title}-${rowIndex}-${colIndex}`}
              type="number"
              className="form-control"
              value={matrix[rowIndex]?.[colIndex] ?? ''}
              onChange={(event) => onCellChange(rowIndex, colIndex, event.target.value)}
              aria-label={`${title} linha ${rowIndex + 1} coluna ${colIndex + 1}`}
              style={{ width: '54px', height: '54px', textAlign: 'center' }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ResultBoard({ matrix }) {
  if (!matrix || !matrix.length) return null;

  return (
    <div className="text-center w-100">
      <div className="fw-semibold mb-2">Resultado</div>
      <div
        className="d-grid gap-2 p-3 border rounded bg-light mx-auto"
        style={{ gridTemplateColumns: `repeat(${Math.max(1, matrix[0]?.length || 1)}, minmax(0, 54px))`, width: 'fit-content' }}
      >
        {matrix.map((row, rowIndex) =>
          row.map((value, colIndex) => (
            <div
              key={`result-${rowIndex}-${colIndex}`}
              className="border rounded bg-white d-flex align-items-center justify-content-center"
              style={{ width: '54px', height: '54px' }}
            >
              {Number.isFinite(Number(value)) ? Number(value) : value}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Matrizes() {
  const [operacao, setOperacao] = useState('soma');
  const [larguraA, setLarguraA] = useState(3);
  const [alturaA, setAlturaA] = useState(4);
  const [larguraB, setLarguraB] = useState(3);
  const [alturaB, setAlturaB] = useState(4);
  const [matrizA, setMatrizA] = useState(() => buildMatrix(4, 3));
  const [matrizB, setMatrizB] = useState(() => buildMatrix(4, 3));
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const { loading, setLoading } = useLoading();

  useEffect(() => {
    setMatrizA((prev) => resizeMatrix(prev, alturaA, larguraA));
  }, [alturaA, larguraA]);

  useEffect(() => {
    setMatrizB((prev) => resizeMatrix(prev, alturaB, larguraB));
  }, [alturaB, larguraB]);

  const compatibilidade = useMemo(() => {
    if (operacao === 'multiplicacao') {
      return `Para multiplicação, a matriz A deve ter ${larguraB} colunas e a matriz B deve ter ${alturaA} linhas.`;
    }
    return 'Para soma e subtração, as matrizes devem ter a mesma dimensão.';
  }, [operacao, alturaA, larguraB]);

  const updateCell = (setMatrix, rowIndex, colIndex, value) => {
    setMatrix((prev) =>
      prev.map((row, currentRowIndex) =>
        row.map((cell, currentColIndex) => {
          if (currentRowIndex === rowIndex && currentColIndex === colIndex) {
            return value;
          }
          return cell;
        })
      )
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErro('');
    setResultado(null);
    setLoading(true);

    try {
      const repository = new MathApiRepository();
      const response = await repository.calcularMatriz({
        operacao,
        a: normalizeMatrix(matrizA),
        b: normalizeMatrix(matrizB),
      });
      setResultado(response?.matriz ?? response);
    } catch (error) {
      setErro(error?.message || 'Erro ao calcular a matriz.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setOperacao('soma');
    setLarguraA(3);
    setAlturaA(4);
    setLarguraB(3);
    setAlturaB(4);
    setMatrizA(buildMatrix(4, 3));
    setMatrizB(buildMatrix(4, 3));
    setResultado(null);
    setErro('');
  };

  return (
    <>
      <nav aria-label="breadcrumb" className="nav justify-content-center mt-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item"><Link to="/matematica">Matemática</Link></li>
          <li className="breadcrumb-item active" aria-current="page">Matrizes</li>
        </ol>
      </nav>

      <div className="container mt-5">
        <div className="row justify-content-center">
          <h2 className="mb-4 text-center">Matrizes</h2>

          <form className="op-card p-4 col-12 col-md-10 col-lg-9" onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Operação</label>
              <select className="form-select" value={operacao} onChange={(event) => setOperacao(event.target.value)} disabled={loading}>
                {OPERATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="row g-3 align-items-end mb-4">
              <div className="col-12 col-md-5">
                <label className="form-label">Largura da matriz A</label>
                <input
                  type="number"
                  className="form-control"
                  min={1}
                  max={8}
                  value={larguraA}
                  onChange={(event) => setLarguraA(Math.max(1, Math.min(8, Number(event.target.value) || 1)))}
                  disabled={loading}
                />
              </div>
              <div className="col-12 col-md-2 text-center fw-bold fs-3">X</div>
              <div className="col-12 col-md-5">
                <label className="form-label">Altura da matriz A</label>
                <input
                  type="number"
                  className="form-control"
                  min={1}
                  max={8}
                  value={alturaA}
                  onChange={(event) => setAlturaA(Math.max(1, Math.min(8, Number(event.target.value) || 1)))}
                  disabled={loading}
                />
              </div>

              <div className="col-12 col-md-5">
                <label className="form-label">Largura da matriz B</label>
                <input
                  type="number"
                  className="form-control"
                  min={1}
                  max={8}
                  value={larguraB}
                  onChange={(event) => setLarguraB(Math.max(1, Math.min(8, Number(event.target.value) || 1)))}
                  disabled={loading}
                />
              </div>
              <div className="col-12 col-md-2 text-center fw-bold fs-3">X</div>
              <div className="col-12 col-md-5">
                <label className="form-label">Altura da matriz B</label>
                <input
                  type="number"
                  className="form-control"
                  min={1}
                  max={8}
                  value={alturaB}
                  onChange={(event) => setAlturaB(Math.max(1, Math.min(8, Number(event.target.value) || 1)))}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-12 col-lg-6">
                <MatrixBoard
                  title="Matriz A"
                  matrix={matrizA}
                  rows={alturaA}
                  cols={larguraA}
                  onCellChange={(rowIndex, colIndex, value) => updateCell(setMatrizA, rowIndex, colIndex, value)}
                />
              </div>
              <div className="col-12 col-lg-6">
                <MatrixBoard
                  title="Matriz B"
                  matrix={matrizB}
                  rows={alturaB}
                  cols={larguraB}
                  onCellChange={(rowIndex, colIndex, value) => updateCell(setMatrizB, rowIndex, colIndex, value)}
                />
              </div>
            </div>

            <div className="text-muted small mb-3">{compatibilidade}</div>

            <div className="d-flex gap-2 justify-content-center flex-wrap">
              <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Calculando...' : 'Calcular'}</button>
              <button type="button" className="btn btn-secondary" onClick={handleClear}>Limpar</button>
            </div>

            {erro && <div className="alert alert-danger mt-3 mb-0">{erro}</div>}
            {resultado && (
              <div className="mt-4">
                <ResultBoard matrix={resultado} />
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}

export default Matrizes;
