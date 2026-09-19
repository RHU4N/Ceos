import UserApiRepository from '../infrastructure/api/UserApiRepository';
import apiClient from '../infrastructure/api/apiClient';

jest.mock('../infrastructure/api/apiClient', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

describe('UserApiRepository (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('login returns the authenticated user from the API response', async () => {
    const repo = new UserApiRepository();
    apiClient.post.mockResolvedValue({ status: 200, data: { data: { user: { email: 'a@b', nome: 'A' } } } });

    const out = await repo.login({ email: 'a@b', senha: 'pw' });
    expect(apiClient.post).toHaveBeenCalled();
    expect(out).toHaveProperty('user');
    expect(out.user.email).toBe('a@b');
  });
});
