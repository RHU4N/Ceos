import MathApiRepository from '../infrastructure/api/MathApiRepository';
import apiClient from '../infrastructure/api/mathApiClient';

jest.mock('../infrastructure/api/mathApiClient', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
}));

describe('MathApiRepository extra (unit)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('calcularFuncao returns primitive number when backend responds with number', async () => {
    const repo = new MathApiRepository();
    apiClient.post.mockResolvedValue({ status: 200, data: { success: true, data: { tipo: 'linear', resultado: 7 } } });
    const out = await repo.calcularFuncao({ tipo: 'funcao1', data: {} });
    expect(out).toBe(7);
  });

  test('calcularFuncao unwraps resultado.value when present', async () => {
    const repo = new MathApiRepository();
    const composite = { raizes: [-1, 1], delta: 4 };
    apiClient.post.mockResolvedValue({ status: 200, data: { success: true, data: { tipo: 'quadratica', resultado: composite } } });
    const out = await repo.calcularFuncao({ tipo: 'funcao2', data: {} });
    expect(out).toEqual(composite);
  });

  test('preserves zero instead of falling back to the response envelope', async () => {
    const repo = new MathApiRepository();
    apiClient.post.mockResolvedValue({ status: 200, data: { success: true, data: { tipo: 'linear', resultado: 0 } } });
    await expect(repo.calcularFuncao({ tipo: 'funcao1', data: {} })).resolves.toBe(0);
  });

  test('calcularFuncao throws on error status', async () => {
    const repo = new MathApiRepository();
    apiClient.post.mockResolvedValue({ status: 500, data: { error: 'boom' } });
    await expect(repo.calcularFuncao({ tipo: 'funcao1', data: {} })).rejects.toThrow();
  });
});
