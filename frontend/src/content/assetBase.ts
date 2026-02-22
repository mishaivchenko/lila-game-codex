const DEFAULT_REMOTE_ASSET_BASE = 'https://raw.githubusercontent.com/mishaivchenko/lila-game-codex/main';

const normalizeBase = (value: string): string => value.replace(/\/+$/, '');

export const getAssetBaseUrl = (): string => {
  const custom = import.meta.env.VITE_REMOTE_ASSET_BASE;
  const remoteBase = normalizeBase(custom || DEFAULT_REMOTE_ASSET_BASE);

  if (typeof window === 'undefined') {
    return '';
  }

  const hostname = window.location.hostname.toLowerCase();
  if (hostname.endsWith('.hf.space') || hostname.endsWith('.huggingface.co')) {
    return remoteBase;
  }

  return '';
};

export const resolveAssetUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = getAssetBaseUrl();
  if (!base) {
    return normalizedPath;
  }
  return `${base}${normalizedPath}`;
};
