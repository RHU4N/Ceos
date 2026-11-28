import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { iotApi } from "../../infrastructure/api/iotApi";
import IoTChart, { date, unit } from "./IoTChart";
import IoTDeviceSetup, { Provisioning } from "./IoTDeviceSetup";
import IoTPairDevice from "./IoTPairDevice";
import IoTHistory from "./IoTHistory";
import IoTNotifications from "./IoTNotifications";
import "./iot.css";
import { statuses, deviceStatus, sensorType, requestError, number, connectionStatus } from './presentation';
export { statuses } from './presentation';
const pending = ["QUEUED", "WAITING_FOR_DEVICE", "MEASURING", "PROCESSING"];
export default function IoTDashboard() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "dashboard";
  const requestId = params.get("request");
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [rows, setRows] = useState([]);
  const [latest, setLatest] = useState([]);
  const [series, setSeries] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 0,
  });
  const [requests, setRequests] = useState([]);
  const [requestPage, setRequestPage] = useState(1);
  const [requestPages, setRequestPages] = useState(1);
  const [filters, setFilters] = useState({
    sensorId: "",
    sensorTipo: "",
    startDate: "",
    endDate: "",
    order: "desc",
    page: 1,
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [provision, setProvision] = useState(null);
  const [result, setResult] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const inFlight = useRef(false);
  const idempotencyKey = useRef(null);
  const device = devices.find((d) => d.deviceId === deviceId);
  const loadDevices = useCallback(async () => {
    const r = await iotApi.get("/iot/devices");
    setDevices(r.data);
    setDeviceId((current) => current || r.data[0]?.deviceId || "");
  }, []);
  useEffect(() => {
    if (user) loadDevices().catch((e) => setError(e.message));
  }, [user, loadDevices]);
  const load = useCallback(async () => {
    if (!deviceId || !user) return;
    const q = {
      deviceId,
      limit: 25,
      ...Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== ""),
      ),
    };
    for (const key of ["startDate", "endDate"])
      if (q[key]) q[key] = new Date(q[key]).toISOString();
    const [history, values, recent, rr] = await Promise.all([
      iotApi.get("/iot/measurements", q),
      iotApi.get(`/iot/devices/${deviceId}/dashboard`),
      iotApi.get("/iot/measurements", {
        ...q,
        page: 1,
        limit: 100,
        order: "desc",
      }),
      iotApi.get("/iot/requests", { deviceId, page: requestPage, limit: 25 }),
    ]);
    return { history, values, recent, rr };
  }, [deviceId, filters, user, requestPage]);
  useEffect(() => {
    let active = true,
      loading = false;
    async function refresh() {
      if (loading || document.visibilityState === "hidden") return;
      loading = true;
      try {
        const r = await load();
        if (active && r) {
          setRows(r.history.data);
          setPagination(r.history.pagination);
          setLatest(r.values.data);
          setSeries(r.recent.data);
          setRequests(r.rr.data.items);
          setRequestPages(r.rr.data.pagination.totalPages);
        }
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        loading = false;
      }
    }
    refresh();
    const timer = setInterval(refresh, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [load]);
  async function refresh() {
    try {
      setError("");
      await loadDevices();
      const r = await load();
      if (r) {
        setRows(r.history.data);
        setPagination(r.history.pagination);
        setLatest(r.values.data);
        setSeries(r.recent.data);
        setRequests(r.rr.data.items);
      }
    } catch (e) {
      setError(e.message);
    }
  }
  const openEvent = useCallback(async (eventId) => {
    try {
      const r = await iotApi.get(`/iot/events/${eventId}`);
      setResult(r.data);
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    if (!requestId || !user) return;
    let active = true;
    iotApi
      .get(`/iot/requests/${requestId}`)
      .then(async (r) => {
        if (!active) return;
        setDeviceId(r.data.deviceId);
        if (r.data.resultEventId && r.data.status === "COMPLETED")
          await openEvent(r.data.resultEventId);
        else setMessage(statuses[r.data.status] || r.data.status);
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [requestId, user, openEvent]);
  async function readOnce() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();
    try {
      await iotApi.post(
        `/iot/devices/${deviceId}/requests`,
        {},
        idempotencyKey.current,
      );
      idempotencyKey.current = null;
      setMessage("Leitura solicitada. Avisaremos quando estiver pronta.");
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function action(name, id = deviceId) {
    const questions = {
      rotate: "Gerar novo pareamento e invalidar a credencial atual?",
      revoke: "Desconectar este dispositivo? Ele deixa de enviar medições até ser associado de novo. O histórico é preservado.",
      unlink: "Remover este dispositivo da sua conta? As medições anteriores continuam disponíveis no histórico.",
    };
    if (!window.confirm(questions[name])) return;
    try {
      const r = await iotApi.post(`/iot/devices/${id}/${name}`, {});
      if (r.data.provisioningToken) setProvision(r.data);
      if (name === "revoke") setMessage("Dispositivo desconectado. Para reconectar, ligue-o e digite o novo código em Adicionar dispositivo.");
      if (name === "unlink") setMessage("Dispositivo removido. O histórico foi preservado.");
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }
  if (!user)
    return (
      <section className="iot">
        <h1>Meu IoT</h1>
        <p>
          <Link to="/login">Entre na sua conta</Link> para consultar seus
          dispositivos.
        </p>
      </section>
    );
  return (
    <div className="iot">
      <header className="iot-heading">
        <div>
          <p>MINHA CONTA</p>
          <h1>Meu IoT</h1>
          <p>Dispositivos, medições e leituras da sua conta.</p>
        </div>
        <button onClick={refresh}>Atualizar</button>
      </header>
      <nav className="iot-tabs" aria-label="Áreas IoT">
        {[
          ["dashboard", "Painel"],
          ["devices", "Meus dispositivos"],
          ["add", "Adicionar dispositivo"],
          ["history", "Histórico"],
          ["requests", "Solicitações"],
          ["notifications", "Notificações"],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-current={tab === key ? "page" : undefined}
            onClick={() => setParams({ tab: key })}
          >
            {label}
          </button>
        ))}
      </nav>
      {error && (
        <p className="iot-error" role="alert">
          {error}
          <button onClick={() => setError("")}>Fechar</button>
        </p>
      )}
      {message && (
        <p role="status" className="iot-message">
          {message}
        </p>
      )}
      {provision && (
        <Provisioning value={provision} onClose={() => setProvision(null)} />
      )}
      {tab === "add" && (
        <>
          <IoTPairDevice
            onPaired={(value) => {
              setDeviceId(value.device.deviceId);
              setMessage(
                value.reconnected
                  ? "Dispositivo reconectado. O histórico foi mantido; a conexão é concluída em alguns segundos."
                  : "Dispositivo associado. Ele concluirá a conexão em alguns segundos.",
              );
              loadDevices().catch((e) => setError(e.message));
              setParams({ tab: "devices" });
            }}
          />
          <details className="iot-panel iot-advanced">
            <summary>Configuração manual (desenvolvimento)</summary>
            <p>
              Use somente para equipamentos sem suporte ao código de associação.
              Exige copiar um token de pareamento para o firmware.
            </p>
            <IoTDeviceSetup
              onSaved={(value) => {
                setProvision(value);
                setDeviceId(value.device.deviceId);
                loadDevices();
                setParams({ tab: "devices" });
              }}
            />
          </details>
        </>
      )}
      {tab === "devices" && (
        <section>
          <h2>Meus dispositivos IoT</h2>
          <div className="iot-grid">
            {devices.map((d) => (
              <article key={d.deviceId} className="iot-panel iot-device">
                <h3>{d.nome}</h3>
                {d.conexao && (
                  <p className={`iot-badge iot-badge-${d.conexao.toLowerCase()}`}>
                    {connectionStatus(d.conexao)}
                  </p>
                )}
                {d.descricao && <p>{d.descricao}</p>}
                <p>
                  {d.modelo || d.tipoDispositivo || deviceStatus(d.status)} · {d.sensores.length} sensores
                </p>
                <small>
                  Identificador: <code>{d.deviceId}</code>
                </small>
                <p>Último contato: {date(d.ultimoContato)}</p>
                {"ultimaMedicao" in d && <p>Última medição: {d.ultimaMedicao ? date(d.ultimaMedicao) : "Nenhuma ainda"}</p>}
                {d.conexao === "REVOGADO" && (
                  <p>Para reconectar, ligue o dispositivo e digite o novo código em Adicionar dispositivo.</p>
                )}
                <div className="iot-actions">
                  <button
                    onClick={() => {
                      setDeviceId(d.deviceId);
                      setParams({ tab: "dashboard" });
                    }}
                  >
                    Abrir painel
                  </button>
                  {d.status === "ACTIVE" && (
                    <button onClick={() => action("revoke", d.deviceId)}>Desconectar</button>
                  )}
                  {!d.legacy && !d.historyOnly && (
                    <button onClick={() => action("unlink", d.deviceId)}>Remover</button>
                  )}
                </div>
              </article>
            ))}
          </div>
          {!devices.length && (
            <p>
              Nenhum dispositivo associado. Use “Adicionar dispositivo” e digite
              o código exibido pelo equipamento.
            </p>
          )}
        </section>
      )}
      {!["devices", "add", "notifications"].includes(tab) && (
        <label className="iot-selector">
          Dispositivo
          <select
            value={deviceId}
            onChange={(e) => {
              setDeviceId(e.target.value);
              setResult(null);
              setFilters((f) => ({ ...f, page: 1, sensorId: "" }));
              idempotencyKey.current = null;
            }}
          >
            <option value="">Selecione</option>
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.nome}
              </option>
            ))}
          </select>
        </label>
      )}
      {device && tab === "dashboard" && (
        <>
          <section className="iot-panel">
            <h2>{device.nome}</h2>
            <p>{device.descricao}</p>
            <p>
              Estado: {device.conexao ? connectionStatus(device.conexao) : deviceStatus(device.status)} · Último contato:{" "}
              {date(device.ultimoContato)}
            </p>
            <p>
              O último contato indica uma comunicação passada; não garante que o
              equipamento esteja online.
            </p>
            <button
              disabled={
                busy ||
                device.status !== "ACTIVE" ||
                !device.capacidades.supportsOnDemand ||
                requests.some((r) => pending.includes(r.status))
              }
              onClick={readOnce}
            >
              {busy ? "Solicitando…" : "Solicitar leitura"}
            </button>
            {device.historyOnly && (
              <p>Somente histórico. Este vínculo não permite novas leituras.</p>
            )}
            {!device.historyOnly && !device.capacidades.supportsOnDemand && (
              <p>Este dispositivo aceita apenas envio espontâneo.</p>
            )}
            {device.status !== "LEGACY" && !device.historyOnly && (
              <div className="iot-actions">
                <button
                  onClick={() => {
                    setEditing(!editing);
                    setEditName(device.nome);
                    setEditDescription(device.descricao || "");
                  }}
                >
                  Editar
                </button>
                <button onClick={() => action("rotate")}>
                  Rotacionar credencial
                </button>
                <button onClick={() => action("revoke")}>Desconectar</button>
                <button onClick={() => action("unlink")}>Remover</button>
              </div>
            )}
            {editing && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await iotApi.patch(`/iot/devices/${deviceId}`, {
                      nome: editName,
                      descricao: editDescription,
                    });
                    setEditing(false);
                    await loadDevices();
                  } catch (e) {
                    setError(e.message);
                  }
                }}
              >
                <label>
                  Nome
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    maxLength="80"
                  />
                </label>
                <label>
                  Descrição
                  <input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    maxLength="500"
                  />
                </label>
                <button>Salvar</button>
              </form>
            )}
          </section>
          <div className="iot-grid">
            {device.sensores.map((sensor) => {
              const m = latest.find((row) => row.sensorId === sensor.sensorId);
              return (
                <article className="iot-panel" key={sensor.sensorId}>
                  <h3>{sensor.nome}</h3>
                  <p className="iot-value">
                    {m ? `${number(m.valor)} ${unit(m.unidade)}` : "Sem medição"}
                  </p>
                  <p>
                    {sensor.sensorId} · {sensorType(sensor.tipo)}
                  </p>
                  {m && (
                    <>
                      <time>{date(m.timestamp)}</time>
                      <p>
                        {m.metadata?.timestampOrigin === "collectedAt"
                          ? "Coletado no dispositivo"
                          : "Recebido no servidor"}
                      </p>
                    </>
                  )}
                  <IoTChart sensor={sensor} measurements={series} />
                </article>
              );
            })}
          </div>
        </>
      )}
      {tab === "history" && (
        <>
          <form className="iot-filters" onSubmit={(e) => e.preventDefault()}>
            {[
              ["sensorId", "Sensor"],
              ["sensorTipo", "Tipo"],
              ["startDate", "De"],
              ["endDate", "Até"],
            ].map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  type={key.endsWith("Date") ? "datetime-local" : "text"}
                  value={filters[key]}
                  onChange={(e) =>
                    setFilters({ ...filters, [key]: e.target.value, page: 1 })
                  }
                />
              </label>
            ))}
            <label>
              Ordem
              <select
                value={filters.order}
                onChange={(e) =>
                  setFilters({ ...filters, order: e.target.value, page: 1 })
                }
              >
                <option value="desc">Mais recentes</option>
                <option value="asc">Mais antigas</option>
              </select>
            </label>
          </form>
          <IoTHistory
            rows={rows}
            pagination={pagination}
            onPage={(page) => setFilters({ ...filters, page })}
            onOpen={openEvent}
          />
        </>
      )}
      {tab === "requests" && (
        <section>
          <h2>Solicitações de leitura</h2>
          {!requests.length && (
            <p>Nenhuma solicitação para este dispositivo.</p>
          )}
          {requests.map((r) => (
            <article className="iot-panel" key={r.requestId}>
              <strong>{statuses[r.status]}</strong>
              <p>{r.requestId}</p>
              <p>
                {date(r.createdAt)} · Prazo: {date(r.expiresAt)}
              </p>
              {r.errorCode && <p>{requestError(r.errorCode)} <small>Código: {r.errorCode}</small></p>}
              {r.status === "COMPLETED" && (
                <button onClick={() => openEvent(r.resultEventId)}>
                  Ver resultado
                </button>
              )}
              {pending.includes(r.status) && (
                <button
                  onClick={async () => {
                    try {
                      await iotApi.post(
                        `/iot/requests/${r.requestId}/cancel`,
                        {},
                      );
                      await refresh();
                    } catch (e) {
                      setError(e.message);
                    }
                  }}
                >
                  Cancelar
                </button>
              )}
            </article>
          ))}
          <button
            disabled={requestPage === 1}
            onClick={() => setRequestPage(requestPage - 1)}
          >
            Anterior
          </button>{" "}
          {requestPage}{" "}
          <button
            disabled={requestPage >= requestPages}
            onClick={() => setRequestPage(requestPage + 1)}
          >
            Próxima
          </button>
        </section>
      )}
      {tab === "notifications" && <IoTNotifications />}
      {result && (
        <section className="iot-panel" aria-label="Resultado da leitura">
          <h2>Resultado da leitura</h2>
          <button onClick={() => setResult(null)}>Fechar resultado</button>
          {result.map((m) => (
            <p key={m._id || m.id}>
              <strong>{m.sensorId}</strong>: {number(m.valor)} {unit(m.unidade)} ·{" "}
              {date(m.timestamp)} ·{" "}
              {m.metadata?.timestampOrigin === "collectedAt"
                ? "Coleta"
                : "Recebimento"}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}
