/** Ce que fait chacun : reprise, activité de l'autre, semaine, goût du moment. Lecture seule, sans TMDB. */
import type { CheckpointRow, EpisodeEvent } from '../progress/progress';

export type Entry = { userId: number; status: string; rating: number | null; languages: string[]; updatedAt: number };
export type Title = {
  id: string;
  mediaType: string;
  tmdbId: number;
  name: string;
  poster: string | null;
  backdrop: string | null;
  genres: { id: number; name: string }[];
  entries: Entry[];
};
export type Activity = { titleId: string; userId: number; label: string; at: number };

const WEEK = 7 * 86_400_000;

export function resumeOf(
  me: number,
  titles: Title[],
  cps: CheckpointRow[],
): { title: Title; cp: CheckpointRow | null } | null {
  const mine = titles.filter((t) => t.entries.some((e) => e.userId === me && e.status === 'en_cours'));
  if (!mine.length) return null;
  const lastTouch = (t: Title): number =>
    Math.max(
      cps.find((c) => c.userId === me && c.titleId === t.id)?.at ?? 0,
      t.entries.find((e) => e.userId === me)?.updatedAt ?? 0,
    );
  const title = [...mine].sort((a, b) => lastTouch(b) - lastTouch(a))[0] as Title; // mine non vide
  return { title, cp: cps.find((c) => c.userId === me && c.titleId === title.id) ?? null };
}

/** Dernière chose faite par quelqu'un : épisode coché, point d'arrêt ou changement de statut. */
export function latestActivity(
  user: number,
  titles: Title[],
  eps: EpisodeEvent[],
  cps: CheckpointRow[],
): Activity | null {
  const STATUS: Record<string, string> = {
    vu: 'Terminé',
    en_cours: 'Commencé',
    a_voir: 'Ajouté à sa liste',
    abandonne: 'Abandonné',
  };
  const events: Activity[] = [
    ...eps
      .filter((e) => e.userId === user)
      .slice(0, 1)
      .map((e) => ({ titleId: e.titleId, userId: user, label: `S${e.season} É${e.episode}`, at: e.at })),
    ...cps
      .filter((c) => c.userId === user && c.episode !== null)
      .slice(0, 1)
      .map((c) => ({ titleId: c.titleId, userId: user, label: `S${c.season} É${c.episode}`, at: c.at })),
    ...titles.flatMap((t) =>
      t.entries
        .filter((e) => e.userId === user)
        .map((e) => ({ titleId: t.id, userId: user, label: STATUS[e.status] ?? e.status, at: e.updatedAt })),
    ),
  ];
  return events.sort((a, b) => b.at - a.at)[0] ?? null;
}

export function weekStats(
  me: number,
  titles: Title[],
  eps: EpisodeEvent[],
  now: number,
): { episodes: number; films: number } {
  const since = now - WEEK;
  const films = titles.filter(
    (t) =>
      t.mediaType === 'movie' && t.entries.some((e) => e.userId === me && e.status === 'vu' && e.updatedAt > since),
  ).length;
  return { episodes: eps.filter((e) => e.userId === me && e.at > since).length, films };
}

/** Genres dominants de ce que j'ai aimé ou regarde, et ma version la plus fréquente. */
export function tasteOf(me: number, titles: Title[]): { genres: string[]; version: string | null } {
  const counts = new Map<string, number>();
  const versions = new Map<string, number>();
  for (const t of titles) {
    const e = t.entries.find((x) => x.userId === me);
    if (!e || e.status === 'abandonne' || e.status === 'a_voir' || (e.rating !== null && e.rating < 6)) continue;
    const w = e.rating !== null ? e.rating / 5 : 1;
    for (const g of t.genres) counts.set(g.name, (counts.get(g.name) ?? 0) + w);
    for (const v of e.languages) versions.set(v, (versions.get(v) ?? 0) + 1);
  }
  const top = (m: Map<string, number>): string[] => [...m].sort((a, b) => b[1] - a[1]).map(([k]) => k);
  return { genres: top(counts).slice(0, 3), version: top(versions)[0] ?? null };
}
