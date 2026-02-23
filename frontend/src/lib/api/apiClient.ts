const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const API_BASE_URL = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL ?? '');

export const resolveApiUrl = (path: string): string => {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  if (!API_BASE_URL) {
    return path;
  }

  if (path.startsWith('/')) {
    return `${API_BASE_URL}${path}`;
  }

  return `${API_BASE_URL}/${path}`;
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
