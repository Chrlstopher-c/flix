/** Outils MCP en écriture : n'agissent que sur le compte de la clé. */
import { isStatus, join, joinIfMissing, leave, updateEntry } from '../library/entries';
import { addNote } from '../library/notes';
import { titleState } from '../library/queries';
import { ensureTitle } from '../library/titles';
import { markEpisode, setCheckpoint } from '../progress/progress';
import { int, schema, text, titleOf, TITLE_PROPS, ToolError, type Args, type Tool } from './tool-kit';
import type { User } from '../auth/users';

const STATUS = { type: 'string', enum: ['a_voir', 'en_cours', 'vu', 'abandonne'] };
const LANG = { type: 'string', description: 'Code ISO 639-1 : fr, en, ja…' };
const AT = { type: 'string', description: 'Instant « mm:ss » ou « h:mm:ss »' };

function seconds(a: Args): number | null {
  const v = text(a, 'at');
  if (!v) return null;
  const parts = v.split(':').map(Number);
  if (parts.some((p) => !Number.isFinite(p))) throw new ToolError('at doit être au format mm:ss ou h:mm:ss');
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

/** Ajoute le titre à ma liste s'il n'y est pas encore, et rend son identifiant. */
async function tracked(a: Args, user: User): Promise<string> {
  const t = titleOf(a);
  await ensureTitle(t.mediaType, t.tmdbId, user.id);
  joinIfMissing(t.id, user.id);
  return t.id;
}

function mineAfter(id: string, user: User): unknown {
  const s = titleState(id) as { entries?: { userId: number }[] } | null; // forme titleState
  return s?.entries?.find((e) => e.userId === user.id) ?? { removed: true };
}

export const WRITE_TOOLS: Tool[] = [
  {
    name: 'set_status',
    description: 'Change mon statut sur un titre (l’ajoute à ma liste si besoin).',
    write: true,
    inputSchema: schema({ ...TITLE_PROPS, status: STATUS }, ['media_type', 'tmdb_id', 'status']),
    run: async (a, user) => {
      if (!isStatus(a.status)) throw new ToolError('statut invalide');
      const t = titleOf(a);
      await ensureTitle(t.mediaType, t.tmdbId, user.id);
      join(t.id, user.id, a.status);
      return mineAfter(t.id, user);
    },
  },
  {
    name: 'rate_title',
    description: 'Me fait noter un titre sur 10 (null pour effacer).',
    write: true,
    inputSchema: schema({ ...TITLE_PROPS, rating: { type: ['integer', 'null'], minimum: 1, maximum: 10 } }, [
      'media_type',
      'tmdb_id',
      'rating',
    ]),
    run: async (a, user) => {
      const rating = a.rating === null ? null : int(a, 'rating');
      if (rating !== null && (rating < 1 || rating > 10)) throw new ToolError('note entre 1 et 10');
      const id = await tracked(a, user);
      const current = mineAfter(id, user) as { status?: string };
      // Une note implique d'avoir vu le titre : « à voir » passe à « vu ».
      updateEntry(id, user.id, { rating, status: rating !== null && current.status === 'a_voir' ? 'vu' : undefined });
      return mineAfter(id, user);
    },
  },
  {
    name: 'set_version',
    description: 'Version que je regarde : langue audio et sous-titres (facultatifs).',
    write: true,
    inputSchema: schema({ ...TITLE_PROPS, audio: LANG, subtitles: LANG }, ['media_type', 'tmdb_id', 'audio']),
    run: async (a, user) => {
      const id = await tracked(a, user);
      const sub = text(a, 'subtitles');
      updateEntry(id, user.id, { languages: [`audio:${text(a, 'audio') ?? ''}`, ...(sub ? [`sub:${sub}`] : [])] });
      return mineAfter(id, user);
    },
  },
  {
    name: 'mark_episode',
    description: 'Coche (ou décoche) un épisode ; up_to coche aussi les précédents.',
    write: true,
    inputSchema: schema(
      {
        tmdb_id: TITLE_PROPS.tmdb_id,
        season: { type: 'integer' },
        episode: { type: 'integer' },
        watched: { type: 'boolean' },
        up_to: { type: 'boolean' },
      },
      ['tmdb_id', 'season', 'episode'],
    ),
    run: async (a, user) => {
      const id = await tracked({ ...a, media_type: 'tv' }, user);
      const season = int(a, 'season') ?? 1;
      const episode = int(a, 'episode') ?? 1;
      markEpisode(id, user.id, season, episode, a.watched !== false, a.up_to === true);
      return { ok: true, season, episode };
    },
  },
  {
    name: 'set_checkpoint',
    description: 'Mon point d’arrêt : épisode (séries) et instant.',
    write: true,
    inputSchema: schema({ ...TITLE_PROPS, season: { type: 'integer' }, episode: { type: 'integer' }, at: AT }, [
      'media_type',
      'tmdb_id',
    ]),
    run: async (a, user) => {
      const id = await tracked(a, user);
      setCheckpoint(id, user.id, int(a, 'season'), int(a, 'episode'), seconds(a));
      return { ok: true };
    },
  },
  {
    name: 'add_note',
    description: 'Ajoute un avis ou un moment marquant (épisode, instant, langue facultatifs).',
    write: true,
    inputSchema: schema(
      {
        ...TITLE_PROPS,
        kind: { type: 'string', enum: ['avis', 'moment'] },
        body: { type: 'string' },
        season: { type: 'integer' },
        episode: { type: 'integer' },
        at: AT,
        language: LANG,
      },
      ['media_type', 'tmdb_id', 'kind', 'body'],
    ),
    run: async (a, user) => {
      const body = text(a, 'body');
      if (!body) throw new ToolError('body est vide');
      const id = await tracked(a, user);
      const kind = a.kind === 'moment' ? 'moment' : 'avis';
      const noteId = addNote(id, user.id, {
        kind,
        body,
        season: int(a, 'season'),
        episode: int(a, 'episode'),
        atSeconds: seconds(a),
        language: text(a, 'language'),
      });
      return { ok: true, note_id: noteId };
    },
  },
  {
    name: 'remove_title',
    description: 'Retire un titre de ma liste (n’affecte pas l’autre compte).',
    write: true,
    inputSchema: schema(TITLE_PROPS, ['media_type', 'tmdb_id']),
    run: async (a, user) => {
      leave(titleOf(a).id, user.id);
      return { ok: true };
    },
  },
];
