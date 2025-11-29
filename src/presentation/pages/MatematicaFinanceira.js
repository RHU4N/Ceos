import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaWandMagicSparkles } from 'react-icons/fa6';

import MathApiRepository from '../../infrastructure/api/MathApiRepository';
import CalcularFinanceiro from '../../domain/usecases/CalcularFinanceiro';
import { useLoading } from '../context/LoadingContext';
import { useAuth } from '../context/AuthContext';
import { saveHistorico } from '../../infrastructure/api/historicoClient';
import { speak as speakText } from '../../hooks/useTTS';
import ExplanationCard from '../components/ExplanationCard';
import './Style.css';

function MatematicaFinanceira() {
	const [tipo, setTipo] = useState('variacao');
	const [inputs, setInputs] = useState({});
	const [resultado, setResultado] = useState(null);
	const [erro, setErro] = useState('');
	const { loading, setLoading } = useLoading();
	const { user } = useAuth();

	const location = useLocation();

	useEffect(() => {
		if (location && location.state && location.state.initialValues) {
			const vals = location.state.initialValues;
			if (location.state.subtype) setTipo(location.state.subtype);
			// populate inputs with string values
			setInputs(prev => ({ ...prev, ...Object.fromEntries(Object.entries(vals).map(([k,v]) => [k, v === undefined || v === null ? '' : String(v)])) }));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location]);

	const handleChange = (key, value) => {
		setInputs(prev => ({ ...prev, [key]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setErro('');
		setResultado(null);
		setLoading(true);
		document.body.classList.add('loading-global');
		const mathRepository = new MathApiRepository();
		const calcular = new CalcularFinanceiro(mathRepository);
		try {
			// convert numeric fields to numbers
			const payload = {};
			Object.entries(inputs).forEach(([k, v]) => {
				if (v === '' || v === undefined) return;
				let num = Number(v);
				if (!Number.isNaN(num)) {
					// Only normalize interest rate 'i' when user provided percentage-like input (e.g. 10 -> 0.10).
					// Do NOT normalize 'p', 'vi' or 'vf' because backend strategies expect them as raw numbers.
					if (k === 'i' && num >= 1) {
						num = num / 100;
					}
					payload[k] = num;
				} else {
					payload[k] = v;
				}
			});

			const res = await calcular.execute({ tipo, data: payload });
			setResultado(res);
			// save operation to user historico when logged in
			try {
				if (user) {
					const valores = Object.entries(payload).map(([k,v]) => `${k}=${v}`).join(', ');
					const resultado = Array.isArray(res) ? res.join(', ') : String(res);
					await saveHistorico({ tipo: `MatematicaFinanceira:${tipo}`, valores, resultado });
					// optionally update local stored user (not required here)
				}
			} catch (err) {
				// fail silently - history saving should not break UX
				console.warn('Não foi possível salvar histórico:', err?.message || err);
			}
			speakText(Array.isArray(res) ? `Resultado: ${res.join(', ')}` : `Resultado: ${res}`);
		} catch (err) {
			setErro(err.message || 'Erro ao calcular');
			speakText('Ocorreu um erro ao calcular.');
		} finally {
			setLoading(false);
			document.body.classList.remove('loading-global');
		}
	};

	const handleClear = () => {
		setInputs({});
		setResultado(null);
		setErro('');
		setLoading(false);
		speakText('Campos limpos.');
	};

	const renderFields = () => {
		switch (tipo) {
			case 'variacao':
				return (
					<>
						<input type="number" className="form-control mb-2" placeholder="p" value={inputs.p || ''} onChange={e => handleChange('p', e.target.value)} required disabled={loading} />
						<input type="number" className="form-control mb-2" placeholder="v" value={inputs.v || ''} onChange={e => handleChange('v', e.target.value)} required disabled={loading} />
					</>
				);
			case 'variacao-percentual':
				return (
					<>
						<input type="number" className="form-control mb-2" placeholder="vi (valor inicial)" value={inputs.vi || ''} onChange={e => handleChange('vi', e.target.value)} required disabled={loading} />
						<input type="number" className="form-control mb-2" placeholder="vf (valor final)" value={inputs.vf || ''} onChange={e => handleChange('vf', e.target.value)} required disabled={loading} />
					</>
				);
			case 'juros-simples':
				return (
					<>
						<input type="number" className="form-control mb-2" placeholder="c (capital)" value={inputs.c || ''} onChange={e => handleChange('c', e.target.value)} required disabled={loading} />
						<input type="number" className="form-control mb-2" placeholder="i (taxa)" value={inputs.i || ''} onChange={e => handleChange('i', e.target.value)} required disabled={loading} />
						<input type="number" className="form-control mb-2" placeholder="n (períodos)" value={inputs.n || ''} onChange={e => handleChange('n', e.target.value)} required disabled={loading} />
					</>
				);
			case 'juros-compostos':
				return (
					<>
						<input type="number" className="form-control mb-2" placeholder="c (capital)" value={inputs.c || ''} onChange={e => handleChange('c', e.target.value)} required disabled={loading} />
						<input type="number" className="form-control mb-2" placeholder="i (taxa)" value={inputs.i || ''} onChange={e => handleChange('i', e.target.value)} required disabled={loading} />
						<input type="number" className="form-control mb-2" placeholder="t (períodos)" value={inputs.t || ''} onChange={e => handleChange('t', e.target.value)} required disabled={loading} />
					</>
				);
			default:
				return null;
		}
	};

	const examples = {
		// Backend: 'variacao' converts a percentage 'p' into decimal (p/100). Controller still requires 'v' but strategy uses 'p'.
		'variacao': { inputs: { p: '30', v: '10' }, result: '0.3', formula: 'Variação (decimal) = p / 100' },
		'variacao-percentual': { inputs: { vi: '100', vf: '125' }, result: '25%', formula: 'Variação % = ((vf - vi) / vi) * 100' },
		'juros-simples': { inputs: { c: '100', i: '0.02', n: '2' }, result: 'Juros = 4, Montante = 104', formula: 'J = c * i * n ; Montante = c + J' },
		// Note: backend expects rate `i` as decimal (ex: 0.1 for 10%). The form will accept 10 as "10%" and normalize it.
		'juros-compostos': { inputs: { c: '100', i: '0.1', t: '2' }, result: 'Montante = 121', formula: 'Montante = c * (1 + i)^t' }
	};

	const fillExample = (key) => {
		const ex = examples[key];
		if (!ex) return;
		setTipo(key);
		setInputs(ex.inputs);
		speakText('Exemplo copiado. ' + (ex.formula || ''));
	};

		const renderExplanation = (key) => {
			const ex = examples[key];
			if (!ex) return null;
			const pairs = Object.entries(ex.inputs || {}).map(([k,v]) => `${k}=${v}`);
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
			<nav aria-label="breadcrumb" className="nav justify-content-center">
				<ol className="breadcrumb">
					<li className="breadcrumb-item"><a href="/" onMouseEnter={() => speakText('Ir para Home')} onFocus={() => speakText('Ir para Home')}>Home</a></li>
					<li className="breadcrumb-item"><a href="/matematica" onMouseEnter={() => speakText('Ir para Matemática')} onFocus={() => speakText('Ir para Matemática')}>Matemática</a></li>
					<li className="breadcrumb-item active" aria-current="page">Matemática Financeira</li>
				</ol>
			</nav>

			<div className="container mt-4">
				<div className="row justify-content-center">
					<div className="col-12 text-center">
						<h2 className="mb-4">Matemática Financeira</h2>
					</div>

					<div className="col-12 col-md-10 col-lg-8">
						<form className="op-card p-4 shadow-sm mx-auto" onSubmit={handleSubmit} aria-label="Formulário de matemática financeira">
							<div className="mb-3">
								<label className="form-label">Operação</label>
								<select className="form-select" value={tipo} onChange={e => { setTipo(e.target.value); speakText(e.target.options[e.target.selectedIndex].text); }} disabled={loading}>
									<option value="variacao">Variação</option>
									<option value="variacao-percentual">Variação Percentual</option>
									<option value="juros-simples">Juros Simples</option>
									<option value="juros-compostos">Juros Compostos</option>
								</select>
							</div>

							{renderFields()}

							<button className="btn btn-primary mt-3 w-100" type="submit" disabled={loading} aria-busy={loading}>{loading ? 'Calculando...' : 'Calcular'}</button>

							<div className="d-flex justify-content-center">
								<button type="button" className="btn btn-secondary mt-3" onClick={handleClear} style={{ width: 140 }}>
									<FaWandMagicSparkles style={{ fontSize: 22, color: '#a883ee' }} /> <span style={{ fontSize: 15 }}>Limpar</span>
								</button>
							</div>

							{resultado !== null && (
								<div className="alert alert-success mt-3">Resultado: {typeof resultado === 'object' ? JSON.stringify(resultado) : String(resultado)}</div>
							)}

							{erro && (
								<div className="alert alert-danger mt-3" role="alert">{erro}</div>
							)}

							{renderExplanation(tipo)}
						</form>

						<div className="mt-3 text-muted small text-center">Preencha os campos e clique em Calcular para ver o resultado.</div>
					</div>
				</div>
			</div>
		</>
	);
}

export default MatematicaFinanceira;
