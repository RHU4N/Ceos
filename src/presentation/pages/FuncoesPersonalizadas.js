import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createCustomFunction,
  deleteCustomFunction,
  executeCustomFunction,
  getCustomFunction,
  listCustomFunctions,
  updateCustomFunction,
  validateCustomFunction,
} from '../../infrastructure/api/customFunctionsClient';
import { saveHistorico } from '../../infrastructure/api/historicoClient';
import { speak } from '../../hooks/useTTS';
import FavoriteButton from '../components/FavoriteButton';
import './Style.css';

const CATEGORIES = [
  { value: 'matematica', label: 'Matemática' },
  { value: 'fisica', label: 'Física' },
  { value: 'quimica', label: 'Química' },
  { value: 'financeira', label: 'Financeira' },
  { value: 'outro', label: 'Outro' },
];

const RESERVED_IDENTIFIERS = new Set([
  'pi',
  'e',
  'sqrt',
  'abs',
  'sin',
  'cos',
  'tan',
  'log',
  'ln',
  'exp',
  'pow',
  'min',
  'max',
  'round',
  'floor',
  'ceil',
  '__proto__',
  'constructor',
  'prototype',
]);

function detectFormulaVariables(formula) {
  if (!formula || typeof formula !== 'string') return [];
  const matches = formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
  const unique = [];
  const seen = new Set();
  for (const token of matches) {
    if (RESERVED_IDENTIFIERS.has(token) || seen.has(token)) continue;
    seen.add(token);
    unique.push(token);
  }
  return unique;
}

function getCategoryLabel(category) {
  return CATEGORIES.find((c) => c.value === category)?.label || category;
}

function getErrorMessage(err, fallback) {
  return err?.response?.data?.error?.message || err?.response?.data?.message || err?.message || fallback;
}

function FuncoesPersonalizadas() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const targetIdParam = searchParams.get('id');

  const [functionsList, setFunctionsList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form create/edit state
  const [editingId, setEditingId] = useState(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('matematica');
  const [tipo, setTipo] = useState('formula');
  const [formula, setFormula] = useState('');
  const [parametros, setParametros] = useState([{ nome: 'x', descricao: '', obrigatorio: true }]);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [validationState, setValidationState] = useState(null);

  // Execute panel state
  const [selectedFn, setSelectedFn] = useState(null);
  const [execValues, setExecValues] = useState({});
  const [execBusy, setExecBusy] = useState(false);
  const [execError, setExecError] = useState('');
  const [execResult, setExecResult] = useState(null);

  const openExecutionPanel = useCallback((fn, initialParamValues = null) => {
    if (!fn) return;
    setSelectedFn(fn);
    setExecError('');
    setExecResult(null);
    const defaults = {};
    for (const p of fn.parametros || []) {
      const prefilled =
        initialParamValues && initialParamValues[p.nome] !== undefined
          ? String(initialParamValues[p.nome])
          : '';
      defaults[p.nome] = prefilled;
    }
    setExecValues(defaults);
  }, []);

  const loadFunctions = useCallback(async () => {
    if (!user) {
      setFunctionsList([]);
      return [];
    }
    setListLoading(true);
    setListError('');
    try {
      const items = await listCustomFunctions();
      setFunctionsList(items);
      return items;
    } catch (err) {
      setListError(getErrorMessage(err, 'Erro ao carregar funções personalizadas.'));
      return [];
    } finally {
      setListLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setFunctionsList([]);
      setSelectedFn(null);
      return;
    }
    let active = true;
    loadFunctions().then(async (items) => {
      if (!active || !targetIdParam) return;
      const initialVals = location?.state?.initialValues || null;
      const found = items.find((item) => item.id === targetIdParam);
      if (found) {
        openExecutionPanel(found, initialVals);
        return;
      }
      try {
        const fetched = await getCustomFunction(targetIdParam);
        if (active && fetched) {
          setFunctionsList((prev) =>
            prev.some((i) => i.id === fetched.id) ? prev : [fetched, ...prev]
          );
          openExecutionPanel(fetched, initialVals);
        }
      } catch (err) {
        if (active) {
          setListError(getErrorMessage(err, 'Função personalizada não encontrada.'));
        }
      }
    });
    return () => {
      active = false;
    };
  }, [user, targetIdParam, location, loadFunctions, openExecutionPanel]);

  const resetForm = () => {
    setEditingId(null);
    setNome('');
    setDescricao('');
    setCategoria('matematica');
    setTipo('formula');
    setFormula('');
    setParametros([{ nome: 'x', descricao: '', obrigatorio: true }]);
    setFormError('');
    setFormMessage('');
    setValidationState(null);
  };

  const handleDetectParameters = () => {
    setFormError('');
    const detected = detectFormulaVariables(formula);
    if (detected.length === 0) {
      setValidationState({
        ok: false,
        message: 'Nenhuma variável detectada na fórmula.',
      });
      return;
    }
    setParametros((prev) => {
      const byName = new Map(prev.map((p) => [p.nome.trim(), p]));
      return detected.map((varName) => {
        const existing = byName.get(varName);
        return existing
          ? { ...existing, nome: varName }
          : { nome: varName, descricao: '', obrigatorio: true };
      });
    });
    setValidationState({
      ok: true,
      message: `Parâmetros detectados: ${detected.join(', ')}`,
    });
    speak(`Parâmetros detectados: ${detected.join(', ')}`);
  };

  const handleAddParam = () => {
    setParametros((prev) => [...prev, { nome: '', descricao: '', obrigatorio: true }]);
  };

  const handleRemoveParam = (idx) => {
    setParametros((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleParamChange = (idx, field, value) => {
    setParametros((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  };

  const normalizedParams = () =>
    parametros
      .map((p) => ({
        nome: String(p.nome || '').trim(),
        ...(String(p.descricao || '').trim() ? { descricao: String(p.descricao).trim() } : {}),
        obrigatorio: p.obrigatorio !== false,
      }))
      .filter((p) => p.nome !== '');

  const handleValidateFormula = async () => {
    setFormError('');
    setValidationState(null);
    try {
      const res = await validateCustomFunction({
        formula: formula.trim(),
        parametros: normalizedParams(),
      });
      const vars = Array.isArray(res?.variaveisDetectadas) ? res.variaveisDetectadas : [];
      setValidationState({
        ok: true,
        message: vars.length
          ? `Fórmula válida! Variáveis detectadas: ${vars.join(', ')}`
          : 'Fórmula válida!',
      });
      speak('Fórmula válida');
    } catch (err) {
      const msg = getErrorMessage(err, 'Fórmula inválida.');
      setValidationState({ ok: false, message: msg });
      speak('Fórmula inválida');
    }
  };

  const handleSaveFunction = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormMessage('');
    setFormBusy(true);
    try {
      const payload = {
        nome: nome.trim(),
        ...(descricao.trim() ? { descricao: descricao.trim() } : { descricao: '' }),
        categoria,
        tipo: tipo.trim() || 'formula',
        formula: formula.trim(),
        parametros: normalizedParams(),
      };

      if (editingId) {
        const updated = await updateCustomFunction(editingId, payload);
        setFunctionsList((prev) =>
          prev.map((item) => (item.id === editingId ? updated : item))
        );
        if (selectedFn?.id === editingId) {
          openExecutionPanel(updated);
        }
        setFormMessage('Função atualizada com sucesso!');
        speak('Função personalizada atualizada');
        setEditingId(null);
      } else {
        const created = await createCustomFunction(payload);
        setFunctionsList((prev) => [created, ...prev]);
        setFormMessage('Função criada com sucesso!');
        speak('Função personalizada criada');
        resetForm();
        setFormMessage('Função criada com sucesso!');
      }
    } catch (err) {
      setFormError(getErrorMessage(err, 'Não foi possível salvar a função personalizada.'));
      speak('Erro ao salvar função personalizada');
    } finally {
      setFormBusy(false);
    }
  };

  const handleStartEdit = (fn) => {
    setEditingId(fn.id);
    setNome(fn.nome || '');
    setDescricao(fn.descricao || '');
    setCategoria(fn.categoria || 'matematica');
    setTipo(fn.tipo || 'formula');
    setFormula(fn.formula || '');
    setParametros(
      Array.isArray(fn.parametros) && fn.parametros.length > 0
        ? fn.parametros.map((p) => ({
            nome: p.nome || '',
            descricao: p.descricao || '',
            obrigatorio: p.obrigatorio !== false,
          }))
        : []
    );
    setFormError('');
    setFormMessage('');
    setValidationState(null);
    speak(`Editando função ${fn.nome}`);
  };

  const handleDeleteFunction = async (fn) => {
    if (!window.confirm(`Deseja excluir a função "${fn.nome}"?`)) return;
    setListError('');
    try {
      await deleteCustomFunction(fn.id);
      setFunctionsList((prev) => prev.filter((item) => item.id !== fn.id));
      if (selectedFn?.id === fn.id) {
        setSelectedFn(null);
        setExecResult(null);
      }
      if (editingId === fn.id) {
        resetForm();
      }
      if (targetIdParam === fn.id) {
        setSearchParams({});
      }
      speak(`Função ${fn.nome} excluída`);
    } catch (err) {
      setListError(getErrorMessage(err, 'Erro ao excluir função personalizada.'));
    }
  };

  const handleExecute = async (e) => {
    e.preventDefault();
    if (!selectedFn) return;
    setExecError('');
    setExecResult(null);
    setExecBusy(true);
    try {
      const numericPayload = {};
      for (const param of selectedFn.parametros || []) {
        const raw = execValues[param.nome];
        if (raw === '' || raw === undefined || raw === null) {
          if (param.obrigatorio !== false) {
            throw new Error(`Informe um valor numérico para o parâmetro "${param.nome}".`);
          }
          continue;
        }
        const num = Number(raw);
        if (!Number.isFinite(num)) {
          throw new Error(`O parâmetro "${param.nome}" deve ser um número válido.`);
        }
        numericPayload[param.nome] = num;
      }

      const res = await executeCustomFunction(selectedFn.id, numericPayload);
      setExecResult(res);
      setFunctionsList((prev) =>
        prev.map((item) =>
          item.id === selectedFn.id && typeof res?.usos === 'number'
            ? { ...item, usos: res.usos }
            : item
        )
      );

      try {
        const pairs = [
          `id=${selectedFn.id}`,
          ...Object.entries(numericPayload).map(([k, v]) => `${k}=${v}`),
        ].join(', ');
        const resultadoStr = String(res?.resultadoFormatado ?? res?.resultado ?? '');
        await saveHistorico({
          tipo: `FuncaoPersonalizada:${selectedFn.nome}`,
          valores: pairs,
          resultado: resultadoStr,
        });
      } catch (histErr) {
        console.warn('Não foi possível salvar histórico:', histErr?.message || histErr);
      }

      speak(`Resultado: ${res?.resultadoFormatado ?? res?.resultado}`);
    } catch (err) {
      setExecError(getErrorMessage(err, 'Erro ao executar a função personalizada.'));
      speak('Erro ao executar função');
    } finally {
      setExecBusy(false);
    }
  };

  const filteredFunctions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return functionsList;
    return functionsList.filter(
      (fn) =>
        String(fn.nome || '').toLowerCase().includes(q) ||
        String(fn.descricao || '').toLowerCase().includes(q) ||
        String(fn.formula || '').toLowerCase().includes(q) ||
        String(fn.categoria || '').toLowerCase().includes(q)
    );
  }, [functionsList, searchTerm]);

  if (!user) {
    return (
      <>
        <nav aria-label="breadcrumb" className="nav justify-content-center mt-3">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item"><Link to="/matematica">Matemática</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Funções Personalizadas</li>
          </ol>
        </nav>
        <div className="container mt-5">
          <div className="row justify-content-center">
            <div className="col-12 col-md-8 text-center">
              <h1 className="h2 mb-3">Funções Personalizadas</h1>
              <div className="alert alert-info">
                Entre na sua conta para criar, validar, favoritar e executar suas próprias fórmulas.{' '}
                <Link to="/login" className="fw-bold">Ir para Login</Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <nav aria-label="breadcrumb" className="nav justify-content-center mt-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item active" aria-current="page">Funções Personalizadas</li>
        </ol>
      </nav>

      <div className="container mt-4">
        <div className="w-100 text-center mb-3">
          <h1 className="h2 mb-1">Funções Personalizadas</h1>
          <p className="text-muted mb-0">
            Crie suas próprias fórmulas matemáticas, valide os parâmetros e execute quando quiser.
          </p>
        </div>

        <div className="row justify-content-center g-4 w-100">
          {/* Formulário Criar / Editar */}
          <div className="col-12 col-lg-6">
            <form className="op-card p-4 mx-auto" onSubmit={handleSaveFunction} aria-label="Formulário de função personalizada">
              <h2 className="h4 mb-3">{editingId ? 'Editar função' : 'Nova função personalizada'}</h2>

              <div className="mb-3">
                <label className="form-label" htmlFor="cf-nome">Nome</label>
                <input
                  id="cf-nome"
                  type="text"
                  className="form-control"
                  placeholder="Ex: Energia cinética"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  disabled={formBusy}
                />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="cf-descricao">Descrição (opcional)</label>
                <input
                  id="cf-descricao"
                  type="text"
                  className="form-control"
                  placeholder="Ex: Calcula 0.5 * m * v^2"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  disabled={formBusy}
                />
              </div>

              <div className="row g-2 mb-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label" htmlFor="cf-categoria">Categoria</label>
                  <select
                    id="cf-categoria"
                    className="form-select"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    disabled={formBusy}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label" htmlFor="cf-tipo">Tipo</label>
                  <input
                    id="cf-tipo"
                    type="text"
                    className="form-control"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    required
                    disabled={formBusy}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="cf-formula">Fórmula</label>
                <input
                  id="cf-formula"
                  type="text"
                  className="form-control"
                  placeholder="Ex: 0.5 * m * v^2"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  required
                  disabled={formBusy}
                />
                <small className="text-muted d-block mt-1">
                  Operadores: +, -, *, /, ^ · Funções: sqrt, abs, sin, cos, tan, log, ln, exp, pow, min, max · Constantes: pi, e
                </small>
                <div className="d-flex gap-2 flex-wrap mt-2">
                  <button
                    type="button"
                    className="ceos-chip-btn"
                    onClick={handleDetectParameters}
                    disabled={formBusy}
                  >
                    Detectar parâmetros da fórmula
                  </button>
                  <button
                    type="button"
                    className="ceos-chip-btn"
                    onClick={handleValidateFormula}
                    disabled={formBusy || !formula.trim()}
                  >
                    Validar fórmula
                  </button>
                </div>
              </div>

              {validationState && (
                <div className={`alert ${validationState.ok ? 'alert-info' : 'alert-warning'}`} role="status">
                  {validationState.message}
                </div>
              )}

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold small">Parâmetros</span>
                  <button
                    type="button"
                    className="ceos-chip-btn"
                    onClick={handleAddParam}
                    disabled={formBusy}
                  >
                    + Adicionar parâmetro
                  </button>
                </div>

                {parametros.length === 0 && (
                  <p className="text-muted small mb-2">Nenhum parâmetro declarado (fórmula constante).</p>
                )}

                {parametros.map((param, idx) => (
                  <div className="row g-2 align-items-center mb-2" key={`param-${idx}`}>
                    <div className="col-4">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nome (ex: m)"
                        aria-label={`Nome do parâmetro ${idx + 1}`}
                        value={param.nome}
                        onChange={(e) => handleParamChange(idx, 'nome', e.target.value)}
                        disabled={formBusy}
                      />
                    </div>
                    <div className="col-4">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Descrição"
                        aria-label={`Descrição do parâmetro ${idx + 1}`}
                        value={param.descricao}
                        onChange={(e) => handleParamChange(idx, 'descricao', e.target.value)}
                        disabled={formBusy}
                      />
                    </div>
                    <div className="col-2 form-check d-flex align-items-center justify-content-center mb-0">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={`param-req-${idx}`}
                        checked={param.obrigatorio !== false}
                        onChange={(e) => handleParamChange(idx, 'obrigatorio', e.target.checked)}
                        disabled={formBusy}
                        title="Obrigatório"
                      />
                      <label className="form-check-label small ms-1" htmlFor={`param-req-${idx}`}>
                        Obrig.
                      </label>
                    </div>
                    <div className="col-2">
                      <button
                        type="button"
                        className="ceos-chip-btn ceos-chip-btn--danger w-100"
                        onClick={() => handleRemoveParam(idx)}
                        disabled={formBusy}
                        aria-label={`Remover parâmetro ${idx + 1}`}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {formError && <div className="alert alert-danger" role="alert">{formError}</div>}
              {formMessage && <div className="alert alert-success" role="status">{formMessage}</div>}

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary flex-grow-1" disabled={formBusy}>
                  {formBusy ? 'Salvando...' : editingId ? 'Atualizar função' : 'Salvar função'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={resetForm}
                    disabled={formBusy}
                  >
                    Cancelar edição
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Lista + Painel de Execução */}
          <div className="col-12 col-lg-6">
            {selectedFn && (
              <form className="op-card p-4 mb-4 mx-auto" onSubmit={handleExecute} aria-label="Executar função personalizada">
                <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                  <div>
                    <h2 className="h4 mb-1">Executar: {selectedFn.nome}</h2>
                    <code className="d-block">{selectedFn.formula}</code>
                  </div>
                  <button
                    type="button"
                    className="ceos-chip-btn"
                    onClick={() => setSelectedFn(null)}
                  >
                    Fechar
                  </button>
                </div>

                {(selectedFn.parametros || []).map((param) => (
                  <div className="mb-2" key={param.nome}>
                    <label className="form-label" htmlFor={`exec-param-${param.nome}`}>
                      {param.nome}
                      {param.descricao ? ` — ${param.descricao}` : ''}
                      {param.obrigatorio !== false ? ' *' : ' (opcional)'}
                    </label>
                    <input
                      id={`exec-param-${param.nome}`}
                      type="number"
                      step="any"
                      className="form-control"
                      value={execValues[param.nome] ?? ''}
                      onChange={(e) =>
                        setExecValues((prev) => ({ ...prev, [param.nome]: e.target.value }))
                      }
                      required={param.obrigatorio !== false}
                      disabled={execBusy}
                    />
                  </div>
                ))}

                <button type="submit" className="btn btn-primary w-100 mt-2" disabled={execBusy}>
                  {execBusy ? 'Executando...' : 'Executar fórmula'}
                </button>

                {execError && <div className="alert alert-danger mt-3 mb-0" role="alert">{execError}</div>}

                {execResult && (
                  <div className="ceos-result-card mt-3" role="status">
                    <div className="alert alert-success mb-2">
                      <strong>Resultado:</strong> {execResult.resultadoFormatado ?? execResult.resultado}
                    </div>
                    {execResult.substituicao && (
                      <div className="small">
                        <strong>Substituição:</strong> <code>{execResult.substituicao}</code>
                      </div>
                    )}
                  </div>
                )}
              </form>
            )}

            <div className="op-card p-4 mx-auto">
              <div className="d-flex justify-content-between align-items-center mb-3 gap-2 flex-wrap">
                <h2 className="h4 mb-0">Minhas funções</h2>
                <button
                  type="button"
                  className="ceos-chip-btn"
                  onClick={loadFunctions}
                  disabled={listLoading}
                >
                  {listLoading ? 'Atualizando...' : 'Atualizar'}
                </button>
              </div>

              <input
                type="search"
                className="form-control mb-3"
                placeholder="Buscar função por nome, fórmula ou categoria..."
                aria-label="Buscar funções personalizadas"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {listError && <div className="alert alert-danger" role="alert">{listError}</div>}

              {!listLoading && filteredFunctions.length === 0 ? (
                <div className="text-muted text-center py-3">
                  Nenhuma função personalizada encontrada.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {filteredFunctions.map((fn) => (
                    <div key={fn.id} className="border rounded p-3 bg-light">
                      <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap mb-2">
                        <div>
                          <div className="fw-bold">{fn.nome}</div>
                          {fn.descricao && <div className="small text-muted">{fn.descricao}</div>}
                          <code className="d-inline-block mt-1">{fn.formula}</code>
                        </div>
                        <div className="d-flex gap-1 align-items-center">
                          <span className="badge text-bg-primary">{getCategoryLabel(fn.categoria)}</span>
                          <span className="badge text-bg-secondary">{fn.usos || 0} usos</span>
                        </div>
                      </div>

                      <div className="d-flex gap-2 flex-wrap align-items-center">
                        <button
                          type="button"
                          className="ceos-chip-btn"
                          onClick={() => openExecutionPanel(fn)}
                        >
                          Executar
                        </button>
                        <button
                          type="button"
                          className="ceos-chip-btn"
                          onClick={() => handleStartEdit(fn)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="ceos-chip-btn ceos-chip-btn--danger"
                          onClick={() => handleDeleteFunction(fn)}
                        >
                          Excluir
                        </button>
                        <FavoriteButton
                          resourceId={fn.id}
                          resourceType="custom-function"
                          nome={fn.nome}
                          descricao={fn.descricao || fn.formula}
                          metadata={{ formula: fn.formula, categoria: fn.categoria }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default FuncoesPersonalizadas;
