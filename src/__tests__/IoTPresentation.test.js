import React from 'react';
import { render } from '@testing-library/react';
import IoTChart from '../presentation/iot/IoTChart';
import { statuses, deviceStatus, number, measurementOrigin, requestError, date } from '../presentation/iot/presentation';

test('apresenta estados e números em pt-BR sem modificar o contrato recebido', () => {
  const event = Object.freeze({ status: 'WAITING_FOR_DEVICE', valor: 1013.16, timestamp: '2026-11-16T10:00:00Z' });
  expect(statuses[event.status]).toBe('Aguardando dispositivo');
  expect(Object.keys(statuses)).toEqual(['QUEUED', 'WAITING_FOR_DEVICE', 'MEASURING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED']);
  expect(number(event.valor)).toBe('1.013,16');
  expect(number(-5.25)).toBe('-5,25');
  expect(number(0)).toBe('0');
  expect(deviceStatus('PROVISIONING')).toBe('Aguardando pareamento');
  expect(measurementOrigin('READ_ONCE')).toBe('Medição solicitada');
  expect(requestError('SENSOR_FAILURE')).toBe('Não foi possível ler os sensores.');
  expect(date('invalid')).toBe('Sem comunicação');
  expect(event).toEqual({ status: 'WAITING_FOR_DEVICE', valor: 1013.16, timestamp: '2026-11-16T10:00:00Z' });
});

test('gráfico mostra somente amostras válidas reais, sem ligar lacunas por interpolação', () => {
  const rows = [
    { id: '1', sensorId: 't', unidade: 'C', valor: 24.16, timestamp: '2026-11-16T10:00:00Z' },
    { id: '2', sensorId: 't', unidade: 'C', valor: 25.16, timestamp: '2026-11-16T12:00:00Z' },
    { id: '3', sensorId: 't', unidade: 'C', valor: NaN, timestamp: '2026-11-16T11:00:00Z' },
    { id: '4', sensorId: 'other', unidade: 'C', valor: 99, timestamp: '2026-11-16T11:00:00Z' },
  ];
  const { container } = render(<IoTChart sensor={{ sensorId: 't', nome: 'Temperatura', unidade: 'C' }} measurements={rows} />);
  /* eslint-disable testing-library/no-container, testing-library/no-node-access -- estrutura do gráfico SVG (pontos, linha e dica <title>) não tem papel acessível */
  expect(container.querySelectorAll('circle')).toHaveLength(2);
  expect(container.querySelector('polyline')).toBeNull();
  expect(container.querySelector('circle title').textContent).toContain('24,16 °C');
  /* eslint-enable testing-library/no-container, testing-library/no-node-access */
  expect(container.textContent).toContain('Faixa observada: 24,16 a 25,16 °C.');
  expect(rows).toHaveLength(4);
});
