export const STALE_THRESHOLD_MS = 15 * 60 * 1000;

const MIN_TEMP_MAGNUS_C = -45;
const MAX_TEMP_MAGNUS_C = 60;

/**
 * Checks whether a measurement timestamp is older than the 15-minute freshness threshold.
 */
export function isMeasurementStale(timestamp, nowMs = Date.now()) {
  const ts = typeof timestamp === 'number' ? timestamp : Date.parse(timestamp);
  if (!Number.isFinite(ts)) return true;
  return (nowMs - ts) > STALE_THRESHOLD_MS;
}

/**
 * Validates temperature (°C) and relative humidity (%) against the Magnus formula domain.
 */
export function validateDewPointInputs(temperatura, umidadeRelativa) {
  if (temperatura === null || temperatura === undefined || temperatura === '' || typeof temperatura === 'boolean') {
    return { valid: false, reason: 'Informe uma temperatura numérica válida em °C.' };
  }
  const T = Number(temperatura);
  if (!Number.isFinite(T)) {
    return { valid: false, reason: 'Informe uma temperatura numérica finita em °C.' };
  }
  if (T < MIN_TEMP_MAGNUS_C || T > MAX_TEMP_MAGNUS_C) {
    return {
      valid: false,
      reason: `Temperatura (${T} °C) fora do domínio válido da fórmula de Magnus [${MIN_TEMP_MAGNUS_C} °C, ${MAX_TEMP_MAGNUS_C} °C].`,
    };
  }

  if (umidadeRelativa === null || umidadeRelativa === undefined || umidadeRelativa === '' || typeof umidadeRelativa === 'boolean') {
    return { valid: false, reason: 'Informe uma umidade relativa numérica válida em %.' };
  }
  const UR = Number(umidadeRelativa);
  if (!Number.isFinite(UR)) {
    return { valid: false, reason: 'Informe uma umidade relativa numérica finita em %.' };
  }
  if (UR <= 0 || UR > 100) {
    return {
      valid: false,
      reason: 'Umidade relativa deve ser maior que 0% e menor ou igual a 100%.',
    };
  }

  return { valid: true, temperatura: T, umidadeRelativa: UR };
}

function isTemperatureReading(m) {
  if (!m || typeof m !== 'object') return false;
  const tipo = String(m.sensorTipo || '').trim().toLowerCase();
  return m.sensorId === 'dht22-temperatura' || tipo === 'temperatura';
}

function isHumidityReading(m) {
  if (!m || typeof m !== 'object') return false;
  const tipo = String(m.sensorTipo || '').trim().toLowerCase();
  return m.sensorId === 'dht22-umidade' || tipo === 'umidade';
}

function isDht22Reading(m) {
  if (!m || typeof m !== 'object') return false;
  return (
    m.sensorId === 'dht22-temperatura' ||
    m.sensorId === 'dht22-umidade' ||
    m.physicalSensorId === 'dht22' ||
    m.metadata?.physicalSensorId === 'dht22'
  );
}

function isValidTemperatureUnit(unidade) {
  if (typeof unidade !== 'string') return false;
  const norm = unidade.trim().toLowerCase();
  return norm === 'c' || norm === '°c';
}

function isValidHumidityUnit(unidade) {
  if (typeof unidade !== 'string') return false;
  return unidade.trim() === '%';
}

function pickSensorReading(list, predicate, isPreferred) {
  const candidates = list.filter(predicate);
  if (candidates.length === 0) return null;
  const preferred = candidates.find(isPreferred);
  return preferred || candidates[0];
}

function evaluateEventGroup(group, nowMs = Date.now()) {
  const { eventId, deviceId, measurements, timestamp } = group;
  const tempReading = pickSensorReading(measurements, isTemperatureReading, isDht22Reading);
  const humReading = pickSensorReading(measurements, isHumidityReading, isDht22Reading);

  if (!tempReading || !humReading) {
    return {
      valid: false,
      deviceId,
      eventId,
      timestamp,
      tempSensorId: tempReading?.sensorId || null,
      humSensorId: humReading?.sensorId || null,
      reason: 'Medição incompleta: este evento não possui temperatura e umidade simultâneas.',
    };
  }

  if (!isValidTemperatureUnit(tempReading.unidade)) {
    return {
      valid: false,
      deviceId,
      eventId,
      timestamp,
      tempSensorId: tempReading.sensorId,
      humSensorId: humReading.sensorId,
      reason: `Unidade de temperatura inválida (${tempReading.unidade || 'ausente'}): esperado °C ou C.`,
    };
  }

  if (!isValidHumidityUnit(humReading.unidade)) {
    return {
      valid: false,
      deviceId,
      eventId,
      timestamp,
      tempSensorId: tempReading.sensorId,
      humSensorId: humReading.sensorId,
      reason: `Unidade de umidade inválida (${humReading.unidade || 'ausente'}): esperado %.`,
    };
  }

  const validation = validateDewPointInputs(tempReading.valor, humReading.valor);
  if (!validation.valid) {
    return {
      valid: false,
      deviceId,
      eventId,
      timestamp,
      tempSensorId: tempReading.sensorId,
      humSensorId: humReading.sensorId,
      reason: validation.reason,
    };
  }

  const effectiveTimestamp = tempReading.timestamp || humReading.timestamp || timestamp;
  const parsedTs = Date.parse(effectiveTimestamp);
  const isStale = isMeasurementStale(effectiveTimestamp, nowMs);
  const ageMinutes = Number.isFinite(parsedTs)
    ? Math.max(0, Math.round((nowMs - parsedTs) / 60000))
    : null;
  const origin =
    tempReading.metadata?.origin ||
    humReading.metadata?.origin ||
    (tempReading.metadata?.requestId || humReading.metadata?.requestId ? 'READ_ONCE' : 'PUSH');
  const isDht22 = isDht22Reading(tempReading) && isDht22Reading(humReading);

  return {
    valid: true,
    deviceId,
    eventId,
    temperatura: validation.temperatura,
    umidadeRelativa: validation.umidadeRelativa,
    tempSensorId: tempReading.sensorId,
    humSensorId: humReading.sensorId,
    timestamp: effectiveTimestamp,
    isStale,
    ageMinutes,
    origin,
    isDht22,
  };
}

/**
 * Groups measurements strictly by `deviceId` and `metadata.eventId` without mixing events or devices.
 */
export function groupMeasurementsByEvent(measurements, deviceId, nowMs = Date.now()) {
  if (!Array.isArray(measurements) || !deviceId) return [];

  const groupsMap = new Map();

  for (const m of measurements) {
    if (!m || typeof m !== 'object') continue;
    if (m.deviceId !== deviceId) continue;

    const eventId = m.metadata?.eventId;
    if (typeof eventId !== 'string' || !eventId.trim()) continue;

    let group = groupsMap.get(eventId);
    if (!group) {
      group = {
        eventId,
        deviceId,
        measurements: [],
        latestMs: -Infinity,
        timestamp: m.timestamp || null,
      };
      groupsMap.set(eventId, group);
    }

    group.measurements.push(m);
    const ms = Date.parse(m.timestamp);
    if (Number.isFinite(ms) && ms > group.latestMs) {
      group.latestMs = ms;
      group.timestamp = m.timestamp;
    } else if (!group.timestamp && m.timestamp) {
      group.timestamp = m.timestamp;
    }
  }

  return Array.from(groupsMap.values())
    .sort((a, b) => b.latestMs - a.latestMs)
    .map((group) => {
      const paired = evaluateEventGroup(group, nowMs);
      return {
        eventId: group.eventId,
        deviceId: group.deviceId,
        timestamp: group.timestamp,
        measurements: group.measurements,
        paired,
      };
    });
}

/**
 * Pairs simultaneous temperature and humidity readings belonging to the same device and eventId.
 */
export function pairDewPointFromEvent(measurements, deviceId, options = {}) {
  const { eventId, nowMs = Date.now() } = options || {};

  if (!deviceId) {
    return { valid: false, reason: 'Selecione um dispositivo IoT válido.' };
  }

  const groups = groupMeasurementsByEvent(measurements, deviceId, nowMs);
  if (groups.length === 0) {
    return {
      valid: false,
      deviceId,
      eventId: eventId || null,
      reason: 'Medição incompleta: nenhuma leitura com evento simultâneo encontrada para este dispositivo.',
    };
  }

  if (eventId) {
    const target = groups.find((g) => g.eventId === eventId);
    if (!target) {
      return {
        valid: false,
        deviceId,
        eventId,
        reason: 'Evento selecionado não encontrado para este dispositivo.',
      };
    }
    return target.paired;
  }

  const firstValid = groups.find((g) => g.paired.valid);
  if (firstValid) {
    return firstValid.paired;
  }

  return groups[0].paired;
}
