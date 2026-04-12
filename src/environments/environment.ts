const runtimeEnv = (globalThis as { __env?: { API_URL?: string } }).__env;
const runtimeApiUrl = runtimeEnv?.API_URL?.trim();

export const environment = {
  production: false,
  apiUrl: runtimeApiUrl || 'http://localhost:3000/api',
};
