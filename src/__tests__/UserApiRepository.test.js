import UserApiRepository from '../infrastructure/api/UserApiRepository';
import apiClient from '../infrastructure/api/apiClient';

jest.mock('../infrastructure/api/apiClient', () => ({
  __esModule: true,
  default: { post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
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

  test('updates only the profile fields confirmed by LoginAPI', async () => {
    const repo = new UserApiRepository();
    apiClient.patch.mockResolvedValue({ data: { data: { id: 'u1', nome: 'Ana', telefone: '11999999999' } } });

    await expect(repo.updateProfile('u1', { nome: 'Ana', telefone: '11999999999' })).resolves.toMatchObject({ id: 'u1' });
    expect(apiClient.patch).toHaveBeenCalledWith(expect.stringMatching(/\/users\/u1$/), {
      nome: 'Ana', telefone: '11999999999',
    });
  });

  test('sends password changes to the dedicated authenticated endpoint', async () => {
    const repo = new UserApiRepository();
    apiClient.post.mockResolvedValue({ data: { success: true, data: null } });

    await repo.changePassword({ senhaAtual: 'Senha123!', novaSenha: 'OutraSenha1!', confirmaNovaSenha: 'OutraSenha1!' });
    expect(apiClient.post).toHaveBeenCalledWith(expect.stringMatching(/\/auth\/change-password$/), expect.objectContaining({ senhaAtual: 'Senha123!' }));
  });
});
