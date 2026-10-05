/** Outils MCP en lecture : recherche, fiche, ma bibliothèque, mes recommandations, celles des duos. */
import { listLibrary, titleState } from '../library/queries';
import type { TasteResult } from '../taste/engine';
import { listUsers } from '../auth/users';
import { duoScope, readResult } from '../taste/store';
import { cards, type Raw } from '../tmdb/cards';
import { TTL, tmdb } from '../tmdb/client';
import { fullDetails } from '../tmdb/details';
import { schema, text, titleOf, TITLE_PROPS, ToolError, type Tool } from './tool-kit';

type Row = Record<string, unknown> & { entries: { userId: number }[] };

function compact(c: Raw): Raw {
  return { media_type: c.mediaType, tmdb_id: c.tmdbId, name: c.name, year: c.year, kind: c.kind, reason: c.reason };
}

/** Ne garde que ma propre entrée : l'outil n'expose jamais le suivi de l'autre compte. */
function mine(row: Row, userId: number): Raw {
  const { entries, ...rest } = row;
  return { ...rest, me: entries.find((e) => e.userId === userId) ?? null };
}

async function details(mediaType: 'movie' | 'tv', tmdbId: number): Promise<Raw> {
  const d = (await fullDetails(mediaType, tmdbId)) as Raw & { credits?: { cast?: Raw[]; crew?: Raw[] } }; // fiche TMDB
  return {
    name: d.title ?? d.name,
    overview: d.overview,
    original_language: d.original_language,
    date: d.release_date ?? d.first_air_date,
    genres: (d.genres as Raw[] | undefined)?.map((g) => g.name), // genres TMDB
    seasons: d.number_of_seasons,
    episodes: d.number_of_episodes,
    vote: d.vote_average,
    cast: d.credits?.cast?.slice(0, 6).map((c) => `${String(c.name)} (${String(c.character ?? '')})`),
    directors: d.credits?.crew?.filter((c) => c.job === 'Director').map((c) => c.name),
  };
}

export const READ_TOOLS: Tool[] = [
  {
    name: 'search_titles',
    description: 'Cherche un film, une série ou un animé dans TMDB.',
    inputSchema: schema({ query: { type: 'string' } }, ['query']),
    run: async (a) =>
      cards(await tmdb('/search/multi', { query: text(a, 'query') ?? '' }, TTL.search))
        .slice(0, 12)
        .map(compact),
  },
  {
    name: 'get_title',
    description: 'Fiche d’un titre (TMDB) et mon suivi : statut, note, version, notes, progression.',
    inputSchema: schema(TITLE_PROPS, ['media_type', 'tmdb_id']),
    run: async (a, user) => {
      const t = titleOf(a);
      type State = Row & { notes: Raw[]; checkpoints: Raw[]; watched: Raw[] };
      const state = titleState(t.id) as State | null; // forme titleState
      const own = state && {
        ...mine(state, user.id),
        notes: state.notes.filter((n) => n.userId === user.id),
        checkpoint: state.checkpoints.find((c) => c.userId === user.id) ?? null,
        watched_episodes: state.watched.filter((w) => w.userId === user.id).length,
      };
      return { tmdb: await details(t.mediaType, t.tmdbId), mine: own };
    },
  },
  {
    name: 'my_library',
    description: 'Ma bibliothèque, filtrable par statut (a_voir, en_cours, vu, abandonne).',
    inputSchema: schema({ status: { type: 'string', enum: ['a_voir', 'en_cours', 'vu', 'abandonne'] } }),
    run: async (a, user) =>
      (listLibrary() as Row[])
        .filter((t) => t.entries.some((e) => e.userId === user.id && (!a.status || (e as Raw).status === a.status)))
        .map((t) => mine(t, user.id)),
  },
  {
    name: 'my_recommendations',
    description: 'Mes recommandations personnelles, avec la raison de chacune.',
    inputSchema: schema({}),
    run: async (_a, user) => {
      const r = readResult<TasteResult>(`user:${user.id}`);
      return r
        ? {
            computed_at: new Date(r.computedAt).toISOString(),
            for_you: r.body.forYou.map(compact),
            because: r.body.because.map((b) => ({ because_you_liked: b.name, items: b.items.map(compact) })),
          }
        : null;
    },
  },
  {
    name: 'duo_recommendations',
    description:
      'Recommandations communes avec une autre personne (goûts mêlés). Sans « with », pour chaque personne.',
    inputSchema: schema({ with: { type: 'string', description: 'Nom de l’autre personne (facultatif)' } }),
    run: async (a, user) => {
      const wanted = text(a, 'with')?.toLowerCase();
      const others = listUsers().filter((u) => u.id !== user.id && (!wanted || u.name.toLowerCase() === wanted));
      if (wanted && !others.length) throw new ToolError(`Personne inconnue : ${wanted}`);
      return others.map((o) => {
        const r = readResult<TasteResult>(duoScope(user.id, o.id));
        return {
          with: o.name,
          computed_at: r && new Date(r.computedAt).toISOString(),
          for_both: r?.body.forYou.map(compact) ?? [],
        };
      });
    },
  },
];
