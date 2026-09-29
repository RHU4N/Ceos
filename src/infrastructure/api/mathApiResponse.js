export function getApiError(response, fallback) {
  const error = response?.data?.error;
  if (typeof error === 'string') return error;
  return error?.message || response?.data?.message || fallback;
}

// MathAPI returns success envelopes. Keep the calculation value's native type:
// zero, arrays and composed objects are all valid results.
export function unwrapMathResult(response, fallback) {
  if (!response || response.status >= 400) {
    throw new Error(getApiError(response, fallback));
  }

  const body = response.data;
  const data = body?.success === true && Object.prototype.hasOwnProperty.call(body, 'data')
    ? body.data
    : body;

  if (data && typeof data === 'object' && !Array.isArray(data)
    && Object.prototype.hasOwnProperty.call(data, 'resultado')) {
    return data.resultado;
  }
  return data;
}
