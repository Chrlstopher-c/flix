/** Règle métier unique, partagée par le serveur et le front : film, série ou animé. */
export type MediaType = 'movie' | 'tv';
export type Kind = 'film' | 'serie' | 'anime';

const ANIMATION = 16;
const ANIME_LANGS = new Set(['ja']);

export function classify(mediaType: MediaType, genreIds: number[], originalLanguage: string | null): Kind {
  if (genreIds.includes(ANIMATION) && originalLanguage && ANIME_LANGS.has(originalLanguage)) return 'anime';
  return mediaType === 'movie' ? 'film' : 'serie';
}
