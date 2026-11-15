// Shared by the browser and the build validator; error messages never include values.
function resolveApiConfig(env = {}) {
  const production = env.NODE_ENV === 'production';
  const hosted = env.VERCEL === '1';
  const forbidden = Object.keys(env).filter(name => /^REACT_APP_(JWT_SECRET|MONGO(?:DB)?_URI|DATABASE_URL|CEOS_SERVICE_KEY|SERVICE_KEY|ACCESS_TOKEN|REFRESH_TOKEN|PASSWORD|PRIVATE_KEY|CLIENT_SECRET)$/.test(name));
  if (forbidden.length) throw new Error(`Variáveis privadas não podem ser públicas: ${forbidden.join(', ')}.`);

  function resolve(name, configured, localDefault, relative = false) {
    const value = typeof configured === 'string' ? configured.trim() : '';
    if (!value) {
      if (production) throw new Error(`Configuração obrigatória ausente: ${name}.`);
      return localDefault;
    }
    if (relative && /^\/api\/login\/?$/.test(value)) return '/api/login';
    let url;
    try { url = new URL(value); } catch { throw new Error(`URL inválida em ${name}.`); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error(`URL inválida em ${name}; use uma URL pública HTTP(S) sem credenciais ou parâmetros.`);
    if (hosted && (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) throw new Error(`Destino inadequado para Vercel em ${name}.`);
    if (hosted && relative) throw new Error(`${name} deve usar o proxy /api/login na Vercel.`);
    return url.toString().replace(/\/+$/, '');
  }

  return {
    mathApiUrl: resolve('REACT_APP_API_MATH_URL', env.REACT_APP_API_MATH_URL || env.REACT_APP_MATH_API_URL, 'http://localhost:8080'),
    loginApiUrl: resolve('REACT_APP_API_LOGIN_URL', env.REACT_APP_API_LOGIN_URL, 'http://localhost:8081', true),
  };
}

module.exports = { resolveApiConfig };
