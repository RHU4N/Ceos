import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaTemperatureHigh } from 'react-icons/fa6';
import { useLoading } from '../context/LoadingContext';
import { useAuth } from '../context/AuthContext';
import { saveHistorico } from '../../infrastructure/api/historicoClient';
import ChemistryApiRepository from '../../infrastructure/api/ChemistryApiRepository';
import { speak } from '../../hooks/useTTS';
import ExplanationCard from '../components/ExplanationCard';
import FavoriteButton from '../components/FavoriteButton';

const ACTIONS = [
  { value: 'calor-sensivel', label: 'Calor sensível (Q = m · c · ΔT)' },
  { value: 'variacao-temperatura', label: 'Variação de temperatura (ΔT)' },
  { value: 'entalpia-reacao', label: 'Entalpia da reação (ΔH)' },
  { value: 'entalpia-formacao', label: 'Entalpia por formação (ΔHf)' },
  { value: 'classificar-processo', label: 'Classificar processo (Endotérmico / Exotérmico)' },
];

const EXAMPLES = {
  'calor-sensivel': {
    formula: 'Q = m · c · (Tf − Ti)',
    massa: '200',
    calorEspecifico: '4.18',
    modoTemp: 'ti-tf',
    temperaturaInicial: '20',
    temperaturaFinal: '30',
    result: '8360 J (8.36 kJ)',
    pairs: ['m=200', 'c=4.18', 'Ti=20', 'Tf=30'],
  },
  'variacao-temperatura': {
    formula: 'ΔT = Q / (m · c)',
    calor: '8360',
    unidadeCalor: 'J',
    massa: '200',
    calorEspecifico: '4.18',
    temperaturaInicial: '20',
    result: '10 °C (Tf = 30 °C)',
    pairs: ['calor=8360 J', 'm=200', 'c=4.18', 'Ti=20'],
  },
  'entalpia-reacao': {
    formula: 'ΔH = H(produtos) − H(reagentes)  |  ΔH = ΔH_molar · n',
    modoEntalpia: 'produtos-reagentes',
    entalpiaProdutos: '-393.5',
    entalpiaReagentes: '0',
    result: '-393.5 kJ (exotermico)',
    pairs: ['H(produtos)=-393.5', 'H(reagentes)=0'],
  },
  'entalpia-formacao': {
    formula: 'ΔH = Σ[n · ΔHf(produtos)] − Σ[n · ΔHf(reagentes)]',
    reagentes: [
      { substancia: 'CH4', coeficiente: '1', entalpiaFormacao: '-74.8' },
      { substancia: 'O2', coeficiente: '2', entalpiaFormacao: '0' },
    ],
    produtos: [
      { substancia: 'CO2', coeficiente: '1', entalpiaFormacao: '-393.5' },
      { substancia: 'H2O', coeficiente: '2', entalpiaFormacao: '-285.8' },
    ],
    result: '-890.3 kJ/mol',
    pairs: ['CH4 + 2 O2 -> CO2 + 2 H2O'],
  },
  'classificar-processo': {
    formula: 'ΔH < 0 (Q < 0): exotérmico | ΔH > 0 (Q > 0): endotérmico',
    modoClassificacao: 'deltaH',
    valorClassificacao: '-285.8',
    result: 'exotermico',
    pairs: ['deltaH=-285.8 kJ'],
  },
};

const PROCESS_LABELS = {
  endotermico: 'Endotérmico (absorve calor)',
  exotermico: 'Exotérmico (libera calor)',
  isotermico: 'Isotérmico (sem troca de calor sensível)',
  atermico: 'Atérmico (ΔH = 0)',
};

function formatVarLabel(key) {
  const labels = {
    massa: 'Massa (g)',
    calorEspecifico: 'Calor específico (J/g·°C)',
    temperaturaInicial: 'Temperatura inicial (°C)',
    temperaturaFinal: 'Temperatura final (°C)',
    deltaT: 'Variação de temperatura ΔT (°C)',
    calor: 'Calor informado',
    unidadeCalor: 'Unidade do calor',
    calorJ: 'Calor em Joules (J)',
    entalpiaProdutos: 'H(produtos) (kJ)',
    entalpiaReagentes: 'H(reagentes) (kJ)',
    entalpiaMolar: 'Entalpia molar (kJ/mol)',
    moles: 'Mols (mol)',
    deltaH: 'ΔH (kJ)',
  };
  return labels[key] || key;
}

function Termoquimica() {
  const [action, setAction] = useState('calor-sensivel');
  const [massa, setMassa] = useState('');
  const [calorEspecifico, setCalorEspecifico] = useState('');
  const [modoTemp, setModoTemp] = useState('ti-tf');
  const [temperaturaInicial, setTemperaturaInicial] = useState('');
  const [temperaturaFinal, setTemperaturaFinal] = useState('');
  const [deltaT, setDeltaT] = useState('');
  const [calor, setCalor] = useState('');
  const [unidadeCalor, setUnidadeCalor] = useState('J');
  const [modoEntalpia, setModoEntalpia] = useState('produtos-reagentes');
  const [entalpiaProdutos, setEntalpiaProdutos] = useState('');
  const [entalpiaReagentes, setEntalpiaReagentes] = useState('');
  const [entalpiaMolar, setEntalpiaMolar] = useState('');
  const [moles, setMoles] = useState('');
  const [reagentesList, setReagentesList] = useState([
    { substancia: '', coeficiente: '1', entalpiaFormacao: '' },
  ]);
  const [produtosList, setProdutosList] = useState([
    { substancia: '', coeficiente: '1', entalpiaFormacao: '' },
  ]);
  const [modoClassificacao, setModoClassificacao] = useState('deltaH');
  const [valorClassificacao, setValorClassificacao] = useState('');
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const { loading, setLoading } = useLoading();
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const values = location?.state?.initialValues;
    const subtype = location?.state?.subtype;
    const subtypeMap = {
      calor: 'calor-sensivel',
      'var-temp': 'variacao-temperatura',
      entalpia: 'entalpia-reacao',
    };
    const resolvedSubtype = subtypeMap[subtype] || subtype;
    if (resolvedSubtype && ACTIONS.some((a) => a.value === resolvedSubtype)) {
      setAction(resolvedSubtype);
    }
    if (values) {
      if (values.massa !== undefined) setMassa(String(values.massa));
      const cVal = values.calorEspecifico ?? values.calor_especifico;
      if (cVal !== undefined) setCalorEspecifico(String(cVal));
      if (values.temperaturaInicial !== undefined) setTemperaturaInicial(String(values.temperaturaInicial));
      if (values.temperaturaFinal !== undefined) setTemperaturaFinal(String(values.temperaturaFinal));
      const dtVal = values.deltaT ?? values.delta_t;
      if (dtVal !== undefined) {
        setModoTemp('delta-t');
        setDeltaT(String(dtVal));
      }
      if (values.calor !== undefined) setCalor(String(values.calor));
      if (values.unidadeCalor !== undefined) setUnidadeCalor(String(values.unidadeCalor));
      if (values.entalpiaProdutos !== undefined) {
        setModoEntalpia('produtos-reagentes');
        setEntalpiaProdutos(String(values.entalpiaProdutos));
      }
      if (values.entalpiaReagentes !== undefined) {
        setModoEntalpia('produtos-reagentes');
        setEntalpiaReagentes(String(values.entalpiaReagentes));
      }
      const emVal = values.entalpiaMolar ?? values.entalpia_molar;
      if (emVal !== undefined) {
        setModoEntalpia('molar');
        setEntalpiaMolar(String(emVal));
      }
      if (values.moles !== undefined) setMoles(String(values.moles));
      if (values.deltaH !== undefined) {
        setModoClassificacao('deltaH');
        setValorClassificacao(String(values.deltaH));
      }
    }
  }, [location]);

  const updateListItem = (setter, idx, field, value) => {
    setter((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const addListItem = (setter) => {
    setter((prev) => [...prev, { substancia: '', coeficiente: '1', entalpiaFormacao: '' }]);
  };

  const removeListItem = (setter, idx) => {
    setter((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const buildPayload = (act) => {
    switch (act) {
      case 'calor-sensivel':
        if (modoTemp === 'ti-tf') {
          return {
            massa: Number(massa),
            calorEspecifico: Number(calorEspecifico),
            temperaturaInicial: Number(temperaturaInicial),
            temperaturaFinal: Number(temperaturaFinal),
          };
        }
        return {
          massa: Number(massa),
          calorEspecifico: Number(calorEspecifico),
          deltaT: Number(deltaT),
        };
      case 'variacao-temperatura':
        return {
          calor: Number(calor),
          unidadeCalor,
          massa: Number(massa),
          calorEspecifico: Number(calorEspecifico),
          ...(temperaturaInicial !== '' ? { temperaturaInicial: Number(temperaturaInicial) } : {}),
        };
      case 'entalpia-reacao':
        if (modoEntalpia === 'produtos-reagentes') {
          return {
            entalpiaProdutos: Number(entalpiaProdutos),
            entalpiaReagentes: Number(entalpiaReagentes),
          };
        }
        return {
          entalpiaMolar: Number(entalpiaMolar),
          moles: Number(moles),
        };
      case 'entalpia-formacao':
        return {
          reagentes: reagentesList.map((r) => ({
            substancia: r.substancia.trim(),
            coeficiente: Number(r.coeficiente),
            entalpiaFormacao: Number(r.entalpiaFormacao),
          })),
          produtos: produtosList.map((p) => ({
            substancia: p.substancia.trim(),
            coeficiente: Number(p.coeficiente),
            entalpiaFormacao: Number(p.entalpiaFormacao),
          })),
        };
      case 'classificar-processo':
        return modoClassificacao === 'deltaH'
          ? { deltaH: Number(valorClassificacao) }
          : { calor: Number(valorClassificacao) };
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
      const res = await repo.calcularTermoquimica({ action: act, data });
      setResultado(res);

      try {
        if (user) {
          const valores = Object.entries(data)
            .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
            .join(', ');
          const resultadoStr = res?.resultado ? String(res.resultado) : JSON.stringify(res);
          await saveHistorico({ tipo: `Quimica:Termoquimica:${act}`, valores, resultado: resultadoStr });
        }
      } catch (err) {
        console.warn('Não foi possível salvar histórico:', err?.message || err);
      }

      speak('Resultado: ' + (res?.resultado || JSON.stringify(res)));
    } catch (err) {
      setErro(err.message || 'Erro ao calcular termoquímica');
      speak('Erro ao calcular');
    } finally {
      setLoading(false);
      document.body.classList.remove('loading-global');
    }
  };

  const handleClear = () => {
    setAction('calor-sensivel');
    setMassa('');
    setCalorEspecifico('');
    setModoTemp('ti-tf');
    setTemperaturaInicial('');
    setTemperaturaFinal('');
    setDeltaT('');
    setCalor('');
    setUnidadeCalor('J');
    setModoEntalpia('produtos-reagentes');
    setEntalpiaProdutos('');
    setEntalpiaReagentes('');
    setEntalpiaMolar('');
    setMoles('');
    setReagentesList([{ substancia: '', coeficiente: '1', entalpiaFormacao: '' }]);
    setProdutosList([{ substancia: '', coeficiente: '1', entalpiaFormacao: '' }]);
    setModoClassificacao('deltaH');
    setValorClassificacao('');
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
    if (ex.massa !== undefined) setMassa(ex.massa);
    if (ex.calorEspecifico !== undefined) setCalorEspecifico(ex.calorEspecifico);
    if (ex.modoTemp !== undefined) setModoTemp(ex.modoTemp);
    if (ex.temperaturaInicial !== undefined) setTemperaturaInicial(ex.temperaturaInicial);
    if (ex.temperaturaFinal !== undefined) setTemperaturaFinal(ex.temperaturaFinal);
    if (ex.calor !== undefined) setCalor(ex.calor);
    if (ex.unidadeCalor !== undefined) setUnidadeCalor(ex.unidadeCalor);
    if (ex.modoEntalpia !== undefined) setModoEntalpia(ex.modoEntalpia);
    if (ex.entalpiaProdutos !== undefined) setEntalpiaProdutos(ex.entalpiaProdutos);
    if (ex.entalpiaReagentes !== undefined) setEntalpiaReagentes(ex.entalpiaReagentes);
    if (ex.reagentes) setReagentesList(ex.reagentes.map((r) => ({ ...r })));
    if (ex.produtos) setProdutosList(ex.produtos.map((p) => ({ ...p })));
    if (ex.modoClassificacao !== undefined) setModoClassificacao(ex.modoClassificacao);
    if (ex.valorClassificacao !== undefined) setValorClassificacao(ex.valorClassificacao);
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
          <li className="breadcrumb-item active" aria-current="page">Termoquímica</li>
        </ol>
      </nav>

      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="d-flex flex-column align-items-center gap-2 mb-4">
            <h1 className="h2 mb-0 text-center">Termoquímica</h1>
            <FavoriteButton
              resourceId="calc:quimica:termoquimica"
              resourceType="calculation"
              nome="Termoquímica"
              descricao="Calor sensível, variação de temperatura, entalpia e processos."
            />
          </div>

          <form className="op-card p-4 col-12 col-md-10 col-lg-8" onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label" htmlFor="termo-acao">Operação</label>
              <select
                id="termo-acao"
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

            {action === 'calor-sensivel' && (
              <div className="row g-2 mb-3">
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="termo-cs-massa">Massa (g)</label>
                  <input
                    id="termo-cs-massa"
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="Ex: 200"
                    value={massa}
                    onChange={(e) => setMassa(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="termo-cs-c">Calor específico (J/g·°C)</label>
                  <input
                    id="termo-cs-c"
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="Ex: 4.18"
                    value={calorEspecifico}
                    onChange={(e) => setCalorEspecifico(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label" htmlFor="termo-cs-modo">Modo de temperatura</label>
                  <select
                    id="termo-cs-modo"
                    className="form-select"
                    value={modoTemp}
                    onChange={(e) => setModoTemp(e.target.value)}
                    disabled={loading}
                  >
                    <option value="ti-tf">Informar Ti e Tf (°C)</option>
                    <option value="delta-t">Informar ΔT direto (°C)</option>
                  </select>
                </div>
                {modoTemp === 'ti-tf' ? (
                  <>
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="termo-cs-ti">Temperatura inicial Ti (°C)</label>
                      <input
                        id="termo-cs-ti"
                        type="number"
                        step="any"
                        className="form-control"
                        placeholder="Ex: 20"
                        value={temperaturaInicial}
                        onChange={(e) => setTemperaturaInicial(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="termo-cs-tf">Temperatura final Tf (°C)</label>
                      <input
                        id="termo-cs-tf"
                        type="number"
                        step="any"
                        className="form-control"
                        placeholder="Ex: 30"
                        value={temperaturaFinal}
                        onChange={(e) => setTemperaturaFinal(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </>
                ) : (
                  <div className="col-12">
                    <label className="form-label" htmlFor="termo-cs-dt">Variação de temperatura ΔT (°C)</label>
                    <input
                      id="termo-cs-dt"
                      type="number"
                      step="any"
                      className="form-control"
                      placeholder="Ex: 10"
                      value={deltaT}
                      onChange={(e) => setDeltaT(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                )}
              </div>
            )}

            {action === 'variacao-temperatura' && (
              <div className="row g-2 mb-3">
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="termo-vt-calor">Calor (Q)</label>
                  <input
                    id="termo-vt-calor"
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="Ex: 8360"
                    value={calor}
                    onChange={(e) => setCalor(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="termo-vt-unit">Unidade do calor</label>
                  <select
                    id="termo-vt-unit"
                    className="form-select"
                    value={unidadeCalor}
                    onChange={(e) => setUnidadeCalor(e.target.value)}
                    disabled={loading}
                  >
                    <option value="J">Joules (J)</option>
                    <option value="kJ">Quilojoules (kJ)</option>
                  </select>
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="termo-vt-massa">Massa (g)</label>
                  <input
                    id="termo-vt-massa"
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="Ex: 200"
                    value={massa}
                    onChange={(e) => setMassa(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="termo-vt-c">Calor específico (J/g·°C)</label>
                  <input
                    id="termo-vt-c"
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="Ex: 4.18"
                    value={calorEspecifico}
                    onChange={(e) => setCalorEspecifico(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="termo-vt-ti">Ti em °C (opcional)</label>
                  <input
                    id="termo-vt-ti"
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="Ex: 20"
                    value={temperaturaInicial}
                    onChange={(e) => setTemperaturaInicial(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {action === 'entalpia-reacao' && (
              <div className="row g-2 mb-3">
                <div className="col-12">
                  <label className="form-label" htmlFor="termo-er-modo">Modo de cálculo</label>
                  <select
                    id="termo-er-modo"
                    className="form-select"
                    value={modoEntalpia}
                    onChange={(e) => setModoEntalpia(e.target.value)}
                    disabled={loading}
                  >
                    <option value="produtos-reagentes">H(produtos) − H(reagentes)</option>
                    <option value="molar">Entalpia molar × mols (ΔH_molar · n)</option>
                  </select>
                </div>
                {modoEntalpia === 'produtos-reagentes' ? (
                  <>
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="termo-er-hp">H(produtos) (kJ)</label>
                      <input
                        id="termo-er-hp"
                        type="number"
                        step="any"
                        className="form-control"
                        placeholder="Ex: -393.5"
                        value={entalpiaProdutos}
                        onChange={(e) => setEntalpiaProdutos(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="termo-er-hr">H(reagentes) (kJ)</label>
                      <input
                        id="termo-er-hr"
                        type="number"
                        step="any"
                        className="form-control"
                        placeholder="Ex: 0"
                        value={entalpiaReagentes}
                        onChange={(e) => setEntalpiaReagentes(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="termo-er-hm">Entalpia molar (kJ/mol)</label>
                      <input
                        id="termo-er-hm"
                        type="number"
                        step="any"
                        className="form-control"
                        placeholder="Ex: -890.3"
                        value={entalpiaMolar}
                        onChange={(e) => setEntalpiaMolar(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="termo-er-n">Mols (mol)</label>
                      <input
                        id="termo-er-n"
                        type="number"
                        step="any"
                        className="form-control"
                        placeholder="Ex: 2"
                        value={moles}
                        onChange={(e) => setMoles(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {action === 'entalpia-formacao' && (
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold small">Reagentes</span>
                  <button
                    type="button"
                    className="ceos-chip-btn"
                    onClick={() => addListItem(setReagentesList)}
                    disabled={loading}
                  >
                    + Adicionar reagente
                  </button>
                </div>
                {reagentesList.map((item, idx) => (
                  <div className="row g-2 align-items-center mb-2" key={`ef-reag-${idx}`}>
                    <div className="col-12 col-sm-4">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Substância (ex: CH4)"
                        aria-label={`Substância do reagente ${idx + 1}`}
                        value={item.substancia}
                        onChange={(e) => updateListItem(setReagentesList, idx, 'substancia', e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="col-6 col-sm-3">
                      <input
                        type="number"
                        step="any"
                        className="form-control"
                        placeholder="Coeficiente"
                        aria-label={`Coeficiente do reagente ${idx + 1}`}
                        value={item.coeficiente}
                        onChange={(e) => updateListItem(setReagentesList, idx, 'coeficiente', e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="col-6 col-sm-3">
                      <input
                        type="number"
                        step="any"
                        className="form-control"
                        placeholder="ΔHf (kJ/mol)"
                        aria-label={`Entalpia de formação do reagente ${idx + 1}`}
                        value={item.entalpiaFormacao}
                        onChange={(e) => updateListItem(setReagentesList, idx, 'entalpiaFormacao', e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="col-12 col-sm-2">
                      <button
                        type="button"
                        className="ceos-chip-btn ceos-chip-btn--danger w-100"
                        onClick={() => removeListItem(setReagentesList, idx)}
                        disabled={loading || reagentesList.length <= 1}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}

                <div className="d-flex justify-content-between align-items-center mt-3 mb-2">
                  <span className="fw-semibold small">Produtos</span>
                  <button
                    type="button"
                    className="ceos-chip-btn"
                    onClick={() => addListItem(setProdutosList)}
                    disabled={loading}
                  >
                    + Adicionar produto
                  </button>
                </div>
                {produtosList.map((item, idx) => (
                  <div className="row g-2 align-items-center mb-2" key={`ef-prod-${idx}`}>
                    <div className="col-12 col-sm-4">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Substância (ex: CO2)"
                        aria-label={`Substância do produto ${idx + 1}`}
                        value={item.substancia}
                        onChange={(e) => updateListItem(setProdutosList, idx, 'substancia', e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="col-6 col-sm-3">
                      <input
                        type="number"
                        step="any"
                        className="form-control"
                        placeholder="Coeficiente"
                        aria-label={`Coeficiente do produto ${idx + 1}`}
                        value={item.coeficiente}
                        onChange={(e) => updateListItem(setProdutosList, idx, 'coeficiente', e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="col-6 col-sm-3">
                      <input
                        type="number"
                        step="any"
                        className="form-control"
                        placeholder="ΔHf (kJ/mol)"
                        aria-label={`Entalpia de formação do produto ${idx + 1}`}
                        value={item.entalpiaFormacao}
                        onChange={(e) => updateListItem(setProdutosList, idx, 'entalpiaFormacao', e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="col-12 col-sm-2">
                      <button
                        type="button"
                        className="ceos-chip-btn ceos-chip-btn--danger w-100"
                        onClick={() => removeListItem(setProdutosList, idx)}
                        disabled={loading || produtosList.length <= 1}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {action === 'classificar-processo' && (
              <div className="row g-2 mb-3">
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="termo-cp-modo">Grandeza informada</label>
                  <select
                    id="termo-cp-modo"
                    className="form-select"
                    value={modoClassificacao}
                    onChange={(e) => setModoClassificacao(e.target.value)}
                    disabled={loading}
                  >
                    <option value="deltaH">Variação de entalpia — deltaH (kJ)</option>
                    <option value="calor">Calor absorvido/liberado — calor (J)</option>
                  </select>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="termo-cp-val">
                    {modoClassificacao === 'deltaH' ? 'Valor de ΔH (kJ)' : 'Valor de Q (J)'}
                  </label>
                  <input
                    id="termo-cp-val"
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder={modoClassificacao === 'deltaH' ? 'Ex: -285.8' : 'Ex: 8360'}
                    value={valorClassificacao}
                    onChange={(e) => setValorClassificacao(e.target.value)}
                    required
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
                <FaTemperatureHigh style={{ fontSize: 18, color: '#ff7a45' }} />
                <span style={{ fontSize: 15, marginLeft: 8 }}>Limpar</span>
              </button>
            </div>

            {erro && <div className="alert alert-danger mt-3" role="alert">{erro}</div>}

            {resultado && (
              <div className="mt-3 ceos-result-card" role="region" aria-label="Resultado termoquímico">
                <div className="alert alert-success mb-3">
                  <strong>Resultado:</strong> {resultado.resultado}
                </div>

                {resultado.formula && (
                  <p className="mb-2">
                    <strong>Fórmula:</strong> <code>{resultado.formula}</code>
                  </p>
                )}

                {resultado.variaveis && typeof resultado.variaveis === 'object' && (
                  <div className="mb-2">
                    <strong>Variáveis e valores informados:</strong>
                    <ul className="mb-0 mt-1 ps-3">
                      {Object.entries(resultado.variaveis).map(([k, v]) => (
                        <li key={k} className="d-block m-0 p-1">
                          <strong>{formatVarLabel(k)}:</strong>{' '}
                          {Array.isArray(v)
                            ? v.map((item) => `${item.coeficiente}×${item.substancia} (${item.entalpiaFormacao} kJ/mol)`).join(' + ')
                            : String(v)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {resultado.substituicao && (
                  <p className="mb-2">
                    <strong>Substituição:</strong> <code>{resultado.substituicao}</code>
                  </p>
                )}

                {resultado.unidade && (
                  <p className="mb-2">
                    <strong>Unidade:</strong> {resultado.unidade}
                    {resultado.unidadeAlternativa ? ` (alternativa: ${resultado.unidadeAlternativa})` : ''}
                  </p>
                )}

                {resultado.processo && (
                  <p className="mb-2">
                    <strong>Classificação do processo:</strong>{' '}
                    <span className="badge text-bg-info">
                      {PROCESS_LABELS[resultado.processo] || resultado.processo}
                    </span>
                  </p>
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
            Preencha os campos e clique em Calcular para ver a análise termoquímica completa.
          </div>
        </div>
      </div>
    </>
  );
}

export default Termoquimica;
