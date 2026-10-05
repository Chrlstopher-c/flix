/** Fiche TMDB complète d'un titre ; une seule forme de requête pour partager le cache entre pages et goûts. */
import { TTL, tmdb } from './client';
import type { MediaType } from './kind';

const COMMON = 'credits,translations,keywords,recommendations,videos,watch/providers';

export function fullDetails(mediaType: MediaType, tmdbId: number): Promise<unknown> {
  const append = COMMON + (mediaType === 'tv' ? ',aggregate_credits' : ',release_dates');
  return tmdb(`/${mediaType}/${tmdbId}`, { append_to_response: append }, TTL.details);
}
