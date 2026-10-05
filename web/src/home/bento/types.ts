/** Réponse de /api/dashboard : tout ce que montre la grille bento. */
import type { Rec } from '../../shared/types';

export type TitleRef = {
  name: string;
  poster: string | null;
  backdrop: string | null;
  mediaType: string;
  tmdbId: number;
};

export type Dashboard = {
  resume: {
    title: TitleRef & { id: string };
    cp: { season: number | null; episode: number | null; atSeconds: number | null } | null;
    total: number | null;
    watched: number;
  } | null;
  tonight: Rec | null;
  partnerId: number | null;
  week: { episodes: number; films: number };
  other: { titleId: string; userId: number; label: string; at: number } | null;
  taste: { genres: string[]; version: string | null };
  moment: {
    titleId: string;
    userId: number;
    body: string;
    season: number | null;
    episode: number | null;
    atSeconds: number | null;
    language: string | null;
    titleName: string;
  } | null;
  next: {
    titleId: string;
    name: string;
    poster: string | null;
    date: string;
    season: number;
    episode: number;
  } | null;
  titles: Record<string, TitleRef>;
};

export function titleLink(t: { mediaType: string; tmdbId: number }): string {
  return `/titre/${t.mediaType}/${t.tmdbId}`;
}

export function ago(at: number, now = Date.now()): string {
  const min = Math.round((now - at) / 60_000);
  if (min < 2) return 'à l’instant';
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'hier' : `il y a ${d} jours`;
}

export function dayLabel(iso: string, now = new Date()): string {
  const date = new Date(`${iso}T00:00:00`);
  const days = Math.round((date.getTime() - new Date(now.toDateString()).getTime()) / 86_400_000);
  if (days <= 0) return 'Auj.';
  if (days === 1) return 'Demain';
  if (days < 7) return date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace(/^./, (c) => c.toUpperCase());
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
