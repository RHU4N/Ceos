import { resolveApiConfig } from './resolveApiConfig';

const config = resolveApiConfig({
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_MATH_URL: process.env.REACT_APP_API_MATH_URL,
  // Temporary compatibility for existing local environments; canonical name wins.
  REACT_APP_MATH_API_URL: process.env.REACT_APP_MATH_API_URL,
  REACT_APP_API_LOGIN_URL: process.env.REACT_APP_API_LOGIN_URL,
});

export const { mathApiUrl, loginApiUrl } = config;
