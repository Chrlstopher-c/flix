/** Routes catalogue : recherche, tendances, fiches, saisons, personnes. */
import { fail, json } from '../core/http';
import { log } from '../core/logger';
import { classify, type MediaType } from './kind';
import { TTL, tmdb } from './client';

type Raw = Record<string, unknown>;

function isMedia(v: string | undefined): v is MediaType {
  return v === 'movie' || v === 'tv';
}

/** Carte légère commune à toutes les listes. */
export function toCard(r: Raw, fallbackType?: MediaType): Raw | null {
  const mediaType = (r.media_type as string | undefined) ?? fallbackType; // champ TMDB textuel
  if (!isMedia(mediaType)) return null;
  const date = (r.release_date ?? r.first_air_date ?? '') as string; // dates TMDB = chaînes ISO
  const genreIds = (r.genre_ids as number[] | undefined) ?? []; // tableau d'identifiants TMDB
  const lang = (r.original_language as string | undefined) ?? null;
  return {
    id: `${mediaType}:${r.id}`,
    mediaType,
    tmdbId: r.id,
    kind: classify(mediaType, genreIds, lang),
    name: r.title ?? r.name,
    poster: r.poster_path ?? null,
    backdrop: r.backdrop_path ?? null,
    year: date ? Number(date.slice(0, 4)) : null,
    vote: r.vote_average ?? null,
    language: lang,
    overview: r.overview ?? '',
  };
}

function cards(data: unknown, type?: MediaType): Raw[] {
  const results = ((data as Raw).results as Raw[] | undefined) ?? []; // forme paginée TMDB
  return results.map((r) => toCard(r, type)).filter((c): c is Raw => c !== null);
}

const DISCOVER: Record<string, [MediaType, Record<string, string>]> = {
  film: ['movie', { sort_by: 'popularity.desc' }],
  serie: ['tv', { sort_by: 'popularity.desc', without_genres: '16' }],
  anime: ['tv', { sort_by: 'popularity.desc', with_genres: '16', with_original_language: 'ja' }],
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
  if (section === 'title' && isMedia(a) && b) {
    const append =
      'credits,translations,keywords,recommendations,videos,watch/providers' +
      (a === 'tv' ? ',aggregate_credits' : ',release_dates');
    return json(await tmdb(`/${a}/${b}`, { append_to_response: append }, TTL.details));
  }
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
