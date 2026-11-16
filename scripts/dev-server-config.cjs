const paths = require('react-scripts/config/paths');
const redirectServedPath = require('react-dev-utils/redirectServedPathMiddleware');
const noopServiceWorker = require('react-dev-utils/noopServiceWorkerMiddleware');

function localRequestOnly(req, res, next) {
  try {
    const host = new URL('http://' + req.headers.host);
    const origin = req.headers.origin ? new URL(req.headers.origin) : null;
    if (!['localhost', '127.0.0.1'].includes(host.hostname)
      || (origin && (!['http:', 'https:'].includes(origin.protocol) || origin.host !== host.host))
      || req.headers['sec-fetch-site'] === 'cross-site') throw new Error('Untrusted development request');
    next();
  } catch {
    res.statusCode = 403;
    res.end('Forbidden development origin');
  }
}

// CRA 5 uses removed WDS 4 callbacks. Keep its middleware ordering on patched WDS 5.
function adaptDevServer(config) {
  const { https, onBeforeSetupMiddleware, onAfterSetupMiddleware, ...supported } = config;
  supported.host = process.env.HOST || '127.0.0.1';
  supported.allowedHosts = ['localhost', '127.0.0.1'];
  supported.webSocketServer = {
    type: 'ws',
    options: {
      verifyClient(info, done) {
        localRequestOnly(info.req, { end: () => done(false, 403, 'Forbidden development origin') }, () => done(true));
      },
    },
  };
  supported.server = https ? { type: 'https', options: typeof https === 'object' ? https : {} } : 'http';
  supported.headers = Object.fromEntries(Object.entries(config.headers || {}).filter(([name]) => !/^access-control-allow-/i.test(name)));
  const publicPath = config.devMiddleware?.publicPath || '/';
  supported.devMiddleware = { ...config.devMiddleware, publicPath: publicPath.endsWith('/') ? publicPath : publicPath + '/' };
  supported.setupMiddlewares = (middlewares, server) => {
    onBeforeSetupMiddleware?.(server);
    return [
      { name: 'ceos-local-origin', middleware: localRequestOnly },
      ...middlewares,
      { name: 'ceos-public-path', middleware: redirectServedPath(paths.publicUrlOrPath) },
      { name: 'ceos-service-worker-reset', middleware: noopServiceWorker(paths.publicUrlOrPath) },
    ];
  };
  return supported;
}

module.exports = { adaptDevServer, localRequestOnly };
