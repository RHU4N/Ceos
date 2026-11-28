import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaWandMagicSparkles } from 'react-icons/fa6';
import PhysicsApiRepository from '../../infrastructure/api/PhysicsApiRepository';
import { iotApi } from '../../infrastructure/api/iotApi';
import { saveHistorico } from '../../infrastructure/api/historicoClient';
import {
  groupMeasurementsByEvent,
  pairDewPointFromEvent,
  validateDewPointInputs,
} from '../../domain/iot/dewPointPairing';
import {
  date as formatIotDate,
  deviceStatus,
  measurementOrigin,
  requestError,
  statuses,
} from '../iot/presentation';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import { speak } from '../../hooks/useTTS';
import ExplanationCard from '../components/ExplanationCard';
import FavoriteButton from '../components/FavoriteButton';
import './Style.css';
import { formatResult } from '../../domain/formatResult';

const PENDING_STATUSES = ['QUEUED', 'WAITING_FOR_DEVICE', 'MEASURING', 'PROCESSING'];
const POLL_INTERVAL_MS = 2500;

function generateUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
}

function isDht22Sensor(sensor) {
  if (!sensor) return false;
  return (
    sensor.sensorId === 'dht22-temperatura' ||
    sensor.sensorId === 'dht22-umidade' ||
    String(sensor.sensorId || '').toLowerCase().includes('dht22') ||
    String(sensor.nome || '').toLowerCase().includes('dht22')
  );
}

function PontoDeOrvalho() {
  const [activeTab, setActiveTab] = useState('manual');
  const [temperatura, setTemperatura] = useState('');
  const [umidadeRelativa, setUmidadeRelativa] = useState('');
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');

  // IoT state
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [measurements, setMeasurements] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [iotLoading, setIotLoading] = useState(false);
  const [iotError, setIotError] = useState('');
  const [requestStatusMsg, setRequestStatusMsg] = useState('');
  const [requestBusy, setRequestBusy] = useState(false);

  const pollTimerRef = useRef(null);
  const mountedRef = useRef(true);

  const { user } = useAuth();
  // O AuthContext troca o objeto `user` ao salvar histórico; dependências usam apenas o
  // estado de sessão para não recarregar medições nem resetar o evento escolhido.
  const hasUser = Boolean(user);
  const { loading, setLoading } = useLoading();
  const location = useLocation();

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  useEffect(() => {
    const values = location?.state?.initialValues;
    if (values) {
      if (values.T !== undefined) setTemperatura(String(values.T));
      else if (values.temperatura !== undefined) setTemperatura(String(values.temperatura));
      if (values.UR !== undefined) setUmidadeRelativa(String(values.UR));
      else if (values.umidadeRelativa !== undefined) setUmidadeRelativa(String(values.umidadeRelativa));
    }
  }, [location]);

  const loadDevices = useCallback(async () => {
    if (!hasUser) {
      setDevices([]);
      setDeviceId('');
      return;
    }
    setIotLoading(true);
    setIotError('');
    try {
      const res = await iotApi.get('/iot/devices');
      if (!mountedRef.current) return;
      const list = Array.isArray(res?.data) ? res.data : [];
      setDevices(list);
      setDeviceId((current) => {
        if (current && list.some((d) => d.deviceId === current)) return current;
        return list[0]?.deviceId || '';
      });
    } catch (err) {
      if (mountedRef.current) {
        setIotError(err?.message || 'Não foi possível carregar seus dispositivos IoT.');
      }
    } finally {
      if (mountedRef.current) {
        setIotLoading(false);
      }
    }
  }, [hasUser]);

  const loadMeasurements = useCallback(
    async (targetDeviceId) => {
      if (!hasUser || !targetDeviceId) {
        setMeasurements([]);
        setSelectedEventId('');
        return;
      }
      setIotLoading(true);
      setIotError('');
      try {
        const res = await iotApi.get('/iot/measurements', {
          deviceId: targetDeviceId,
          limit: 100,
          order: 'desc',
        });
        if (!mountedRef.current) return;
        const rows = Array.isArray(res?.data) ? res.data : [];
        setMeasurements(rows);
        const groups = groupMeasurementsByEvent(rows, targetDeviceId);
        const defaultGroup = groups.find((g) => g.paired.valid) || groups[0];
        setSelectedEventId(defaultGroup ? defaultGroup.eventId : '');
      } catch (err) {
        if (mountedRef.current) {
          setIotError(err?.message || 'Não foi possível carregar as medições do dispositivo.');
        }
      } finally {
        if (mountedRef.current) {
          setIotLoading(false);
        }
      }
    },
    [hasUser]
  );

  useEffect(() => {
    if (activeTab === 'iot' && hasUser) {
      loadDevices();
    }
  }, [activeTab, hasUser, loadDevices]);

  useEffect(() => {
    if (activeTab === 'iot' && hasUser && deviceId) {
      loadMeasurements(deviceId);
    } else if (!deviceId) {
      setMeasurements([]);
      setSelectedEventId('');
    }
  }, [activeTab, hasUser, deviceId, loadMeasurements]);

  const selectedDevice = useMemo(
    () => devices.find((d) => d.deviceId === deviceId) || null,
    [devices, deviceId]
  );

  const eventGroups = useMemo(
    () => groupMeasurementsByEvent(measurements, deviceId),
    [measurements, deviceId]
  );

  const paired = useMemo(
    () =>
      pairDewPointFromEvent(measurements, deviceId, {
        eventId: selectedEventId || undefined,
      }),
    [measurements, deviceId, selectedEventId]
  );

  const executeCalculation = async ({ tempValue, humidityValue, origem, extraHistoryPairs = [] }) => {
    setErro('');
    setResultado(null);
    setLoading(true);
    document.body.classList.add('loading-global');
    try {
      const repo = new PhysicsApiRepository();
      const res = await repo.calcularTermologia({
        action: 'ponto-de-orvalho',
        data: {
          temperatura: tempValue,
          umidadeRelativa: humidityValue,
          origem,
        },
      });
      setResultado(res);

      try {
        if (user) {
          const pairs = [
            `origem=${origem}`,
            ...extraHistoryPairs,
            `T=${tempValue}`,
            `UR=${humidityValue}`,
          ];
          const resultadoStr = formatResult(res?.resultado ?? res);
          await saveHistorico({
            tipo: 'Fisica:Termologia:PontoDeOrvalho',
            valores: pairs.join(', '),
            resultado: resultadoStr,
          });
        }
      } catch (err) {
        console.warn('Não foi possível salvar histórico:', err?.message || err);
      }

      speak(`Ponto de orvalho calculado: ${formatResult(res?.resultado ?? res)}`);
    } catch (err) {
      setErro(err?.message || 'Erro ao calcular o ponto de orvalho.');
      speak('Erro ao calcular o ponto de orvalho');
    } finally {
      setLoading(false);
      document.body.classList.remove('loading-global');
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const validation = validateDewPointInputs(temperatura, umidadeRelativa);
    if (!validation.valid) {
      setErro(validation.reason);
      setResultado(null);
      speak(validation.reason);
      return;
    }
    await executeCalculation({
      tempValue: validation.temperatura,
      humidityValue: validation.umidadeRelativa,
      origem: 'manual',
    });
  };

  const handleIotCalculate = async () => {
    if (!paired.valid) {
      setErro(paired.reason || 'Medição IoT inválida ou incompleta.');
      return;
    }
    await executeCalculation({
      tempValue: paired.temperatura,
      humidityValue: paired.umidadeRelativa,
      origem: 'iot',
      extraHistoryPairs: [
        `deviceId=${paired.deviceId}`,
        `eventId=${paired.eventId}`,
      ],
    });
  };

  const handleRequestReadOnce = async () => {
    if (!deviceId || requestBusy) return;
    stopPolling();
    setIotError('');
    setRequestBusy(true);
    setRequestStatusMsg('Solicitando nova leitura ao dispositivo...');

    const idempotencyKey = generateUuid();

    try {
      const created = await iotApi.post(`/iot/devices/${deviceId}/requests`, {}, idempotencyKey);
      const reqData = created?.data || created;
      const requestId = reqData?.requestId;
      if (!requestId) {
        throw new Error('Resposta inválida ao criar solicitação de leitura.');
      }

      setRequestStatusMsg(statuses[reqData.status] || 'Na fila');

      const poll = async () => {
        if (!mountedRef.current) return;
        try {
          const pollRes = await iotApi.get(`/iot/requests/${requestId}`);
          if (!mountedRef.current) return;
          const statusData = pollRes?.data || pollRes;
          const currentStatus = statusData?.status;

          if (currentStatus === 'COMPLETED') {
            setRequestStatusMsg('Leitura concluída! Carregando medições...');
            if (statusData.resultEventId) {
              const evtRes = await iotApi.get(`/iot/events/${statusData.resultEventId}`);
              if (!mountedRef.current) return;
              const eventRows = Array.isArray(evtRes?.data) ? evtRes.data : [];
              setMeasurements((prev) => {
                const others = prev.filter(
                  (m) => m?.metadata?.eventId !== statusData.resultEventId
                );
                return [...eventRows, ...others];
              });
              setSelectedEventId(statusData.resultEventId);
            } else {
              await loadMeasurements(deviceId);
            }
            setRequestBusy(false);
            setRequestStatusMsg('Nova leitura carregada com sucesso.');
            speak('Nova leitura IoT recebida.');
            return;
          }

          if (['FAILED', 'EXPIRED', 'CANCELLED'].includes(currentStatus)) {
            const msg = statusData.errorCode
              ? requestError(statusData.errorCode)
              : `A solicitação terminou com status: ${statuses[currentStatus] || currentStatus}.`;
            setIotError(msg);
            setRequestStatusMsg('');
            setRequestBusy(false);
            speak('Falha ao obter nova leitura IoT');
            return;
          }

          setRequestStatusMsg(statuses[currentStatus] || currentStatus || 'Aguardando dispositivo...');
          if (PENDING_STATUSES.includes(currentStatus) || !currentStatus) {
            pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
          }
        } catch (err) {
          if (!mountedRef.current) return;
          setIotError(err?.message || 'Erro ao consultar o status da leitura IoT.');
          setRequestStatusMsg('');
          setRequestBusy(false);
        }
      };

      pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    } catch (err) {
      if (!mountedRef.current) return;
      setIotError(err?.message || 'Não foi possível solicitar leitura ao dispositivo.');
      setRequestStatusMsg('');
      setRequestBusy(false);
    }
  };

  const handleClear = () => {
    setTemperatura('');
    setUmidadeRelativa('');
    setResultado(null);
    setErro('');
    speak('Campos limpos');
  };

  const fillManualExample = () => {
    setActiveTab('manual');
    setTemperatura('24');
    setUmidadeRelativa('40');
    setErro('');
    setResultado(null);
    speak('Exemplo copiado para o Modo Manual: temperatura 24 graus e umidade 40 por cento.');
  };

  const switchToManual = () => {
    stopPolling();
    setRequestBusy(false);
    setActiveTab('manual');
    setErro('');
    speak('Modo manual selecionado');
  };

  const canRequestReadOnce =
    Boolean(selectedDevice) &&
    selectedDevice.status === 'ACTIVE' &&
    !selectedDevice.historyOnly &&
    selectedDevice.capacidades?.supportsOnDemand !== false &&
    !requestBusy;

  return (
    <>
      <nav aria-label="breadcrumb" className="nav justify-content-center mt-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item"><Link to="/fisica">Física</Link></li>
          <li className="breadcrumb-item"><Link to="/fisica/termologia">Termologia</Link></li>
          <li className="breadcrumb-item active" aria-current="page">Ponto de Orvalho</li>
        </ol>
      </nav>

      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="d-flex flex-column align-items-center gap-2 mb-4">
            <h2 className="mb-0 text-center">Ponto de Orvalho</h2>
            <FavoriteButton
              resourceId="calc:fisica:termologia:ponto-de-orvalho"
              resourceType="calculation"
              nome="Ponto de Orvalho"
              descricao="Fórmula de Magnus com temperatura e umidade (Manual e IoT)."
            />
          </div>

          <div className="op-card p-4 col-12 col-md-10 col-lg-8">
            <div className="ceos-tab-group mb-4" role="tablist" aria-label="Modo de entrada">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'manual'}
                className={`ceos-tab-btn ${activeTab === 'manual' ? 'ceos-tab-btn--active' : ''}`}
                onClick={switchToManual}
              >
                Modo Manual
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'iot'}
                className={`ceos-tab-btn ${activeTab === 'iot' ? 'ceos-tab-btn--active' : ''}`}
                onClick={() => {
                  setActiveTab('iot');
                  setErro('');
                  speak('Modo IoT selecionado');
                }}
              >
                Modo IoT
              </button>
            </div>

            {activeTab === 'manual' && (
              <form onSubmit={handleManualSubmit} aria-label="Formulário manual de ponto de orvalho">
                <div className="row g-2 mb-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="po-temp">Temperatura (°C)</label>
                    <input
                      id="po-temp"
                      type="number"
                      step="any"
                      className="form-control"
                      placeholder="Ex: 24 (-45 a 60 °C)"
                      value={temperatura}
                      onChange={(e) => setTemperatura(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="po-ur">Umidade relativa (%)</label>
                    <input
                      id="po-ur"
                      type="number"
                      step="any"
                      className="form-control"
                      placeholder="Ex: 40 (> 0 a 100 %)"
                      value={umidadeRelativa}
                      onChange={(e) => setUmidadeRelativa(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                  {loading ? 'Calculando...' : 'Calcular'}
                </button>

                <div className="d-flex justify-content-center">
                  <button
                    type="button"
                    className="btn btn-secondary mt-3"
                    onClick={handleClear}
                    disabled={loading}
                  >
                    <FaWandMagicSparkles style={{ fontSize: 18, color: '#a883ee' }} />
                    <span style={{ fontSize: 15, marginLeft: 8 }}>Limpar</span>
                  </button>
                </div>

                <ExplanationCard
                  formula="γ = ln(UR/100) + (a·T)/(b+T); Td = (b·γ)/(a−γ) [a=17.62, b=243.12]"
                  examplePairs={['T=24 °C', 'UR=40%']}
                  exampleText="T=24 °C, UR=40% → Td ≈ 9.56 °C"
                  onCopyExample={fillManualExample}
                />
              </form>
            )}

            {activeTab === 'iot' && (
              <div aria-label="Painel IoT de ponto de orvalho">
                {!user ? (
                  <div className="alert alert-info">
                    <p className="mb-2">
                      Para usar sensores IoT da sua conta, é necessário entrar na sua conta.
                    </p>
                    <div className="d-flex gap-2 flex-wrap">
                      <Link to="/login" className="btn btn-primary btn-sm">
                        Entrar na conta
                      </Link>
                      <button
                        type="button"
                        className="ceos-chip-btn"
                        onClick={switchToManual}
                      >
                        Usar Modo Manual
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                      <label className="form-label mb-0 fw-semibold" htmlFor="po-iot-device">
                        Dispositivo IoT
                      </label>
                      <button
                        type="button"
                        className="ceos-chip-btn"
                        onClick={() => {
                          loadDevices();
                          if (deviceId) loadMeasurements(deviceId);
                        }}
                        disabled={iotLoading || requestBusy}
                      >
                        {iotLoading ? 'Atualizando...' : 'Atualizar leituras'}
                      </button>
                    </div>

                    <select
                      id="po-iot-device"
                      className="form-select mb-3"
                      value={deviceId}
                      onChange={(e) => {
                        stopPolling();
                        setRequestBusy(false);
                        setRequestStatusMsg('');
                        setIotError('');
                        setDeviceId(e.target.value);
                      }}
                      disabled={iotLoading || requestBusy}
                    >
                      <option value="">Selecione um dispositivo</option>
                      {devices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.nome} ({d.deviceId}) — {deviceStatus(d.status)}
                        </option>
                      ))}
                    </select>

                    {!iotLoading && devices.length === 0 && (
                      <div className="alert alert-secondary">
                        Nenhum dispositivo IoT encontrado na sua conta.{' '}
                        <Link to="/iot">Configurar dispositivo em Meu IoT</Link> ou use o{' '}
                        <button type="button" className="ceos-chip-btn" onClick={switchToManual}>
                          Modo Manual
                        </button>
                        .
                      </div>
                    )}

                    {selectedDevice && (
                      <div className="border rounded p-3 mb-3 bg-light">
                        <div className="fw-semibold mb-1">
                          Sensores disponíveis em {selectedDevice.nome}
                        </div>
                        <div className="d-flex flex-wrap gap-2 mb-2">
                          {(selectedDevice.sensores || []).map((s) => (
                            <span
                              key={s.sensorId}
                              className={`badge ${isDht22Sensor(s) ? 'text-bg-success' : 'text-bg-secondary'}`}
                            >
                              {s.nome || s.sensorId} ({s.tipo} · {s.unidade})
                              {isDht22Sensor(s) ? ' · DHT22 preferencial' : ''}
                            </span>
                          ))}
                        </div>

                        <div className="d-flex gap-2 flex-wrap align-items-center">
                          <button
                            type="button"
                            className="ceos-chip-btn"
                            onClick={handleRequestReadOnce}
                            disabled={!canRequestReadOnce}
                          >
                            {requestBusy
                              ? 'Aguardando leitura...'
                              : 'Solicitar nova leitura (READ_ONCE)'}
                          </button>
                          {selectedDevice.status !== 'ACTIVE' && (
                            <small className="text-muted">
                              Dispositivo {deviceStatus(selectedDevice.status).toLowerCase()} (leitura sob demanda indisponível).
                            </small>
                          )}
                        </div>

                        {requestStatusMsg && (
                          <div className="alert alert-info mt-2 mb-0" role="status">
                            {requestStatusMsg}
                          </div>
                        )}
                      </div>
                    )}

                    {iotError && (
                      <div className="alert alert-danger" role="alert">
                        <div className="mb-2">{iotError}</div>
                        <div className="d-flex gap-2 flex-wrap">
                          {selectedDevice && (
                            <button
                              type="button"
                              className="ceos-chip-btn"
                              onClick={handleRequestReadOnce}
                              disabled={!canRequestReadOnce}
                            >
                              Tentar novamente
                            </button>
                          )}
                          <button
                            type="button"
                            className="ceos-chip-btn"
                            onClick={switchToManual}
                          >
                            Usar Modo Manual
                          </button>
                        </div>
                      </div>
                    )}

                    {deviceId && eventGroups.length > 0 && (
                      <div className="mb-3">
                        <label className="form-label" htmlFor="po-iot-event">
                          Evento de medição (mesmo deviceId e eventId)
                        </label>
                        <select
                          id="po-iot-event"
                          className="form-select"
                          value={selectedEventId}
                          onChange={(e) => setSelectedEventId(e.target.value)}
                          disabled={iotLoading}
                        >
                          {eventGroups.map((g) => (
                            <option key={g.eventId} value={g.eventId}>
                              {formatIotDate(g.timestamp)} · {g.eventId} ({g.paired.valid ? 'Completo' : 'Incompleto'})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {deviceId && !iotLoading && (
                      paired.valid ? (
                        <div className="border rounded p-3 mb-3">
                          <div className="row g-2 mb-2">
                            <div className="col-6">
                              <div className="small text-muted">Temperatura coletada</div>
                              <div className="fs-5 fw-bold">{paired.temperatura} °C</div>
                              <small className="text-muted">Sensor: {paired.tempSensorId}</small>
                            </div>
                            <div className="col-6">
                              <div className="small text-muted">Umidade relativa coletada</div>
                              <div className="fs-5 fw-bold">{paired.umidadeRelativa} %</div>
                              <small className="text-muted">Sensor: {paired.humSensorId}</small>
                            </div>
                          </div>
                          <div className="small text-muted">
                            <div><strong>Dispositivo:</strong> {paired.deviceId}</div>
                            <div><strong>Evento:</strong> <code>{paired.eventId}</code></div>
                            <div><strong>Data/hora:</strong> {formatIotDate(paired.timestamp)}</div>
                            <div>
                              <strong>Origem:</strong> {measurementOrigin(paired.origin)}
                              {paired.isDht22 ? ' · DHT22 pareado' : ''}
                            </div>
                          </div>

                          {paired.isStale && (
                            <div className="alert alert-warning mt-2 mb-0" role="alert">
                              Atenção: esta medição é antiga ({paired.ageMinutes} min atrás, acima de 15 min).
                              Considere solicitar uma nova leitura.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="alert alert-warning" role="alert">
                          <div className="fw-semibold mb-1">Não é possível calcular com este evento IoT</div>
                          <div className="mb-2">{paired.reason}</div>
                          <div className="d-flex gap-2 flex-wrap">
                            {canRequestReadOnce && (
                              <button
                                type="button"
                                className="ceos-chip-btn"
                                onClick={handleRequestReadOnce}
                              >
                                Solicitar nova leitura
                              </button>
                            )}
                            <button
                              type="button"
                              className="ceos-chip-btn"
                              onClick={switchToManual}
                            >
                              Usar Modo Manual
                            </button>
                          </div>
                        </div>
                      )
                    )}

                    <button
                      type="button"
                      className="btn btn-primary w-100"
                      onClick={handleIotCalculate}
                      disabled={!paired.valid || loading || iotLoading}
                    >
                      {loading ? 'Calculando...' : 'Calcular Ponto de Orvalho (IoT)'}
                    </button>
                  </>
                )}
              </div>
            )}

            {erro && <div className="alert alert-danger mt-3" role="alert">{erro}</div>}

            {resultado && (
              <div className="mt-3 ceos-result-card" role="region" aria-label="Resultado do ponto de orvalho">
                <div className="alert alert-success mb-3">
                  <strong>Ponto de Orvalho:</strong> {resultado.resultado}
                </div>

                {resultado.diferencaOrvalho !== undefined && (
                  <p className="mb-2">
                    <strong>Depressão do ponto de orvalho (T − Td):</strong> {resultado.diferencaOrvalho} °C
                  </p>
                )}

                {resultado.formula && (
                  <p className="mb-2">
                    <strong>Fórmula de Magnus:</strong> <code>{resultado.formula}</code>
                  </p>
                )}

                {resultado.variaveis && (
                  <p className="mb-2">
                    <strong>Variáveis:</strong> T = {resultado.variaveis.T} °C, UR = {resultado.variaveis.UR}%, a = {resultado.variaveis.a}, b = {resultado.variaveis.b}
                  </p>
                )}

                {resultado.substituicao && (
                  <p className="mb-2">
                    <strong>Substituição:</strong> <code>{resultado.substituicao}</code>
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
          </div>
        </div>
      </div>
    </>
  );
}

export default PontoDeOrvalho;
