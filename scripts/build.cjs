const { spawnSync } = require('node:child_process');
process.env.NODE_ENV = 'production';
require('react-scripts/config/env');
try {
  require('../src/config/resolveApiConfig').resolveApiConfig(process.env);
  if (!process.env.REACT_APP_API_MATH_URL && process.env.REACT_APP_MATH_API_URL) {
    console.warn('REACT_APP_MATH_API_URL está obsoleta; use REACT_APP_API_MATH_URL.');
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
process.env.GENERATE_SOURCEMAP ??= 'false';
const result = spawnSync(process.execPath, [require.resolve('react-scripts/scripts/build')], { stdio: 'inherit', env: process.env });
process.exit(result.status ?? 1);
