import MathApiRepository from '../infrastructure/api/MathApiRepository';
import apiClient from '../infrastructure/api/apiClient';

// Provide an explicit mock for apiClient so `post` is always available
jest.mock('../infrastructure/api/apiClient', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
}));

describe('MathApiRepository (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('mapFuncaoTipo maps frontend types to backend', async () => {
    const repo = new MathApiRepository();
    // apiClient.post will be called; mock a successful response
    apiClient.post.mockResolvedValue({ status: 200, data: { resultado: { value: 42 } } });

    const res = await repo.calcularFuncao({ tipo: 'funcao1', data: { x: 1 } });
    expect(apiClient.post).toHaveBeenCalled();
    expect(res).toBe(42);
  });

  test('calcularEstatistica maps numeros -> valores and returns resultado', async () => {
    const repo = new MathApiRepository();
    apiClient.post.mockResolvedValue({ status: 200, data: { resultado: 3.14 } });

    const res = await repo.calcularEstatistica({ tipo: 'media', data: { numeros: [1, 2, 3] } });
    expect(apiClient.post).toHaveBeenCalled();
    expect(res).toBe(3.14);
  });

  test('calcularAnaliseComb maps types and returns payload on unknown result shape', async () => {
    const repo = new MathApiRepository();
    apiClient.post.mockResolvedValue({ status: 200, data: { any: 'value' } });

    const res = await repo.calcularAnaliseComb({ tipo: 'permutacao', data: { n: 5 } });
    expect(apiClient.post).toHaveBeenCalled();
    expect(res).toEqual({ any: 'value' });
  });
});
