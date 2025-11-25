// Ensure api base is defined before module import (force deterministic URL for tests)
process.env.REACT_APP_MATH_API_URL = 'http://api';

import apiClient from '../infrastructure/api/apiClient';
jest.mock('../infrastructure/api/apiClient', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

import ChemistryApiRepository from '../infrastructure/api/ChemistryApiRepository';

describe('ChemistryApiRepository (unit)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('calcular returns resultado when present', async () => {
    const repo = new ChemistryApiRepository();
    apiClient.post.mockResolvedValue({ status: 200, data: { resultado: { ph: 7 } } });
    const out = await repo.calcular({ action: 'ph', data: { } });
    expect(apiClient.post).toHaveBeenCalled();
    expect(out).toEqual({ ph: 7 });
  });

  test('calcular returns primitive when backend returns primitive', async () => {
    const repo = new ChemistryApiRepository();
    apiClient.post.mockResolvedValue({ status: 200, data: 42 });
    const out = await repo.calcular({ action: 'molaridade', data: {} });
    expect(out).toBe(42);
  });

  test('calcular throws on non-2xx status', async () => {
    const repo = new ChemistryApiRepository();
    apiClient.post.mockResolvedValue({ status: 500, data: { error: 'boom' } });
    await expect(repo.calcular({ action: 'molaridade', data: {} })).rejects.toThrow();
  });
});
