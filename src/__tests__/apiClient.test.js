const mockClient = jest.fn();
mockClient.post = jest.fn();
mockClient.interceptors = { response: { use: jest.fn() } };

jest.mock('axios', () => ({ create: jest.fn(() => mockClient) }));

let rejected;
require('../infrastructure/api/apiClient').default;
rejected = mockClient.interceptors.response.use.mock.calls[0][1];

const unauthorized = (url) => ({
  config: { url },
  response: { status: 401, data: { error: { message: 'Não autorizado' } } },
});

describe('apiClient session refresh', () => {
  beforeEach(() => {
    mockClient.mockClear();
    mockClient.post.mockReset();
    localStorage.clear();
  });

  test('does not refresh after an invalid login', async () => {
    localStorage.setItem('ceos_user', 'stale');
    await expect(rejected(unauthorized('/auth/login'))).rejects.toMatchObject({ response: { status: 401 } });
    expect(mockClient.post).not.toHaveBeenCalled();
    expect(localStorage.getItem('ceos_user')).toBeNull();
  });

  test('refreshes an expired access token and retries the original request', async () => {
    mockClient.post.mockResolvedValue({ status: 200 });
    mockClient.mockResolvedValue({ status: 200, data: { data: {} } });

    await expect(rejected(unauthorized('/auth/me'))).resolves.toMatchObject({ status: 200 });
    expect(mockClient.post).toHaveBeenCalledWith(expect.stringMatching(/\/auth\/refresh$/));
    expect(mockClient).toHaveBeenCalledWith(expect.objectContaining({ url: '/auth/me', _ceosRetried: true }));
  });

  test('clears the local session when refresh is invalid or expired', async () => {
    localStorage.setItem('ceos_user', 'user');
    mockClient.post.mockRejectedValue(unauthorized('/auth/refresh'));

    await expect(rejected(unauthorized('/auth/me'))).rejects.toMatchObject({ response: { status: 401 } });
    expect(localStorage.getItem('ceos_user')).toBeNull();
  });

  test('shares one refresh for simultaneous expired requests', async () => {
    let resolveRefresh;
    mockClient.post.mockReturnValue(new Promise((resolve) => { resolveRefresh = resolve; }));
    mockClient.mockResolvedValue({ status: 200 });

    const first = rejected(unauthorized('/auth/me'));
    const second = rejected(unauthorized('/historicos'));
    expect(mockClient.post).toHaveBeenCalledTimes(1);
    resolveRefresh({ status: 200 });
    await Promise.all([first, second]);
    expect(mockClient).toHaveBeenCalledTimes(2);
  });

  test('does not refresh after logout and clears local state on its 401', async () => {
    localStorage.setItem('ceos_user', 'user');
    await expect(rejected(unauthorized('/auth/logout'))).rejects.toMatchObject({ response: { status: 401 } });
    expect(mockClient.post).not.toHaveBeenCalled();
    expect(localStorage.getItem('ceos_user')).toBeNull();
  });

  test('preserves the local session during a temporary refresh outage', async () => {
    localStorage.setItem('ceos_user', 'current-user');
    mockClient.post.mockRejectedValue({ response: { status: 503 } });
    await expect(rejected(unauthorized('/iot/devices'))).rejects.toMatchObject({ response: { status: 503 } });
    expect(localStorage.getItem('ceos_user')).toBe('current-user');
    expect(mockClient).not.toHaveBeenCalled();
  });

  test('does not call refresh on anonymous /auth/me 401 NO_TOKEN without stored session', async () => {
    await expect(
      rejected({
        config: { url: '/auth/me' },
        response: { status: 401, data: { error: { code: 'NO_TOKEN', message: 'Token não fornecido' } } },
      })
    ).rejects.toMatchObject({ response: { status: 401 } });
    expect(mockClient.post).not.toHaveBeenCalled();
  });

  test('refreshes on /auth/me 401 NO_TOKEN when a stored session hint exists', async () => {
    localStorage.setItem('ceos_user', JSON.stringify({ id: 'u1' }));
    mockClient.post.mockResolvedValue({ status: 200 });
    mockClient.mockResolvedValue({ status: 200, data: { data: { id: 'u1' } } });

    await expect(
      rejected({
        config: { url: '/auth/me' },
        response: { status: 401, data: { error: { code: 'NO_TOKEN', message: 'Token não fornecido' } } },
      })
    ).resolves.toMatchObject({ status: 200 });
    expect(mockClient.post).toHaveBeenCalledWith(expect.stringMatching(/\/auth\/refresh$/));
    expect(mockClient).toHaveBeenCalledWith(expect.objectContaining({ url: '/auth/me', _ceosRetried: true }));
  });

  test('refreshes on /auth/me 401 TOKEN_EXPIRED even without stored session hint', async () => {
    mockClient.post.mockResolvedValue({ status: 200 });
    mockClient.mockResolvedValue({ status: 200, data: { data: { id: 'u1' } } });

    await expect(
      rejected({
        config: { url: '/auth/me' },
        response: { status: 401, data: { error: { code: 'TOKEN_EXPIRED', message: 'Token expirado' } } },
      })
    ).resolves.toMatchObject({ status: 200 });
    expect(mockClient.post).toHaveBeenCalledWith(expect.stringMatching(/\/auth\/refresh$/));
  });

  test('clears stored session hint when refresh fails with 400 MISSING_REFRESH_TOKEN', async () => {
    localStorage.setItem('ceos_user', 'stale-user');
    mockClient.post.mockRejectedValue({
      response: { status: 400, data: { error: { code: 'MISSING_REFRESH_TOKEN', message: 'Refresh token é obrigatório' } } },
    });

    await expect(
      rejected({
        config: { url: '/auth/me' },
        response: { status: 401, data: { error: { code: 'NO_TOKEN', message: 'Token não fornecido' } } },
      })
    ).rejects.toMatchObject({ response: { status: 400 } });
    expect(localStorage.getItem('ceos_user')).toBeNull();
  });
});
