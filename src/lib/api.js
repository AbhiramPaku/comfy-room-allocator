const rawApiBase = (import.meta.env.VITE_API_BASE_URL || '').trim();
const normalizedApiBase = rawApiBase.endsWith('/') ? rawApiBase.slice(0, -1) : rawApiBase;

export const buildApiUrl = (path) => {
  if (!path.startsWith('/')) {
    throw new Error('API path must start with "/"');
  }

  if (!normalizedApiBase) {
    return path;
  }

  return `${normalizedApiBase}${path}`;
};

export const apiFetch = (path, init) => fetch(buildApiUrl(path), init);
