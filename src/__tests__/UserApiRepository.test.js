import UserApiRepository from '../infrastructure/api/UserApiRepository';
import apiClient from '../infrastructure/api/apiClient';

jest.mock('../infrastructure/api/apiClient', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
}));

describe('UserApiRepository (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('login stores token and returns user and token', async () => {
    const repo = new UserApiRepository();
    apiClient.post.mockResolvedValue({ status: 200, data: { token: 't-123' } });
    apiClient.get.mockResolvedValue({ status: 200, data: [{ email: 'a@b', name: 'A' }, { email: 'x@y', name: 'X' }] });

    const out = await repo.login({ email: 'a@b', senha: 'pw' });
    expect(apiClient.post).toHaveBeenCalled();
    expect(apiClient.get).toHaveBeenCalled();
    expect(localStorage.getItem('ceos_token')).toBe('t-123');
    expect(out).toHaveProperty('token', 't-123');
    expect(out).toHaveProperty('user');
    expect(out.user.email).toBe('a@b');
  });
});
