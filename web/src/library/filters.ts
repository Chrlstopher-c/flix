/** Filtrage et tri de la bibliothèque, sans dépendance à l'interface. */
import type { Kind, LibraryTitle, Status } from '../shared/types';

export type Who = 'all' | 'me' | 'other' | 'both';
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

function matchWho(t: LibraryTitle, who: Who, me: number): boolean {
  const ids = t.entries.map((e) => e.userId);
  if (who === 'me') return ids.includes(me);
  if (who === 'other') return ids.some((id) => id !== me);
  if (who === 'both') return ids.length > 1;
  return true;
}

function matchStatus(t: LibraryTitle, f: Filters, me: number): boolean {
  if (f.status === 'all') return true;
  const scope =
    f.who === 'other'
      ? t.entries.filter((e) => e.userId !== me)
      : f.who === 'me'
        ? t.entries.filter((e) => e.userId === me)
        : t.entries;
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
