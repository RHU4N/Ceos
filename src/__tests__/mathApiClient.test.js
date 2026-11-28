const mockClient = { interceptors: { response: { use: jest.fn() } } };
jest.mock('axios', () => ({ create: jest.fn(() => mockClient) }));

const { toMathApiError } = require('../infrastructure/api/mathApiClient');

const [onFulfilled, onRejected] = mockClient.interceptors.response.use.mock.calls[0];

describe('mathApiClient error messages', () => {
  test('registers a response interceptor that keeps successful responses untouched', () => {
    const response = { status: 200, data: { success: true, data: { resultado: 3 } } };
    expect(onFulfilled(response)).toBe(response);
  });

  test('uses the MathAPI validation message instead of the generic axios text', async () => {
    const axiosError = new Error('Request failed with status code 400');
    axiosError.response = {
      status: 400,
      data: { success: false, error: { code: 'VALIDATION_ERROR', message: 'O intervalo de tempo deve ser diferente de zero.', statusCode: 400 } },
    };
    await expect(onRejected(axiosError)).rejects.toMatchObject({
      message: 'O intervalo de tempo deve ser diferente de zero.',
      status: 400,
      response: axiosError.response,
    });
  });

  test('falls back to the original message when the body has no error text', () => {
    const axiosError = new Error('Request failed with status code 502');
    axiosError.response = { status: 502, data: '<html>Bad Gateway</html>' };
    expect(toMathApiError(axiosError).message).toBe('Request failed with status code 502');
  });

  test('keeps network errors (no response) as they are', () => {
    const networkError = new Error('Network Error');
    expect(toMathApiError(networkError)).toBe(networkError);
  });
});
