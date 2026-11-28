import React, { useState } from "react";
import { iotApi } from "../../infrastructure/api/iotApi";
import { formatPairingCode, isPairingCodeComplete, sensorType, unit } from "./presentation";

// Associação por código temporário: o dispositivo exibe o código e o usuário o confirma aqui.
// Nenhum token é exibido ou copiado; a credencial vai direto da API para o dispositivo.
export default function IoTPairDevice({ onPaired }) {
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState(null);
  const [nome, setNome] = useState("");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function lookup(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await iotApi.post("/iot/claims/lookup", { code });
      setPreview(r.data);
      setNome(r.data.nomeSugerido || "");
      setTarget("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function confirm(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await iotApi.post("/iot/claims/confirm", {
        code,
        nome,
        ...(target && { deviceId: target }),
      });
      setPreview(null);
      setCode("");
      onPaired(r.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!preview)
    return (
      <form className="iot-panel iot-pair" onSubmit={lookup}>
        <h2>Adicionar dispositivo</h2>
        <ol>
          <li>Ligue o dispositivo (ou inicie a simulação no Wokwi).</li>
          <li>Ele exibirá um código de associação de 8 caracteres.</li>
          <li>Digite o código abaixo. Ele vale 10 minutos e só pode ser usado uma vez.</li>
        </ol>
        <label>
          Código exibido no dispositivo
          <input
            className="iot-code"
            value={code}
            onChange={(e) => setCode(formatPairingCode(e.target.value))}
            placeholder="XXXX-XXXX"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck="false"
            maxLength="9"
            aria-describedby="iot-code-help"
            required
          />
        </label>
        <small id="iot-code-help">Letras e números; o hífen é inserido automaticamente.</small>
        {error && <p role="alert">{error}</p>}
        <button disabled={busy || !isPairingCodeComplete(code)}>
          {busy ? "Verificando…" : "Continuar"}
        </button>
      </form>
    );

  return (
    <form className="iot-panel iot-pair" onSubmit={confirm}>
      <h2>Confirmar dispositivo</h2>
      <p>Confira se estes dados correspondem ao equipamento que você ligou.</p>
      <dl className="iot-pair-details">
        <dt>Modelo</dt>
        <dd>{preview.modelo || preview.tipoDispositivo || "Não informado"}</dd>
        {preview.fabricante && (
          <>
            <dt>Fabricante</dt>
            <dd>{preview.fabricante}</dd>
          </>
        )}
        {preview.hardwareId && (
          <>
            <dt>Identificador do hardware</dt>
            <dd>
              <code>{preview.hardwareId}</code>
            </dd>
          </>
        )}
        <dt>Sensores</dt>
        <dd>
          <ul>
            {preview.sensores.map((s) => (
              <li key={s.sensorId}>
                {s.nome} ({sensorType(s.tipo)}, {unit(s.unidade)})
              </li>
            ))}
          </ul>
        </dd>
      </dl>
      {preview.reconnectable?.length > 0 && (
        <fieldset>
          <legend>Como associar</legend>
          <label>
            <input
              type="radio"
              name="iot-target"
              checked={target === ""}
              onChange={() => setTarget("")}
            />{" "}
            Como um novo dispositivo
          </label>
          {preview.reconnectable.map((d) => (
            <label key={d.deviceId}>
              <input
                type="radio"
                name="iot-target"
                checked={target === d.deviceId}
                onChange={() => {
                  setTarget(d.deviceId);
                  setNome(d.nome);
                }}
              />{" "}
              Reconectar “{d.nome}” (mantém o histórico)
            </label>
          ))}
        </fieldset>
      )}
      <label>
        Nome do dispositivo
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength="80"
          required
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <div className="iot-actions">
        <button disabled={busy}>{busy ? "Associando…" : "Associar dispositivo"}</button>
        <button
          type="button"
          onClick={() => {
            setPreview(null);
            setError("");
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
