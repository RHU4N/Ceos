import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import { useLoading } from '../context/LoadingContext';
import { useAuth } from '../context/AuthContext';
import { saveHistorico } from '../../infrastructure/api/historicoClient';
import ChemistryApiRepository from '../../infrastructure/api/ChemistryApiRepository';
import { speak } from '../../hooks/useTTS';
import ExplanationCard from '../components/ExplanationCard';
import FavoriteButton from '../components/FavoriteButton';
import { formatResult } from '../../domain/formatResult';

const ACTIONS = [
  { value: 'balanceamento', label: 'Balanceamento de equação' },
  { value: 'massa-molar', label: 'Massa molar' },
  { value: 'conversao', label: 'Conversão (gramas ↔ mols)' },
  { value: 'proporcao-molar', label: 'Proporção molar' },
  { value: 'massa-teorica', label: 'Massa teórica de produto' },
  { value: 'reagente-limitante', label: 'Reagente limitante e excesso' },
];

const EXAMPLES = {
  balanceamento: {
    formula: 'Conservação de átomos: Σ(coef × átomos_reagentes) = Σ(coef × átomos_produtos)',
    equacao: 'H2 + O2 -> H2O',
    result: '2 H2 + O2 -> 2 H2O',
    pairs: ['equacao=H2 + O2 -> H2O'],
  },
  'massa-molar': {
    formula: 'M = Σ(quantidade_i × massa_atômica_i)',
    formulaQuimica: 'H2SO4',
    result: '98.079 g/mol',
    pairs: ['formula=H2SO4'],
  },
  conversao: {
    formula: 'n = m / M  |  m = n × M',
    direcao: 'gramas-para-mols',
    formulaQuimica: 'H2O',
    massa: '36.03',
    result: '2 mol',
    pairs: ['direcao=gramas-para-mols', 'formula=H2O', 'massa=36.03'],
  },
  'proporcao-molar': {
    formula: 'n_destino = n_origem × (coef_destino / coef_origem)',
    equacao: 'H2 + O2 -> H2O',
    especieOrigem: 'O2',
    especieDestino: 'H2O',
    quantidadeMols: '1.5',
    result: '3 mol de H2O',
    pairs: ['equacao=H2 + O2 -> H2O', 'especieOrigem=O2', 'especieDestino=H2O', 'quantidadeMols=1.5'],
  },
  'massa-teorica': {
    formula: 'm_produto = (n_reagente × (coef_produto / coef_reagente)) × M_produto',
    equacao: 'H2 + O2 -> H2O',
    reagente: 'H2',
    produto: 'H2O',
    modoQuantidade: 'mols',
    molsReagente: '2',
    result: '36.03 g de H2O',
    pairs: ['equacao=H2 + O2 -> H2O', 'reagente=H2', 'produto=H2O', 'molsReagente=2'],
  },
  'reagente-limitante': {
    formula: 'ξ = min(n_reagente_i / coef_i); n_excesso = n_disponível − ξ × coef_i',
    equacao: 'H2 + O2 -> H2O',
    reagentesList: [
      { formula: 'H2', modo: 'mols', valor: '3' },
      { formula: 'O2', modo: 'mols', valor: '2' },
    ],
    produtoAlvo: 'H2O',
    result: 'Limitante: H2 (excesso de 0.5 mol de O2)',
    pairs: ['equacao=H2 + O2 -> H2O', 'H2=3 mol', 'O2=2 mol'],
  },
};

function parseReactantsFromEquation(eq) {
  if (!eq || typeof eq !== 'string') return [];
  const parts = eq.split(/->|=>|→|=/);
  if (parts.length < 2) return [];
  const left = parts[0];
  return left
    .split('+')
    .map((term) => term.trim().replace(/^\d+(?:[.,]\d+)?\s+/, '').trim())
    .filter(Boolean);
}

function Estequiometria() {
  const [action, setAction] = useState('balanceamento');
  const [equacao, setEquacao] = useState('H2 + O2 -> H2O');
  const [formula, setFormula] = useState('H2SO4');
  const [direcao, setDirecao] = useState('gramas-para-mols');
  const [massaMolar, setMassaMolar] = useState('');
  const [massa, setMassa] = useState('');
  const [mols, setMols] = useState('');
  const [especieOrigem, setEspecieOrigem] = useState('O2');
  const [especieDestino, setEspecieDestino] = useState('H2O');
  const [quantidadeMols, setQuantidadeMols] = useState('');
  const [reagente, setReagente] = useState('H2');
  const [produto, setProduto] = useState('H2O');
  const [modoQuantidade, setModoQuantidade] = useState('massa');
  const [massaReagente, setMassaReagente] = useState('');
  const [molsReagente, setMolsReagente] = useState('');
  const [reagentesList, setReagentesList] = useState([
    { formula: 'H2', modo: 'mols', valor: '' },
    { formula: 'O2', modo: 'mols', valor: '' },
  ]);
  const [produtoAlvo, setProdutoAlvo] = useState('');
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const { loading, setLoading } = useLoading();
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const values = location?.state?.initialValues;
    const subtype = location?.state?.subtype;
    if (subtype && ACTIONS.some((a) => a.value === subtype)) {
      setAction(subtype);
    }
    if (values) {
      if (values.equacao !== undefined) setEquacao(String(values.equacao));
      else if (values.equation !== undefined) setEquacao(String(values.equation));
      if (values.formula !== undefined) setFormula(String(values.formula));
      if (values.direcao !== undefined) setDirecao(String(values.direcao));
      if (values.massaMolar !== undefined) setMassaMolar(String(values.massaMolar));
      if (values.massa !== undefined) setMassa(String(values.massa));
      if (values.mols !== undefined) setMols(String(values.mols));
      if (values.especieOrigem !== undefined) setEspecieOrigem(String(values.especieOrigem));
      if (values.especieDestino !== undefined) setEspecieDestino(String(values.especieDestino));
      if (values.quantidadeMols !== undefined) setQuantidadeMols(String(values.quantidadeMols));
      if (values.reagente !== undefined) setReagente(String(values.reagente));
      if (values.produto !== undefined) setProduto(String(values.produto));
      if (values.massaReagente !== undefined) {
        setModoQuantidade('massa');
        setMassaReagente(String(values.massaReagente));
      }
      if (values.molsReagente !== undefined) {
        setModoQuantidade('mols');
        setMolsReagente(String(values.molsReagente));
      }
      if (values.produtoAlvo !== undefined) setProdutoAlvo(String(values.produtoAlvo));
    }
  }, [location]);

  const handlePrefillReactants = () => {
    const parsed = parseReactantsFromEquation(equacao);
    if (parsed.length === 0) {
      setErro('Não foi possível detectar reagentes na equação. Use o formato "A + B -> C".');
      return;
    }
    setErro('');
    setReagentesList(parsed.map((f) => ({ formula: f, modo: 'massa', valor: '' })));
    speak(`${parsed.length} reagentes preenchidos a partir da equação.`);
  };

  const handleAddReactant = () => {
    setReagentesList((prev) => [...prev, { formula: '', modo: 'massa', valor: '' }]);
  };

  const handleRemoveReactant = (idx) => {
    setReagentesList((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const handleReactantChange = (idx, field, val) => {
    setReagentesList((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const buildPayload = (act) => {
    switch (act) {
      case 'balanceamento':
        return { equacao: equacao.trim() };
      case 'massa-molar':
        return { formula: formula.trim() };
      case 'conversao': {
        const payload = { direcao };
        if (formula.trim()) payload.formula = formula.trim();
        if (massaMolar !== '') payload.massaMolar = Number(massaMolar);
        if (direcao === 'gramas-para-mols') {
          payload.massa = Number(massa);
        } else {
          payload.mols = Number(mols);
        }
        return payload;
      }
      case 'proporcao-molar':
        return {
          equacao: equacao.trim(),
          especieOrigem: especieOrigem.trim(),
          especieDestino: especieDestino.trim(),
          quantidadeMols: Number(quantidadeMols),
        };
      case 'massa-teorica':
        return {
          equacao: equacao.trim(),
          reagente: reagente.trim(),
          produto: produto.trim(),
          ...(modoQuantidade === 'massa'
            ? { massaReagente: Number(massaReagente) }
            : { molsReagente: Number(molsReagente) }),
        };
      case 'reagente-limitante':
        return {
          equacao: equacao.trim(),
          reagentes: reagentesList.map((r) => ({
            formula: r.formula.trim(),
            ...(r.modo === 'mols' ? { mols: Number(r.valor) } : { massa: Number(r.valor) }),
          })),
          ...(produtoAlvo.trim() ? { produtoAlvo: produtoAlvo.trim() } : {}),
        };
      default:
        return {};
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setResultado(null);
    setLoading(true);
    document.body.classList.add('loading-global');
    try {
      const act = String(action).toLowerCase();
      const data = buildPayload(act);
      const repo = new ChemistryApiRepository();
      const res = await repo.calcularEstequiometria({ action: act, data });
      setResultado(res);

      try {
        if (user) {
          const valores = Object.entries(data)
            .map(([k, v]) => `${k}=${formatResult(v)}`)
            .join(', ');
          const resultadoStr = formatResult(res?.resultado ?? res);
          await saveHistorico({ tipo: `Quimica:Estequiometria:${act}`, valores, resultado: resultadoStr });
        }
      } catch (err) {
        console.warn('Não foi possível salvar histórico:', err?.message || err);
      }

      speak('Resultado: ' + (formatResult(res?.resultado ?? res)));
    } catch (err) {
      setErro(err.message || 'Erro ao calcular estequiometria');
      speak('Erro ao calcular');
    } finally {
      setLoading(false);
      document.body.classList.remove('loading-global');
    }
  };

  const handleClear = () => {
    setAction('balanceamento');
    setEquacao('H2 + O2 -> H2O');
    setFormula('');
    setDirecao('gramas-para-mols');
    setMassaMolar('');
    setMassa('');
    setMols('');
    setEspecieOrigem('');
    setEspecieDestino('');
    setQuantidadeMols('');
    setReagente('');
    setProduto('');
    setModoQuantidade('massa');
    setMassaReagente('');
    setMolsReagente('');
    setReagentesList([
      { formula: 'H2', modo: 'mols', valor: '' },
      { formula: 'O2', modo: 'mols', valor: '' },
    ]);
    setProdutoAlvo('');
    setResultado(null);
    setErro('');
    setLoading(false);
    speak('Campos limpos');
  };

  const fillExample = (key) => {
    const ex = EXAMPLES[key] || {};
    setAction(key);
    setErro('');
    setResultado(null);
    if (ex.equacao !== undefined) setEquacao(ex.equacao);
    if (ex.formulaQuimica !== undefined) setFormula(ex.formulaQuimica);
    if (ex.direcao !== undefined) setDirecao(ex.direcao);
    if (ex.massa !== undefined) setMassa(ex.massa);
    if (ex.mols !== undefined) setMols(ex.mols);
    if (ex.especieOrigem !== undefined) setEspecieOrigem(ex.especieOrigem);
    if (ex.especieDestino !== undefined) setEspecieDestino(ex.especieDestino);
    if (ex.quantidadeMols !== undefined) setQuantidadeMols(ex.quantidadeMols);
    if (ex.reagente !== undefined) setReagente(ex.reagente);
    if (ex.produto !== undefined) setProduto(ex.produto);
    if (ex.modoQuantidade !== undefined) setModoQuantidade(ex.modoQuantidade);
    if (ex.molsReagente !== undefined) setMolsReagente(ex.molsReagente);
    if (ex.reagentesList) setReagentesList(ex.reagentesList.map((r) => ({ ...r })));
    if (ex.produtoAlvo !== undefined) setProdutoAlvo(ex.produtoAlvo);
    if (key === 'conversao') setMassaMolar('');
    speak('Exemplo copiado. ' + (ex.formula || ''));
  };

  const renderExplanation = (key) => {
    const ex = EXAMPLES[key];
    if (!ex) return null;
    return (
      <ExplanationCard
        formula={ex.formula}
        examplePairs={ex.pairs}
        exampleText={`${ex.pairs.join(', ')} → ${ex.result}`}
        onCopyExample={() => fillExample(key)}
      />
    );
  };

  return (
    <>
      <nav aria-label="breadcrumb" className="nav justify-content-center mt-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item"><Link to="/quimica">Química</Link></li>
          <li className="breadcrumb-item active" aria-current="page">Estequiometria</li>
        </ol>
      </nav>

      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="d-flex flex-column align-items-center gap-2 mb-4">
            <h1 className="h2 mb-0 text-center">Estequiometria</h1>
            <FavoriteButton
              resourceId="calc:quimica:estequiometria"
              resourceType="calculation"
              nome="Estequiometria"
              descricao="Balanceamento racional, massa molar, conversões e reagente limitante."
            />
          </div>

          <form className="op-card p-4 col-12 col-md-10 col-lg-8" onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label" htmlFor="esteq-acao">Operação</label>
              <select
                id="esteq-acao"
                className="form-select"
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setResultado(null);
                  setErro('');
                  speak(e.target.options[e.target.selectedIndex]?.text || e.target.value);
                }}
                disabled={loading}
              >
                {ACTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {action === 'balanceamento' && (
              <div className="mb-3">
                <label className="form-label" htmlFor="esteq-equacao">Equação química</label>
                <input
                  id="esteq-equacao"
                  type="text"
                  className="form-control"
                  placeholder="Ex: H2 + O2 -> H2O ou CaCO3 -> CaO + CO2"
                  value={equacao}
                  onChange={(e) => setEquacao(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}

            {action === 'massa-molar' && (
              <div className="mb-3">
                <label className="form-label" htmlFor="esteq-formula">Fórmula química</label>
                <input
                  id="esteq-formula"
                  type="text"
                  className="form-control"
                  placeholder="Ex: H2SO4, CuSO4.5H2O, CaCO3"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}

            {action === 'conversao' && (
              <div className="row g-2 mb-3">
                <div className="col-12">
                  <label className="form-label" htmlFor="esteq-direcao">Direção da conversão</label>
                  <select
                    id="esteq-direcao"
                    className="form-select"
                    value={direcao}
                    onChange={(e) => setDirecao(e.target.value)}
                    disabled={loading}
                  >
                    <option value="gramas-para-mols">Gramas para mols (g → mol)</option>
                    <option value="mols-para-gramas">Mols para gramas (mol → g)</option>
                  </select>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="esteq-conv-formula">Fórmula (opcional se massa molar informada)</label>
                  <input
                    id="esteq-conv-formula"
                    type="text"
                    className="form-control"
                    placeholder="Ex: H2O"
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="esteq-conv-mm">Massa molar em g/mol (opcional se fórmula informada)</label>
                  <input
                    id="esteq-conv-mm"
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="Ex: 18.015"
                    value={massaMolar}
                    onChange={(e) => setMassaMolar(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="col-12">
                  {direcao === 'gramas-para-mols' ? (
                    <>
                      <label className="form-label" htmlFor="esteq-conv-massa">Massa (g)</label>
                      <input
                        id="esteq-conv-massa"
                        type="number"
                        step="any"
                        className="form-control"
                        placeholder="Ex: 36.03"
                        value={massa}
                        onChange={(e) => setMassa(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </>
                  ) : (
                    <>
                      <label className="form-label" htmlFor="esteq-conv-mols">Quantidade de matéria (mol)</label>
                      <input
                        id="esteq-conv-mols"
                        type="number"
                        step="any"
                        className="form-control"
                        placeholder="Ex: 2"
                        value={mols}
                        onChange={(e) => setMols(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </>
                  )}
                </div>
              </div>
            )}

            {action === 'proporcao-molar' && (
              <div className="row g-2 mb-3">
                <div className="col-12">
                  <label className="form-label" htmlFor="esteq-prop-eq">Equação química</label>
                  <input
                    id="esteq-prop-eq"
                    type="text"
                    className="form-control"
                    placeholder="Ex: H2 + O2 -> H2O"
                    value={equacao}
                    onChange={(e) => setEquacao(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="esteq-prop-orig">Espécie de origem</label>
                  <input
                    id="esteq-prop-orig"
                    type="text"
                    className="form-control"
                    placeholder="Ex: O2"
                    value={especieOrigem}
                    onChange={(e) => setEspecieOrigem(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="esteq-prop-dest">Espécie de destino</label>
                  <input
                    id="esteq-prop-dest"
                    type="text"
                    className="form-control"
                    placeholder="Ex: H2O"
                    value={especieDestino}
                    onChange={(e) => setEspecieDestino(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="esteq-prop-qtd">Quantidade (mol)</label>
                  <input
                    id="esteq-prop-qtd"
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="Ex: 1.5"
                    value={quantidadeMols}
                    onChange={(e) => setQuantidadeMols(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {action === 'massa-teorica' && (
              <div className="row g-2 mb-3">
                <div className="col-12">
                  <label className="form-label" htmlFor="esteq-mt-eq">Equação química</label>
                  <input
                    id="esteq-mt-eq"
                    type="text"
                    className="form-control"
                    placeholder="Ex: H2 + O2 -> H2O"
                    value={equacao}
                    onChange={(e) => setEquacao(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="esteq-mt-reag">Reagente</label>
                  <input
                    id="esteq-mt-reag"
                    type="text"
                    className="form-control"
                    placeholder="Ex: H2"
                    value={reagente}
                    onChange={(e) => setReagente(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="esteq-mt-prod">Produto</label>
                  <input
                    id="esteq-mt-prod"
                    type="text"
                    className="form-control"
                    placeholder="Ex: H2O"
                    value={produto}
                    onChange={(e) => setProduto(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="esteq-mt-modo">Informar reagente em</label>
                  <select
                    id="esteq-mt-modo"
                    className="form-select"
                    value={modoQuantidade}
                    onChange={(e) => setModoQuantidade(e.target.value)}
                    disabled={loading}
                  >
                    <option value="massa">Massa (g)</option>
                    <option value="mols">Mols (mol)</option>
                  </select>
                </div>
                <div className="col-12 col-md-6">
                  {modoQuantidade === 'massa' ? (
                    <>
                      <label className="form-label" htmlFor="esteq-mt-massa">Massa do reagente (g)</label>
                      <input
                        id="esteq-mt-massa"
                        type="number"
                        step="any"
                        className="form-control"
                        placeholder="Ex: 4.032"
                        value={massaReagente}
                        onChange={(e) => setMassaReagente(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </>
                  ) : (
                    <>
                      <label className="form-label" htmlFor="esteq-mt-mols">Mols do reagente (mol)</label>
                      <input
                        id="esteq-mt-mols"
                        type="number"
                        step="any"
                        className="form-control"
                        placeholder="Ex: 2"
                        value={molsReagente}
                        onChange={(e) => setMolsReagente(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </>
                  )}
                </div>
              </div>
            )}

            {action === 'reagente-limitante' && (
              <div className="mb-3">
                <label className="form-label" htmlFor="esteq-rl-eq">Equação química</label>
                <div className="d-flex gap-2 mb-2 flex-wrap">
                  <input
                    id="esteq-rl-eq"
                    type="text"
                    className="form-control flex-grow-1"
                    placeholder="Ex: H2 + O2 -> H2O"
                    value={equacao}
                    onChange={(e) => setEquacao(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="ceos-chip-btn"
                    onClick={handlePrefillReactants}
                    disabled={loading}
                  >
                    Preencher reagentes da equação
                  </button>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold small">Reagentes disponíveis</span>
                  <button
                    type="button"
                    className="ceos-chip-btn"
                    onClick={handleAddReactant}
                    disabled={loading}
                  >
                    + Adicionar reagente
                  </button>
                </div>

                {reagentesList.map((item, idx) => (
                  <div className="row g-2 align-items-center mb-2" key={`reagente-${idx}`}>
                    <div className="col-12 col-sm-4">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Fórmula (ex: H2)"
                        aria-label={`Fórmula do reagente ${idx + 1}`}
                        value={item.formula}
                        onChange={(e) => handleReactantChange(idx, 'formula', e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="col-6 col-sm-3">
                      <select
                        className="form-select"
                        aria-label={`Unidade do reagente ${idx + 1}`}
                        value={item.modo}
                        onChange={(e) => handleReactantChange(idx, 'modo', e.target.value)}
                        disabled={loading}
                      >
                        <option value="massa">Massa (g)</option>
                        <option value="mols">Mols (mol)</option>
                      </select>
                    </div>
                    <div className="col-6 col-sm-3">
                      <input
                        type="number"
                        step="any"
                        className="form-control"
                        placeholder={item.modo === 'mols' ? 'mols' : 'gramas'}
                        aria-label={`Valor do reagente ${idx + 1}`}
                        value={item.valor}
                        onChange={(e) => handleReactantChange(idx, 'valor', e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="col-12 col-sm-2 text-end">
                      <button
                        type="button"
                        className="ceos-chip-btn ceos-chip-btn--danger w-100"
                        onClick={() => handleRemoveReactant(idx)}
                        disabled={loading || reagentesList.length <= 1}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}

                <div className="mt-2">
                  <label className="form-label" htmlFor="esteq-rl-alvo">Produto alvo (opcional)</label>
                  <input
                    id="esteq-rl-alvo"
                    type="text"
                    className="form-control"
                    placeholder="Ex: H2O"
                    value={produtoAlvo}
                    onChange={(e) => setProdutoAlvo(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <button className="btn btn-primary mt-2 w-100" type="submit" disabled={loading}>
              {loading ? 'Calculando...' : 'Calcular'}
            </button>

            <div className="d-flex justify-content-center">
              <button type="button" className="btn btn-secondary mt-3" onClick={handleClear} disabled={loading}>
                <FaWandMagicSparkles style={{ fontSize: 18, color: '#a883ee' }} />
                <span style={{ fontSize: 15, marginLeft: 8 }}>Limpar</span>
              </button>
            </div>

            {erro && <div className="alert alert-danger mt-3" role="alert">{erro}</div>}

            {resultado && (
              <div className="mt-3 ceos-result-card" role="region" aria-label="Resultado estequiométrico">
                <div className="alert alert-success mb-3">
                  <strong>Resultado:</strong> {resultado.resultado}
                </div>

                {resultado.equacaoBalanceada && (
                  <p className="mb-2">
                    <strong>Equação balanceada:</strong> <code>{resultado.equacaoBalanceada}</code>
                  </p>
                )}

                {resultado.formula && (
                  <p className="mb-2">
                    <strong>Fórmula:</strong> <code>{resultado.formula}</code>
                  </p>
                )}

                {resultado.substituicao && (
                  <p className="mb-2">
                    <strong>Substituição:</strong> <code>{resultado.substituicao}</code>
                  </p>
                )}

                {Array.isArray(resultado.reagentes) && Array.isArray(resultado.produtos) && (
                  <div className="mb-3">
                    <strong>Espécies, coeficientes e massas molares:</strong>
                    <div className="table-responsive mt-1">
                      <table className="table table-sm table-bordered mb-0">
                        <thead>
                          <tr>
                            <th>Lado</th>
                            <th>Fórmula</th>
                            <th>Coeficiente</th>
                            <th>Massa molar (g/mol)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultado.reagentes.map((r) => (
                            <tr key={`reag-${r.formula}`}>
                              <td>Reagente</td>
                              <td>{r.formula}</td>
                              <td>{r.coeficiente}</td>
                              <td>{r.massaMolar}</td>
                            </tr>
                          ))}
                          {resultado.produtos.map((p) => (
                            <tr key={`prod-${p.formula}`}>
                              <td>Produto</td>
                              <td>{p.formula}</td>
                              <td>{p.coeficiente}</td>
                              <td>{p.massaMolar}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {resultado.conservacao && (
                  <div className="mb-3">
                    <strong>Conservação de átomos:</strong>
                    <div className="d-flex flex-wrap gap-2 mt-1">
                      {Object.entries(resultado.conservacao).map(([el, counts]) => (
                        <span key={el} className="badge text-bg-light border">
                          {el}: {counts.reagentes} = {counts.produtos}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(resultado.composicao) && (
                  <div className="mb-3">
                    <strong>Composição elementar:</strong>
                    <div className="table-responsive mt-1">
                      <table className="table table-sm table-bordered mb-0">
                        <thead>
                          <tr>
                            <th>Elemento</th>
                            <th>Qtd</th>
                            <th>Massa atômica</th>
                            <th>Subtotal (g/mol)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultado.composicao.map((c) => (
                            <tr key={c.elemento}>
                              <td>{c.elemento}</td>
                              <td>{c.quantidade}</td>
                              <td>{c.massaAtomica}</td>
                              <td>{c.subtotal}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {resultado.massaTeoricaG !== undefined && (
                  <p className="mb-2">
                    <strong>Rendimento teórico:</strong> {resultado.massaTeoricaG} g ({resultado.molsProduto} mol de {resultado.produto})
                  </p>
                )}

                {resultado.razaoMolar !== undefined && (
                  <p className="mb-2">
                    <strong>Proporção:</strong> {resultado.molsOrigem} mol ({resultado.massaOrigemG} g) de {resultado.especieOrigem} ↔{' '}
                    {resultado.molsDestino} mol ({resultado.massaDestinoG} g) de {resultado.especieDestino} (razão {resultado.razaoMolar})
                  </p>
                )}

                {Array.isArray(resultado.analiseReagentes) && (
                  <div className="mb-3">
                    <strong>Análise dos reagentes:</strong>
                    <div className="table-responsive mt-1">
                      <table className="table table-sm table-bordered mb-0">
                        <thead>
                          <tr>
                            <th>Reagente</th>
                            <th>Disponível</th>
                            <th>Consumido</th>
                            <th>Excesso</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultado.analiseReagentes.map((r) => (
                            <tr key={r.formula}>
                              <td>{r.formula}</td>
                              <td>{r.molsDisponiveis} mol ({r.massaDisponivelG} g)</td>
                              <td>{r.molsConsumidos} mol ({r.massaConsumidaG} g)</td>
                              <td>{r.molsExcesso} mol ({r.massaExcessoG} g)</td>
                              <td>{r.limitante ? 'Limitante' : 'Em excesso'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {Array.isArray(resultado.produtosGerados) && (
                  <div className="mb-3">
                    <strong>Produtos gerados:</strong>
                    <ul className="mb-0 mt-1 ps-3">
                      {resultado.produtosGerados.map((p) => (
                        <li key={p.formula} className="d-block m-0 p-1">
                          {p.formula}: <strong>{p.molsGerados} mol</strong> ({p.massaGeradaG} g)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(resultado.passos) && resultado.passos.length > 0 && (
                  <div className="mb-2">
                    <strong>Passos:</strong>
                    <ol className="mb-0 mt-1 ps-3">
                      {resultado.passos.map((passo, idx) => (
                        <li key={idx} className="d-block m-0 p-1">{passo}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {resultado.interpretacao && (
                  <p className="mb-0 mt-2">
                    <strong>Interpretação:</strong> <em>{resultado.interpretacao}</em>
                  </p>
                )}
              </div>
            )}

            {renderExplanation(action)}
          </form>

          <div className="mt-3 text-muted small text-center">
            Preencha os campos e clique em Calcular para ver a análise estequiométrica completa.
          </div>
        </div>
      </div>
    </>
  );
}

export default Estequiometria;
