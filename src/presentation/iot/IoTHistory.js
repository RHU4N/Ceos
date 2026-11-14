import React from "react";
import { date, unit } from "./IoTChart";
export default function IoTHistory({ rows, pagination, onPage, onOpen }) {
  return (
    <section>
      <h2>Histórico de medições</h2>
      {!rows.length ? (
        <p>Nenhuma medição neste filtro.</p>
      ) : (
        <div className="iot-table">
          <table>
            <thead>
              <tr>
                <th>Dispositivo / sensor</th>
                <th>Valor</th>
                <th>Data e origem</th>
                <th>Leitura</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id || m._id}>
                  <td>
                    {m.deviceId}
                    <br />
                    {m.sensorId} · {m.sensorTipo}
                  </td>
                  <td>
                    {m.valor} {unit(m.unidade)}
                  </td>
                  <td>
                    {date(m.timestamp)}
                    <br />
                    {m.metadata?.timestampOrigin === "collectedAt"
                      ? "Coleta no dispositivo"
                      : "Recebimento no servidor"}
                    <br />
                    {m.metadata?.origin || "PUSH"}
                  </td>
                  <td>
                    {m.metadata?.eventId ? (
                      <button onClick={() => onOpen(m.metadata.eventId)}>
                        Abrir leitura
                      </button>
                    ) : (
                      "Avulsa"
                    )}
                    {m.metadata?.requestId && (
                      <small>Solicitação: {m.metadata.requestId}</small>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="iot-actions">
        <button
          disabled={pagination.page <= 1}
          onClick={() => onPage(pagination.page - 1)}
        >
          Anterior
        </button>
        <span>
          Página {pagination.page} de {pagination.totalPages || 1} ·{" "}
          {pagination.total} medições
        </span>
        <button
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPage(pagination.page + 1)}
        >
          Próxima
        </button>
      </div>
    </section>
  );
}
