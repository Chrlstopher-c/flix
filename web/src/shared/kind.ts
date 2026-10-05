/** Conversion d'un résultat TMDB brut en vignette ; même règle film/série/animé que le serveur. */
import { classify } from '../../../common/kind';
import type { Card, MediaType } from './types';

export function toKind(r: Record<string, unknown>, fallback: MediaType): Card | null {
  const mediaType = (r.media_type as MediaType | undefined) ?? fallback; // champ TMDB textuel
  if (mediaType !== 'movie' && mediaType !== 'tv') return null;
  const date = String(r.release_date ?? r.first_air_date ?? '');
  const lang = typeof r.original_language === 'string' ? r.original_language : null;
  return {
    id: `${mediaType}:${String(r.id)}`,
    mediaType,
    tmdbId: Number(r.id),
    kind: classify(mediaType, Array.isArray(r.genre_ids) ? r.genre_ids.map(Number) : [], lang),
    name: String(r.title ?? r.name ?? ''),
    poster: (r.poster_path as string | null) ?? null, // chemin TMDB ou null
    backdrop: (r.backdrop_path as string | null) ?? null,
    year: date ? Number(date.slice(0, 4)) : null, // idem
    vote: typeof r.vote_average === 'number' ? r.vote_average : null,
    language: lang,
    overview: String(r.overview ?? ''),
  };
}
