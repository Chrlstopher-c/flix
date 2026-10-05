/** Candidats à recommander : titres proches de ceux qu'on a aimés, et populaires dans nos genres. */
import { mapLimit } from '../core/concurrency';
import { log } from '../core/logger';
import { cards, type Raw } from '../tmdb/cards';
import { TTL, tmdb } from '../tmdb/client';
import type { MediaType } from '../tmdb/kind';
import type { Profile } from './profile';
import { baseTraits, type Traits } from './traits';

export type Source = { id: string; name: string; weight: number; by?: string };
export type Candidate = {
  card: Raw;
  feats: string[];
  labels: Record<string, string>;
  support: number;
  sources: Source[];
};
/** `by` : seule personne du duo à avoir aimé ce titre (absent si les deux l'ont aimé). */
export type Liked = { traits: Traits; weight: number; by?: string };
export type Genres = Map<number, string>;

const MAX_SOURCES = 12;
const TOP_GENRES = 3;

export async function genreNames(): Promise<Genres> {
  const out: Genres = new Map();
  for (const type of ['movie', 'tv']) {
    try {
      const raw = await tmdb(`/genre/${type}/list`, {}, TTL.person);
      const data = raw as { genres?: { id: number; name: string }[] }; // forme TMDB
      for (const g of data.genres ?? []) out.set(g.id, g.name);
    } catch (err) {
      log.warn({ err, type }, 'Liste des genres indisponible');
    }
  }
  return out;
}

function addCard(pool: Map<string, Candidate>, card: Raw, genres: Genres, support: number, source?: Source): void {
  const id = String(card.id);
  let c = pool.get(id);
  if (!c) {
    const ids = (card.genreIds as number[] | undefined) ?? []; // posé par toCard
    const named = ids.map((g) => ({ id: g, name: genres.get(g) ?? '' })).filter((g) => g.name);
    const date = card.year ? `${String(card.year)}-01-01` : '';
    const [feats, labels] = baseTraits(
      card.mediaType as MediaType,
      named,
      (card.language as string | null) ?? null,
      date,
    ); // champs de toCard
    c = { card, feats, labels, support: 0, sources: [] };
    pool.set(id, c);
  }
  c.support += support;
  if (source && !c.sources.some((s) => s.id === source.id)) c.sources.push(source);
}

async function genreCards(profile: Profile): Promise<Raw[]> {
  const top = [...profile]
    .filter(([f, v]) => f.startsWith('g:') && v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_GENRES);
  const jobs = top.flatMap(([f]) => (['movie', 'tv'] as const).map((type) => ({ type, genre: f.slice(2) })));
  const pages = await mapLimit(jobs, 3, async ({ type, genre }) => {
    try {
      const params = { with_genres: genre, sort_by: 'popularity.desc', 'vote_count.gte': '150' };
      return cards(await tmdb(`/discover/${type}`, params, TTL.trending), type);
    } catch (err) {
      log.warn({ err, type, genre }, 'Découverte par genre indisponible');
      return [];
    }
  });
  return pages.flat();
}

export async function gather(liked: Liked[], profile: Profile, genres: Genres): Promise<Map<string, Candidate>> {
  const pool = new Map<string, Candidate>();
  const sources = liked
    .filter((l) => l.weight > 0.5)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, MAX_SOURCES);
  for (const l of sources) {
    const source = { id: l.traits.id, name: l.traits.name, weight: l.weight, by: l.by };
    for (const card of l.traits.recs) addCard(pool, card, genres, l.weight, source);
  }
  for (const card of await genreCards(profile)) addCard(pool, card, genres, 0.3);
  return pool;
}
