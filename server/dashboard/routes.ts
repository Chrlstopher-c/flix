/** Tableau de bord de l'accueil (grille bento) : tout ce qui concerne « moi et l'autre » en une requête. */
import type { User } from '../auth/users';
import { listUsers } from '../auth/users';
import { mapLimit } from '../core/concurrency';
import { json } from '../core/http';
import { log } from '../core/logger';
import { latestMoment } from '../library/notes';
import { listLibrary } from '../library/queries';
import { allCheckpoints, episodesSince } from '../progress/progress';
import type { TasteResult } from '../taste/engine';
import { readResult } from '../taste/store';
import { fullDetails } from '../tmdb/details';
import { latestActivity, resumeOf, tasteOf, weekStats, type Title } from './activity';

type Next = { titleId: string; name: string; poster: string | null; date: string; season: number; episode: number };
type TvDetails = {
  number_of_episodes?: number;
  next_episode_to_air?: { air_date?: string; season_number: number; episode_number: number } | null;
};

const MAX_NEXT_LOOKUPS = 12;

async function details(t: Title): Promise<TvDetails | null> {
  try {
    return (await fullDetails('tv', t.tmdbId)) as TvDetails; // fiche série TMDB
  } catch (err) {
    log.warn({ err, id: t.id }, 'Fiche indisponible pour le tableau de bord');
    return null;
  }
}

/** Prochain épisode à sortir parmi les séries que je suis encore. */
async function nextEpisode(me: number, titles: Title[]): Promise<Next | null> {
  const today = new Date().toISOString().slice(0, 10);
  const tv = titles
    .filter(
      (t) =>
        t.mediaType === 'tv' &&
        t.entries.some((e) => e.userId === me && (e.status === 'en_cours' || e.status === 'a_voir')),
    )
    .slice(0, MAX_NEXT_LOOKUPS);
  const found = await mapLimit(tv, 4, async (t): Promise<Next | null> => {
    const n = (await details(t))?.next_episode_to_air;
    if (!n?.air_date || n.air_date < today) return null;
    return {
      titleId: t.id,
      name: t.name,
      poster: t.poster,
      date: n.air_date,
      season: n.season_number,
      episode: n.episode_number,
    };
  });
  return found.filter((x): x is Next => x !== null).sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
}

export async function dashboard(user: User): Promise<Response> {
  const titles = listLibrary() as unknown as Title[]; // forme de listLibrary
  const cps = allCheckpoints();
  const allEps = episodesSince(0);
  const eps = allEps.filter((e) => e.at > Date.now() - 30 * 86_400_000);
  const other = listUsers().find((u) => u.id !== user.id) ?? null;
  const resume = resumeOf(user.id, titles, cps);
  const total = resume?.title.mediaType === 'tv' ? ((await details(resume.title))?.number_of_episodes ?? null) : null;
  const watched = resume ? allEps.filter((e) => e.userId === user.id && e.titleId === resume.title.id).length : 0;
  const moment = latestMoment();
  return json({
    resume: resume && { ...resume, total, watched },
    tonight: readResult<TasteResult>('duo')?.body.forYou[0] ?? null,
    week: weekStats(user.id, titles, eps, Date.now()),
    other: other && latestActivity(other.id, titles, eps, cps),
    taste: tasteOf(user.id, titles),
    moment: moment && { ...moment, titleName: titles.find((t) => t.id === moment.titleId)?.name ?? '' },
    next: await nextEpisode(user.id, titles),
    titles: Object.fromEntries(
      titles.map((t) => [
        t.id,
        { name: t.name, poster: t.poster, backdrop: t.backdrop, mediaType: t.mediaType, tmdbId: t.tmdbId },
      ]),
    ),
  });
}

export async function dashboardRoutes(path: string, user: User): Promise<Response | null> {
  if (path !== '/api/dashboard') return null;
  try {
    return await dashboard(user);
  } catch (err) {
    log.error({ err }, 'Tableau de bord en erreur');
    return json({ error: 'Tableau de bord indisponible' }, 503);
  }
}
