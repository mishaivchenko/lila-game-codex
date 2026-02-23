const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const configuredApiBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL ?? '');

const resolveRuntimeApiBaseUrl = (): string => {
  if (!configuredApiBaseUrl) {
    return '';
  }

  // When the app is opened via Telegram/Web tunnel, hardcoded localhost API URLs
  // are unreachable from the remote WebView. In that case, rely on same-origin /api.
  if (
    typeof window !== 'undefined' &&
    /localhost|127\.0\.0\.1/.test(configuredApiBaseUrl) &&
    !/localhost|127\.0\.0\.1/.test(window.location.hostname)
  ) {
    return '';
  }

  return configuredApiBaseUrl;
};

export const resolveApiUrl = (path: string): string => {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const runtimeApiBaseUrl = resolveRuntimeApiBaseUrl();

  if (!runtimeApiBaseUrl) {
    return path;
  }

  if (path.startsWith('/')) {
    return `${runtimeApiBaseUrl}${path}`;
  }

  return `${runtimeApiBaseUrl}/${path}`;
};

export const apiFetch = async (
  path: string,
  init: RequestInit = {},
  authToken?: string,
): Promise<Response> => {
  const headers = new Headers(init.headers ?? {});
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  return fetch(resolveApiUrl(path), {
    ...init,
    headers,
  });
};
