/** Premier lancement : des titres très connus à noter vite, pour amorcer le profil. */
import { mapLimit } from '../core/concurrency';
import { log } from '../core/logger';
import { cards, type Raw } from '../tmdb/cards';
import { TTL, tmdb } from '../tmdb/client';
import type { MediaType } from '../tmdb/kind';

const SOURCES: [MediaType, Record<string, string>][] = [
  ['movie', { sort_by: 'vote_count.desc', page: '1' }],
  ['movie', { sort_by: 'vote_count.desc', page: '2' }],
  ['tv', { sort_by: 'vote_count.desc', without_genres: '16', page: '1' }],
  ['tv', { sort_by: 'vote_count.desc', with_genres: '16', with_original_language: 'ja', page: '1' }],
  ['movie', { sort_by: 'popularity.desc', 'vote_count.gte': '2000', page: '1' }],
];

/** Mélange les sources une à une pour alterner films, séries et animés. */
function interleave(lists: Raw[][]): Raw[] {
  const out: Raw[] = [];
  for (let i = 0; lists.some((l) => i < l.length); i++) for (const l of lists) if (l[i]) out.push(l[i] as Raw);
  return out;
}

export async function onboardingCards(exclude: Set<string>): Promise<Raw[]> {
  const lists = await mapLimit(SOURCES, 3, async ([type, params]) => {
    try {
      return cards(await tmdb(`/discover/${type}`, params, TTL.person), type);
    } catch (err) {
      log.warn({ err, type }, 'Sélection de démarrage indisponible');
      return [];
    }
  });
  const seen = new Set<string>();
  return interleave(lists).filter((c) => {
    const id = String(c.id);
    if (exclude.has(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
