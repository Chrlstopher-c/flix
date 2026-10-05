/** Filtrage et tri de la bibliothèque, sans dépendance à l'interface. */
import type { Kind, LibraryTitle, Status } from '../shared/types';

/** Tout le monde, moi, une personne précise (« u:<id> »), ou les titres suivis par plusieurs personnes. */
export type Who = 'all' | 'me' | 'both' | `u:${number}`;
export type Sort = 'recent' | 'name' | 'year' | 'rating';

export type Filters = {
  kind: 'all' | Kind;
  who: Who;
  status: Status | 'all';
  tag: number | null;
  lang: string | null;
  sort: Sort;
};

export const DEFAULT_FILTERS: Filters = {
  kind: 'all',
  who: 'all',
  status: 'all',
  tag: null,
  lang: null,
  sort: 'recent',
};

/** Personne visée par le filtre (moi ou « u:<id> »), ou null pour plusieurs personnes. */
function personOf(who: Who, me: number): number | null {
  if (who === 'me') return me;
  return who.startsWith('u:') ? Number(who.slice(2)) : null;
}

function matchWho(t: LibraryTitle, who: Who, me: number): boolean {
  const person = personOf(who, me);
  if (person !== null) return t.entries.some((e) => e.userId === person);
  return who === 'both' ? t.entries.length > 1 : true;
}

function matchStatus(t: LibraryTitle, f: Filters, me: number): boolean {
  if (f.status === 'all') return true;
  const person = personOf(f.who, me);
  const scope = person === null ? t.entries : t.entries.filter((e) => e.userId === person);
  return scope.some((e) => e.status === f.status);
}

/** Langues d'un titre : originale, parlées, et celles dans lesquelles l'un de nous l'a vu. */
export function titleLanguages(t: LibraryTitle): string[] {
  const viewed = t.entries.flatMap((e) => e.languages.map((l) => l.split(':')[1] ?? ''));
  return [...new Set([t.language ?? '', ...t.spokenLanguages, ...viewed].filter(Boolean))];
}

function bestRating(t: LibraryTitle): number {
  return Math.max(-1, ...t.entries.map((e) => e.rating ?? -1));
}

export function applyFilters(titles: LibraryTitle[], f: Filters, me: number): LibraryTitle[] {
  const out = titles.filter(
    (t) =>
      (f.kind === 'all' || t.kind === f.kind) &&
      matchWho(t, f.who, me) &&
      matchStatus(t, f, me) &&
      (f.tag === null || t.tags.some((g) => g.id === f.tag)) &&
      (f.lang === null || titleLanguages(t).includes(f.lang)),
  );
  if (f.sort === 'name') out.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  if (f.sort === 'year') out.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  if (f.sort === 'rating') out.sort((a, b) => bestRating(b) - bestRating(a));
  return out;
}
