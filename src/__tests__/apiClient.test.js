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
});
