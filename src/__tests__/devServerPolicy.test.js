const { localRequestOnly, adaptDevServer } = require('../../scripts/dev-server-config.cjs');

test.each([
  { host: 'evil.example:3000' },
  { host: 'localhost:3000', origin: 'http://evil.example' },
  { host: 'localhost:3000', origin: 'http://198.51.100.1' },
  { host: 'localhost:3000', 'sec-fetch-site': 'cross-site' },
])('rejects foreign development requests: %j', headers => {
  const next = jest.fn(); const res = { end: jest.fn() };
  localRequestOnly({ headers }, res, next);
  expect(res.statusCode).toBe(403); expect(next).not.toHaveBeenCalled();
});
test('permits local navigation and same-origin asset requests', () => {
  for (const headers of [{ host: '127.0.0.1:3000' }, { host: 'localhost:3000', origin: 'http://localhost:3000' }]) {
    const next = jest.fn(); localRequestOnly({ headers }, { end: jest.fn() }, next); expect(next).toHaveBeenCalledTimes(1);
  }
});
test('retains middleware order and replaces unsupported legacy options', () => {
  const before = jest.fn();
  const config = adaptDevServer({ https: false, allowedHosts: 'all', headers: { 'Access-Control-Allow-Origin': '*', 'X-Test': 'ok' }, devMiddleware: { publicPath: '/app' }, onBeforeSetupMiddleware: before, onAfterSetupMiddleware: jest.fn() });
  expect(config).not.toHaveProperty('https'); expect(config).not.toHaveProperty('onAfterSetupMiddleware');
  expect(config.allowedHosts).toEqual(['localhost','127.0.0.1']); expect(config.headers).toEqual({ 'X-Test': 'ok' });
  expect(config.devMiddleware.publicPath).toBe('/app/');
  const original = { name: 'existing' }; const server = {};
  const middlewares = config.setupMiddlewares([original], server);
  expect(before).toHaveBeenCalledWith(server); expect(middlewares[1]).toBe(original);
  expect(middlewares.map(item => item.name)).toEqual(['ceos-local-origin','existing','ceos-public-path','ceos-service-worker-reset']);
});
