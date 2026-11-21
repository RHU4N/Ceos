import {
  STALE_THRESHOLD_MS,
  groupMeasurementsByEvent,
  isMeasurementStale,
  pairDewPointFromEvent,
  validateDewPointInputs,
} from '../domain/iot/dewPointPairing';

describe('dewPointPairing (unit)', () => {
  const nowMs = Date.parse('2026-11-21T12:00:00Z');
  const freshTs = '2026-11-21T11:55:00Z';
  const staleTs = '2026-11-21T11:30:00Z';

  test('validateDewPointInputs validates Magnus formula bounds', () => {
    expect(validateDewPointInputs(24, 40)).toEqual({
      valid: true,
      temperatura: 24,
      umidadeRelativa: 40,
    });
    expect(validateDewPointInputs(-45, 100).valid).toBe(true);
    expect(validateDewPointInputs(60, 0.1).valid).toBe(true);

    expect(validateDewPointInputs(24, 0).valid).toBe(false);
    expect(validateDewPointInputs(24, 101).valid).toBe(false);
    expect(validateDewPointInputs(-46, 50).valid).toBe(false);
    expect(validateDewPointInputs(61, 50).valid).toBe(false);
    expect(validateDewPointInputs('', 50).valid).toBe(false);
    expect(validateDewPointInputs(24, NaN).valid).toBe(false);
  });

  test('isMeasurementStale uses 15-minute threshold', () => {
    expect(STALE_THRESHOLD_MS).toBe(15 * 60 * 1000);
    expect(isMeasurementStale(freshTs, nowMs)).toBe(false);
    expect(isMeasurementStale(staleTs, nowMs)).toBe(true);
    expect(isMeasurementStale('invalid-date', nowMs)).toBe(true);
  });

  test('prefers DHT22 sensors within the same eventId even when BMP180 is present', () => {
    const measurements = [
      {
        deviceId: 'ceos-dev-1',
        sensorId: 'bmp180-temperatura',
        sensorTipo: 'temperatura',
        valor: 26.5,
        unidade: 'C',
        timestamp: freshTs,
        metadata: { eventId: 'ev-1', physicalSensorId: 'bmp180', origin: 'READ_ONCE' },
      },
      {
        deviceId: 'ceos-dev-1',
        sensorId: 'dht22-temperatura',
        sensorTipo: 'temperatura',
        valor: 24.0,
        unidade: '°C',
        timestamp: freshTs,
        metadata: { eventId: 'ev-1', physicalSensorId: 'dht22', origin: 'READ_ONCE' },
      },
      {
        deviceId: 'ceos-dev-1',
        sensorId: 'dht22-umidade',
        sensorTipo: 'umidade',
        valor: 40.0,
        unidade: '%',
        timestamp: freshTs,
        metadata: { eventId: 'ev-1', physicalSensorId: 'dht22', origin: 'READ_ONCE' },
      },
    ];

    const paired = pairDewPointFromEvent(measurements, 'ceos-dev-1', { nowMs });
    expect(paired).toEqual({
      valid: true,
      deviceId: 'ceos-dev-1',
      eventId: 'ev-1',
      temperatura: 24.0,
      umidadeRelativa: 40.0,
      tempSensorId: 'dht22-temperatura',
      humSensorId: 'dht22-umidade',
      timestamp: freshTs,
      isStale: false,
      ageMinutes: 5,
      origin: 'READ_ONCE',
      isDht22: true,
    });
  });

  test('accepts non-DHT22 fallback when temperature and humidity share the same eventId', () => {
    const measurements = [
      {
        deviceId: 'ceos-dev-1',
        sensorId: 'temp-ext',
        sensorTipo: 'temperatura',
        valor: 22.5,
        unidade: 'C',
        timestamp: freshTs,
        metadata: { eventId: 'ev-fallback' },
      },
      {
        deviceId: 'ceos-dev-1',
        sensorId: 'hum-ext',
        sensorTipo: 'umidade',
        valor: 60,
        unidade: '%',
        timestamp: freshTs,
        metadata: { eventId: 'ev-fallback' },
      },
    ];

    const paired = pairDewPointFromEvent(measurements, 'ceos-dev-1', { nowMs });
    expect(paired.valid).toBe(true);
    expect(paired.isDht22).toBe(false);
    expect(paired.tempSensorId).toBe('temp-ext');
    expect(paired.humSensorId).toBe('hum-ext');
  });

  test('never mixes measurements from different eventIds', () => {
    const measurements = [
      {
        deviceId: 'ceos-dev-1',
        sensorId: 'dht22-temperatura',
        sensorTipo: 'temperatura',
        valor: 24,
        unidade: 'C',
        timestamp: freshTs,
        metadata: { eventId: 'ev-A' },
      },
      {
        deviceId: 'ceos-dev-1',
        sensorId: 'dht22-umidade',
        sensorTipo: 'umidade',
        valor: 45,
        unidade: '%',
        timestamp: freshTs,
        metadata: { eventId: 'ev-B' },
      },
    ];

    const paired = pairDewPointFromEvent(measurements, 'ceos-dev-1', { nowMs });
    expect(paired.valid).toBe(false);
    expect(paired.reason).toBe(
      'Medição incompleta: este evento não possui temperatura e umidade simultâneas.'
    );
  });

  test('never mixes measurements from different devices even with same eventId', () => {
    const measurements = [
      {
        deviceId: 'ceos-dev-1',
        sensorId: 'dht22-temperatura',
        sensorTipo: 'temperatura',
        valor: 24,
        unidade: 'C',
        timestamp: freshTs,
        metadata: { eventId: 'ev-shared' },
      },
      {
        deviceId: 'ceos-dev-2',
        sensorId: 'dht22-umidade',
        sensorTipo: 'umidade',
        valor: 45,
        unidade: '%',
        timestamp: freshTs,
        metadata: { eventId: 'ev-shared' },
      },
    ];

    const paired = pairDewPointFromEvent(measurements, 'ceos-dev-1', { nowMs });
    expect(paired.valid).toBe(false);
    expect(paired.reason).toBe(
      'Medição incompleta: este evento não possui temperatura e umidade simultâneas.'
    );
  });

  test('rejects invalid humidity bounds (UR = 0 and UR = 101) and invalid units', () => {
    const baseTemp = {
      deviceId: 'dev-1',
      sensorId: 'dht22-temperatura',
      sensorTipo: 'temperatura',
      valor: 24,
      unidade: 'C',
      timestamp: freshTs,
      metadata: { eventId: 'ev-1' },
    };

    const zeroHum = {
      deviceId: 'dev-1',
      sensorId: 'dht22-umidade',
      sensorTipo: 'umidade',
      valor: 0,
      unidade: '%',
      timestamp: freshTs,
      metadata: { eventId: 'ev-1' },
    };
    expect(pairDewPointFromEvent([baseTemp, zeroHum], 'dev-1', { nowMs }).valid).toBe(false);

    const overHum = { ...zeroHum, valor: 101 };
    expect(pairDewPointFromEvent([baseTemp, overHum], 'dev-1', { nowMs }).valid).toBe(false);

    const wrongUnitTemp = { ...baseTemp, unidade: 'F' };
    const validHum = { ...zeroHum, valor: 50 };
    expect(pairDewPointFromEvent([wrongUnitTemp, validHum], 'dev-1', { nowMs }).valid).toBe(false);
  });

  test('flags stale measurements and groups multiple events ordered by timestamp desc', () => {
    const measurements = [
      {
        deviceId: 'dev-1',
        sensorId: 'dht22-temperatura',
        sensorTipo: 'temperatura',
        valor: 20,
        unidade: 'C',
        timestamp: staleTs,
        metadata: { eventId: 'ev-old' },
      },
      {
        deviceId: 'dev-1',
        sensorId: 'dht22-umidade',
        sensorTipo: 'umidade',
        valor: 50,
        unidade: '%',
        timestamp: staleTs,
        metadata: { eventId: 'ev-old' },
      },
      {
        deviceId: 'dev-1',
        sensorId: 'dht22-temperatura',
        sensorTipo: 'temperatura',
        valor: 25,
        unidade: 'C',
        timestamp: freshTs,
        metadata: { eventId: 'ev-new' },
      },
    ];

    const groups = groupMeasurementsByEvent(measurements, 'dev-1', nowMs);
    expect(groups.map((g) => g.eventId)).toEqual(['ev-new', 'ev-old']);
    expect(groups[0].paired.valid).toBe(false);
    expect(groups[1].paired.valid).toBe(true);
    expect(groups[1].paired.isStale).toBe(true);
    expect(groups[1].paired.ageMinutes).toBe(30);

    // By default selects the most recent valid event
    const defaultPaired = pairDewPointFromEvent(measurements, 'dev-1', { nowMs });
    expect(defaultPaired.eventId).toBe('ev-old');
    expect(defaultPaired.isStale).toBe(true);
  });
});
