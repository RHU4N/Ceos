const { resolveApiConfig } = require('../config/resolveApiConfig');

const deployed = { NODE_ENV: 'production', VERCEL: '1', REACT_APP_API_LOGIN_URL: '/api/login', REACT_APP_API_MATH_URL: 'https://mathapi-ceos.azurewebsites.net' };

test('development and tests retain local defaults', () => {
  expect(resolveApiConfig({ NODE_ENV: 'test' })).toEqual({ loginApiUrl: 'http://localhost:8081', mathApiUrl: 'http://localhost:8080' });
});
test('production requires both destinations instead of silently using localhost', () => {
  expect(() => resolveApiConfig({ NODE_ENV: 'production' })).toThrow('REACT_APP_API_MATH_URL');
  expect(() => resolveApiConfig({ NODE_ENV: 'production', REACT_APP_API_MATH_URL: deployed.REACT_APP_API_MATH_URL })).toThrow('REACT_APP_API_LOGIN_URL');
});
test('canonical Math variable takes precedence while retaining legacy compatibility', () => {
  expect(resolveApiConfig({ ...deployed, REACT_APP_MATH_API_URL: 'https://legacy.example' }).mathApiUrl).toBe(deployed.REACT_APP_API_MATH_URL);
  expect(resolveApiConfig({ REACT_APP_MATH_API_URL: 'http://localhost:9090' }).mathApiUrl).toBe('http://localhost:9090');
});
test('Vercel uses HTTPS Math and the same-origin Login proxy', () => {
  expect(resolveApiConfig(deployed).loginApiUrl).toBe('/api/login');
  expect(() => resolveApiConfig({ ...deployed, REACT_APP_API_MATH_URL: 'http://localhost:8080' })).toThrow('REACT_APP_API_MATH_URL');
  expect(() => resolveApiConfig({ ...deployed, REACT_APP_API_LOGIN_URL: 'https://loginapi-ceos.azurewebsites.net' })).toThrow('/api/login');
});
test('explicit local Docker build destinations remain supported', () => {
  expect(resolveApiConfig({ NODE_ENV: 'production', REACT_APP_API_MATH_URL: 'http://localhost:8080', REACT_APP_API_LOGIN_URL: 'http://localhost:8081' }).loginApiUrl).toBe('http://localhost:8081');
});
test.each(['https://user:private-value@example.com', 'https://example.com?token=private-value', 'file:///private-value'])('rejects unsafe URLs without disclosing their values', value => {
  try { resolveApiConfig({ ...deployed, REACT_APP_API_MATH_URL: value }); throw new Error('accepted unsafe value'); }
  catch (error) { expect(error.message).toContain('REACT_APP_API_MATH_URL'); expect(error.message).not.toContain('private-value'); }
});
test('private variables cannot use the public CRA namespace', () => {
  expect(() => resolveApiConfig({ ...deployed, REACT_APP_JWT_SECRET: 'private-value' })).toThrow('REACT_APP_JWT_SECRET');
});
