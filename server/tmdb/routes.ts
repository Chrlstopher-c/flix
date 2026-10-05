/** Routes catalogue : recherche, tendances, fiches, saisons, personnes. */
import { fail, json } from '../core/http';
import { log } from '../core/logger';
import { cards, isMedia, type Raw } from './cards';
import { TTL, tmdb } from './client';
import { fullDetails } from './details';
import type { MediaType } from './kind';

const DISCOVER: Record<string, [MediaType, Record<string, string>]> = {
  film: ['movie', { sort_by: 'popularity.desc', 'vote_count.gte': '80' }],
  serie: ['tv', { sort_by: 'popularity.desc', without_genres: '16', 'vote_count.gte': '40' }],
  anime: [
    'tv',
    { sort_by: 'popularity.desc', with_genres: '16', with_original_language: 'ja', 'vote_count.gte': '20' },
  ],
};

async function handle(url: URL, parts: string[]): Promise<Response | null> {
  const [, , section, a, b] = parts;
  if (section === 'search') {
    const q = url.searchParams.get('q')?.trim();
    if (!q) return json({ results: [] });
    const data = await tmdb('/search/multi', { query: q, include_adult: 'false' }, TTL.search);
    const people = (((data as Raw).results as Raw[]) ?? [])
      .filter((r) => r.media_type === 'person') // forme TMDB
      .map((p) => ({ id: p.id, name: p.name, profile: p.profile_path, dept: p.known_for_department }));
    return json({ results: cards(data), people });
  }
  if (section === 'trending') return json({ results: cards(await tmdb('/trending/all/week', {}, TTL.trending)) });
  if (section === 'discover' && a && DISCOVER[a]) {
    const [type, params] = DISCOVER[a];
    const page = url.searchParams.get('page') ?? '1';
    return json({ results: cards(await tmdb(`/discover/${type}`, { ...params, page }, TTL.trending), type) });
  }
  if (section === 'title' && isMedia(a) && b) return json(await fullDetails(a, Number(b)));
  if (section === 'season' && a && b) return json(await tmdb(`/tv/${a}/season/${b}`, {}, TTL.details));
  if (section === 'person' && a) {
    return json(await tmdb(`/person/${a}`, { append_to_response: 'combined_credits,images' }, TTL.person));
  }
  if (section === 'languages') return json(await tmdb('/configuration/languages', {}, TTL.person));
  return null;
}

export async function tmdbRoutes(url: URL, path: string): Promise<Response | null> {
  if (!path.startsWith('/api/tmdb/')) return null;
  try {
    return await handle(url, path.split('/').slice(1));
  } catch (err) {
    log.error({ err, path }, 'Route catalogue en erreur');
    return fail(503, 'Catalogue TMDB injoignable');
  }
}
