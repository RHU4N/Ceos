import React, { useState } from "react";
import { iotApi } from "../../infrastructure/api/iotApi";
export const weatherSensors = [
  {
    sensorId: "dht22-temperatura",
    nome: "Temperatura DHT22",
    tipo: "temperatura",
    unidade: "C",
  },
  {
    sensorId: "dht22-umidade",
    nome: "Umidade DHT22",
    tipo: "umidade",
    unidade: "%",
  },
  {
    sensorId: "bmp180-temperatura",
    nome: "Temperatura BMP180",
    tipo: "temperatura",
    unidade: "C",
  },
  {
    sensorId: "bmp180-pressao",
    nome: "Pressão BMP180",
    tipo: "pressao",
    unidade: "hPa",
  },
];
export function Provisioning({ value, onClose }) {
  return (
    <section className="iot-panel" role="status">
      <h2>Configure o dispositivo</h2>
      <p>
        Este token de pareamento é exibido uma única vez e expira em 15 minutos.
        Guarde-o somente no dispositivo. Se perder, use “Rotacionar credencial”.
      </p>
      <p>
        Identificador: <code>{value.device.deviceId}</code>
      </p>
      <p>
        Token: <code className="iot-secret">{value.provisioningToken}</code>
      </p>
      <p>
        Envie deviceId e provisioningToken por HTTPS para{" "}
        <code>/iot/device/pair</code> na API CEOS. Guarde o deviceToken
        retornado no firmware. Envie medições para a Azure Function{" "}
        <code>/api/iot/measurements</code>.
      </p>
      <button onClick={onClose}>Concluir configuração</button>
    </section>
  );
}
export default function IoTDeviceSetup({ onSaved }) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [remote, setRemote] = useState(true);
  const [sensors, setSensors] = useState(
    JSON.stringify(weatherSensors, null, 2),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await iotApi.post("/iot/devices", {
        nome,
        descricao,
        tipoDispositivo: "http-json",
        sensores: JSON.parse(sensors),
        capacidades: {
          supportsPush: true,
          supportsOnDemand: remote,
          supportsCommandPolling: remote,
          supportsMultipleSensors: true,
        },
      });
      onSaved(result.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="iot-panel" onSubmit={submit}>
      <h2>Adicionar dispositivo HTTP</h2>
      <label>
        Nome
        <input
          required
          maxLength="80"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </label>
      <label>
        Descrição
        <input
          maxLength="500"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={remote}
          onChange={(e) => setRemote(e.target.checked)}
        />{" "}
        Firmware suporta READ_ONCE e consulta de comandos
      </label>
      <label>
        Sensores (JSON editável)
        <textarea
          rows="12"
          value={sensors}
          onChange={(e) => setSensors(e.target.value)}
          required
        />
      </label>
      <p>
        Adapte os sensores ao equipamento. Tipos e unidades são definidos no
        cadastro.
      </p>
      {error && <p role="alert">{error}</p>}
      <button disabled={busy}>
        {busy ? "Cadastrando…" : "Cadastrar e gerar pareamento"}
      </button>
    </form>
  );
}
