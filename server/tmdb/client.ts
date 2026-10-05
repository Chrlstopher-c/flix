/** Accès TMDB avec cache SQLite : chaque réponse n'est demandée qu'une fois par période. */
import { db } from '../core/db';
import { ENV } from '../core/env';
import { log } from '../core/logger';

const BASE = 'https://api.themoviedb.org/3';
const HOUR = 3_600_000;

export const TTL = { search: HOUR, trending: 6 * HOUR, details: 72 * HOUR, person: 168 * HOUR };

type CacheRow = { body: string; fetched_at: number };

export async function tmdb(path: string, params: Record<string, string>, ttl: number): Promise<unknown> {
  const query = new URLSearchParams({ language: 'fr-FR', ...params });
  const key = `${path}?${query}`;
  const select = db.query('SELECT body, fetched_at FROM tmdb_cache WHERE key = ?');
  const cached = select.get(key) as CacheRow | null; // colonnes du SELECT
  if (cached && Date.now() - cached.fetched_at < ttl) return JSON.parse(cached.body);
  query.set('api_key', ENV.tmdbKey);
  try {
    const res = await fetch(`${BASE}${path}?${query}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`TMDB ${res.status} sur ${path}`);
    const body = await res.text();
    db.query('INSERT OR REPLACE INTO tmdb_cache (key, body, fetched_at) VALUES (?, ?, ?)').run(key, body, Date.now());
    return JSON.parse(body);
  } catch (err) {
    log.error({ err, path }, 'Appel TMDB échoué');
    if (cached) return JSON.parse(cached.body);
    throw err;
  }
}

export function pruneCache(): void {
  const cutoff = Date.now() - 30 * 24 * HOUR;
  const { changes } = db.query('DELETE FROM tmdb_cache WHERE fetched_at < ?').run(cutoff);
  if (changes) log.info({ changes }, 'Cache TMDB purgé');
}
