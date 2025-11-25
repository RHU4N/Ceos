import MathApiRepository from '../infrastructure/api/MathApiRepository';
import apiClient from '../infrastructure/api/apiClient';

jest.mock('../infrastructure/api/apiClient', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
}));

describe('MathApiRepository extra (unit)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('calcularFuncao returns primitive number when backend responds with number', async () => {
    const repo = new MathApiRepository();
    apiClient.post.mockResolvedValue({ status: 200, data: 7 });
    const out = await repo.calcularFuncao({ tipo: 'funcao1', data: {} });
    expect(out).toBe(7);
  });

  test('calcularFuncao unwraps resultado.value when present', async () => {
    const repo = new MathApiRepository();
    apiClient.post.mockResolvedValue({ status: 200, data: { resultado: { value: 99 } } });
    const out = await repo.calcularFuncao({ tipo: 'funcao1', data: {} });
    expect(out).toBe(99);
  });

  test('calcularFuncao throws on error status', async () => {
    const repo = new MathApiRepository();
    apiClient.post.mockResolvedValue({ status: 500, data: { error: 'boom' } });
    await expect(repo.calcularFuncao({ tipo: 'funcao1', data: {} })).rejects.toThrow();
  });
});
