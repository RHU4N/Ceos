// Apresentação somente: contratos, identificadores e valores recebidos não mudam.
export const statuses = Object.freeze({
  QUEUED: 'Na fila', WAITING_FOR_DEVICE: 'Aguardando dispositivo',
  MEASURING: 'Realizando medição', PROCESSING: 'Processando',
  COMPLETED: 'Concluído', FAILED: 'Falhou', EXPIRED: 'Expirado', CANCELLED: 'Cancelado',
});
const devices = { ACTIVE: 'Ativo', PROVISIONING: 'Aguardando pareamento', REVOKED: 'Revogado', UNLINKED: 'Desvinculado', ARCHIVED: 'Histórico preservado', LEGACY: 'Legado', PENDING: 'Pendente' };
const kinds = { temperatura: 'Temperatura', umidade: 'Umidade', pressao: 'Pressão' };
const origins = { PUSH: 'Envio do dispositivo', READ_ONCE: 'Medição solicitada', LEGACY: 'Envio legado' };
const errors = { SENSOR_FAILURE: 'Não foi possível ler os sensores.', DEVICE_OFFLINE: 'Dispositivo offline.', DEVICE_TIMEOUT: 'O dispositivo não respondeu dentro do prazo.', DEVICE_REVOKED: 'A credencial do dispositivo foi revogada.', LEASE_EXPIRED: 'O prazo de atendimento expirou.', REQUEST_EXPIRED: 'A solicitação expirou.', DEVICE_UNLINKED: 'O dispositivo foi desvinculado.', CANCELLED: 'A solicitação foi cancelada.' };
export const deviceStatus = value => devices[value] || 'Estado não reconhecido';
export const sensorType = value => kinds[value] || value;
export const measurementOrigin = value => origins[value || 'PUSH'] || 'Origem não reconhecida';
export const requestError = value => errors[value] || 'Não foi possível concluir a solicitação. Tente novamente ou verifique o dispositivo.';
export const number = value => Number.isFinite(value) ? new Intl.NumberFormat('pt-BR', { maximumSignificantDigits: 21 }).format(value) : '—';
export const unit = value => value === 'C' ? '°C' : value;
export const date = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('pt-BR') : 'Sem comunicação';
