const runtimeEnv = (globalThis as { __env?: { API_URL?: string } }).__env;
const runtimeApiUrl = runtimeEnv?.API_URL?.trim();
const runtimeHost = globalThis.location?.hostname?.trim() || "localhost";
const fallbackApiUrl = `http://${runtimeHost}:3000/api`;

export const environment = {
	production: false,
	apiUrl: runtimeApiUrl || fallbackApiUrl,
};
