/** Cartes légères (vignettes) construites à partir des résultats bruts TMDB. */
import { classify, type MediaType } from './kind';

export type Raw = Record<string, unknown>;

export function isMedia(v: string | undefined): v is MediaType {
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
    genreIds,
    overview: r.overview ?? '',
  };
}

export function cards(data: unknown, type?: MediaType): Raw[] {
  const results = ((data as Raw).results as Raw[] | undefined) ?? []; // forme paginée TMDB
  return results.map((r) => toCard(r, type)).filter((c): c is Raw => c !== null);
}
