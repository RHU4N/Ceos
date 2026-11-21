import apiClient from '../infrastructure/api/apiClient';
import { iotApi } from '../infrastructure/api/iotApi';

jest.mock('../infrastructure/api/apiClient', () => ({ get: jest.fn(), post: jest.fn(), patch: jest.fn() }));
jest.mock('../config/apiConfig', () => ({ loginApiUrl: '/api/login' }));
afterEach(() => jest.resetAllMocks());

test('traduz falha de transporte e preserva identidade, código e status do erro', async () => {
  const error = Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK', status: 503 });
  apiClient.get.mockRejectedValue(error);
  await expect(iotApi.get('/iot/devices', { page: 2 })).rejects.toBe(error);
  expect(error.message).toBe('Não foi possível conectar ao serviço IoT. Verifique a conexão.');
  expect(error.code).toBe('ERR_NETWORK');
  expect(error.status).toBe(503);
  expect(apiClient.get).toHaveBeenCalledWith('/api/login/iot/devices', { params: { page: 2 } });
});

test('mantém erro de domínio em português e contrato de idempotência sem alterações', async () => {
  const error = Object.assign(new Error('Dispositivo indisponível.'), { code: 'DEVICE_OFFLINE' });
  const input = Object.freeze({ deviceId: 'local-device' });
  apiClient.post.mockRejectedValue(error);
  await expect(iotApi.post('/iot/readings', input, 'local-key')).rejects.toBe(error);
  expect(error.message).toBe('Dispositivo indisponível.');
  expect(apiClient.post).toHaveBeenCalledWith('/api/login/iot/readings', input, { headers: { 'Idempotency-Key': 'local-key' } });
});
