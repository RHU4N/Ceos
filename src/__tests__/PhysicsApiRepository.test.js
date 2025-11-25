// Set API base before module import so URL building uses this value
// Force deterministic URL for tests regardless of external env
process.env.REACT_APP_MATH_API_URL = 'http://api';

jest.mock('../infrastructure/api/apiClient', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

// We'll require the repository and the mocked apiClient after resetting modules
// so the module-level `apiUrl` constant is evaluated with the test-controlled env var.
let PhysicsApiRepository;
let apiClient;

describe('PhysicsApiRepository (unit)', () => {
  beforeEach(() => {
    jest.resetModules();
    // Re-require the mocked apiClient and repository after reset
    const mocked = require('../infrastructure/api/apiClient');
    apiClient = mocked && mocked.default ? mocked.default : mocked;
    jest.clearAllMocks();
    PhysicsApiRepository = require('../infrastructure/api/PhysicsApiRepository').default;
  });

  test('calcularCinetica maps special action to nested route and returns resultado', async () => {
    const repo = new PhysicsApiRepository();
    apiClient.post.mockResolvedValue({ status: 200, data: { resultado: 10 } });
    const out = await repo.calcularCinetica({ action: 'mruv-posicao', data: { s0: 0 } });
    expect(apiClient.post).toHaveBeenCalled();
    // first arg is URL
    expect(apiClient.post.mock.calls[0][0]).toBe('http://api/cinetica/mruv/posicao');
    expect(out).toBe(10);
  });

  test('calcularDinamica calls correct area route and returns primitive data', async () => {
    const repo = new PhysicsApiRepository();
    apiClient.post.mockResolvedValue({ status: 200, data: 3.5 });
    const out = await repo.calcularDinamica({ action: 'forca-resultante', data: { } });
    expect(apiClient.post).toHaveBeenCalled();
    expect(apiClient.post.mock.calls[0][0]).toBe('http://api/dinamica/forca-resultante');
    expect(out).toBe(3.5);
  });

  test('calcularEnergia throws when backend returns error status', async () => {
    const repo = new PhysicsApiRepository();
    apiClient.post.mockResolvedValue({ status: 500, data: { error: 'boom' } });
    await expect(repo.calcularEnergia({ action: 'trabalho', data: {} })).rejects.toThrow();
  });
});
