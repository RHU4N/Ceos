export function getApiError(response, fallback) {
  const error = response?.data?.error;
  if (typeof error === 'string') return error;
  return error?.message || response?.data?.message || fallback;
}

/**
 * Extracts the complete calculation payload (`data` envelope or raw body)
 * returned by MathAPI without stripping structured fields.
 */
export function unwrapMathData(response, fallback) {
  if (!response || response.status >= 400) {
    throw new Error(getApiError(response, fallback));
  }

  const body = response.data;
  return body?.success === true && Object.prototype.hasOwnProperty.call(body, 'data')
    ? body.data
    : body;
}

// MathAPI returns success envelopes. Keep the calculation value's native type:
// zero, arrays and composed objects are all valid results.
export function unwrapMathResult(response, fallback) {
  const data = unwrapMathData(response, fallback);

  if (data && typeof data === 'object' && !Array.isArray(data)
    && Object.prototype.hasOwnProperty.call(data, 'resultado')) {
    return data.resultado;
  }
  return data;
}
