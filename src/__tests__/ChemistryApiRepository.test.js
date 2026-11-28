import apiClient from '../infrastructure/api/mathApiClient';
import ChemistryApiRepository from '../infrastructure/api/ChemistryApiRepository';

// Os imports já eram içados pelo Babel antes desta linha; a ordem de execução não muda.
process.env.REACT_APP_API_MATH_URL = 'http://api';

jest.mock('../infrastructure/api/mathApiClient', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

describe('ChemistryApiRepository (unit)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('calcular returns resultado when present', async () => {
    const repo = new ChemistryApiRepository();
    apiClient.post.mockResolvedValue({ status: 200, data: { success: true, data: { resultado: { ph: 7 } } } });
    const out = await repo.calcular({ action: 'ph', data: { } });
    expect(apiClient.post).toHaveBeenCalled();
    expect(out).toEqual({ ph: 7 });
  });

  test('calcular returns primitive when backend returns primitive', async () => {
    const repo = new ChemistryApiRepository();
    apiClient.post.mockResolvedValue({ status: 200, data: { success: true, data: { resultado: 42 } } });
    const out = await repo.calcular({ action: 'molaridade', data: {} });
    expect(out).toBe(42);
  });

  test('calcular throws on non-2xx status', async () => {
    const repo = new ChemistryApiRepository();
    apiClient.post.mockResolvedValue({ status: 500, data: { error: 'boom' } });
    await expect(repo.calcular({ action: 'molaridade', data: {} })).rejects.toThrow();
  });

  test('concentration page amount uses the API soluto contract', async () => {
    apiClient.post.mockResolvedValue({ status: 200, data: { success: true, data: { resultado: '4 mol/L' } } });
    const out = await new ChemistryApiRepository().calcular({ action: 'molaridade', data: { moles: 2, volume: 0.5 } });
    expect(apiClient.post).toHaveBeenCalledWith(expect.stringMatching(/\/solucoes\/molaridade$/), { soluto: 2, volume: 0.5 }, expect.any(Object));
    expect(out).toBe('4 mol/L');
  });

  test('solution page keeps its canonical soluto payload', async () => {
    apiClient.post.mockResolvedValue({ status: 200, data: { success: true, data: { resultado: '4 mol/L' } } });
    await new ChemistryApiRepository().calcular({ action: 'molaridade', data: { soluto: 2, volume: 0.5 } });
    expect(apiClient.post).toHaveBeenCalledWith(expect.stringMatching(/\/solucoes\/molaridade$/), { soluto: 2, volume: 0.5 }, expect.any(Object));
  });

  test('calcularEstequiometria returns full unwrapped data payload', async () => {
    const fullData = {
      resultado: '2 H2 + O2 -> 2 H2O',
      equacaoBalanceada: '2 H2 + O2 -> 2 H2O',
      passos: ['step 1'],
    };
    apiClient.post.mockResolvedValue({ status: 200, data: { success: true, data: fullData } });
    const out = await new ChemistryApiRepository().calcularEstequiometria({
      action: 'balanceamento',
      data: { equacao: 'H2 + O2 -> H2O' },
    });
    expect(apiClient.post).toHaveBeenCalledWith(
      expect.stringMatching(/\/estequiometria\/balanceamento$/),
      { equacao: 'H2 + O2 -> H2O' },
      expect.any(Object)
    );
    expect(out).toEqual(fullData);
  });

  test('calcularTermoquimica returns full unwrapped data payload and translates error', async () => {
    const fullData = {
      resultado: '8360 J (8.36 kJ)',
      valorJ: 8360,
      valorKJ: 8.36,
    };
    apiClient.post.mockResolvedValueOnce({ status: 200, data: { success: true, data: fullData } });
    const out = await new ChemistryApiRepository().calcularTermoquimica({
      action: 'calor-sensivel',
      data: { massa: 200, calorEspecifico: 4.18, temperaturaInicial: 20, temperaturaFinal: 30 },
    });
    expect(apiClient.post).toHaveBeenCalledWith(
      expect.stringMatching(/\/termoquimica\/calor-sensivel$/),
      expect.any(Object),
      expect.any(Object)
    );
    expect(out).toEqual(fullData);

    apiClient.post.mockRejectedValueOnce({
      response: { status: 400, data: { error: { message: 'massa inválida' } } },
    });
    await expect(
      new ChemistryApiRepository().calcularTermoquimica({ action: 'calor-sensivel', data: {} })
    ).rejects.toThrow('massa inválida');
  });
});
