process.env.NODE_ENV = 'development';
require('react-scripts/config/env');
process.env.HOST ||= '127.0.0.1';
if (!['localhost', '127.0.0.1'].includes(process.env.HOST)) {
  console.error('O servidor de desenvolvimento deve usar HOST=localhost ou 127.0.0.1.');
  process.exit(1);
}
require('../src/config/resolveApiConfig').resolveApiConfig(process.env);
const configPath = require.resolve('react-scripts/config/webpackDevServer.config');
const factory = require(configPath);
const { adaptDevServer } = require('./dev-server-config.cjs');
require.cache[configPath].exports = (...args) => adaptDevServer(factory(...args));
require('react-scripts/scripts/start');
