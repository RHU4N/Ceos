import React from "react";
import { number, unit, date } from './presentation';
export { unit, date } from './presentation';
export default function IoTChart({ sensor, measurements }) {
  const values = measurements
    .filter(
      (m) => m.sensorId === sensor.sensorId && m.unidade === sensor.unidade && Number.isFinite(m.valor) && Number.isFinite(Date.parse(m.timestamp)),
    )
    .slice()
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  if (!values.length) return <p>Sem medições para {sensor.nome}.</p>;
  const min = Math.min(...values.map((m) => m.valor)),
    max = Math.max(...values.map((m) => m.valor));
  const first = Date.parse(values[0].timestamp),
    last = Date.parse(values[values.length - 1].timestamp);
  const x = (m) =>
    60 + ((Date.parse(m.timestamp) - first) / (last - first || 1)) * 470;
  const y = (m) => 160 - ((m.valor - min) / (max - min || 1)) * 120;
  return (
    <figure className="iot-chart">
      <figcaption>
        {sensor.nome} · {unit(sensor.unidade)}
      </figcaption>
      <svg
        viewBox="0 0 600 230"
        role="img"
        aria-label={`Variação temporal de ${sensor.nome}, ${unit(sensor.unidade)}`}
      >
        <path d="M60 25V175H550" fill="none" stroke="#758195" />
        <text x="4" y="42">
          {number(max)}
        </text>
        <text x="4" y="165">
          {number(min)}
        </text>
        {values.map((m) => (
          <circle
            key={m.id || m._id}
            cx={x(m)}
            cy={y(m)}
            r="4"
            tabIndex="0"
            fill="#176baf"
          >
            <title>
              {date(m.timestamp)}: {number(m.valor)} {unit(m.unidade)}
            </title>
          </circle>
        ))}
        <text x="60" y="200">
          {date(values[0].timestamp)}
        </text>
        <text x="550" y="220" textAnchor="end">
          {date(values[values.length - 1].timestamp)}
        </text>
      </svg>
      <p>
        Faixa observada: {number(min)} a {number(max)} {unit(sensor.unidade)}.
        {" "}Intervalo: {date(values[0].timestamp)} a {date(values[values.length - 1].timestamp)}.
      </p>
      <small>
        Últimas {values.length} amostras do período consultado. Use o histórico
        para outros períodos. Os pontos representam somente medições recebidas,
        sem interpolação de dados ausentes.
      </small>
    </figure>
  );
}
