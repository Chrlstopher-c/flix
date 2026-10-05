/** Client HTTP de l'API, avec un petit cache mémoire pour les lectures. */
const cache = new Map<string, unknown>();
const listeners = new Set<() => void>();

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as { error?: string }).error ?? `Erreur ${res.status}`; // corps d'erreur de l'API
    if (res.status === 401 && path !== '/api/me') window.dispatchEvent(new Event('ft:logout'));
    throw new ApiError(res.status, message);
  }
  return data as T; // forme garantie par la route appelée
}

export function get<T>(path: string): Promise<T> {
  return request<T>('GET', path).then((d) => {
    cache.set(path, d);
    return d;
  });
}

export function cached<T>(path: string): T | undefined {
  return cache.get(path) as T | undefined; // valeur posée par get<T> sur le même chemin
}

export async function send<T>(method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const data = await request<T>(method, path, body ?? {});
  invalidate((key) => key.startsWith('/api/library'));
  return data;
}

export function invalidate(match: (key: string) => boolean): void {
  for (const key of cache.keys()) if (match(key)) cache.delete(key);
  listeners.forEach((l) => l());
}

export function onInvalidate(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function img(path: string | null | undefined, size = 'w342'): string | undefined {
  return path ? `/img/${size}${path}` : undefined;
}
