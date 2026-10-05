/** Routes bibliothèque : ajouter, statuer, étiqueter, annoter, suivre sa progression. */
import type { User } from '../auth/users';
import { fail, json, num, readBody, str, strList } from '../core/http';
import { log } from '../core/logger';
import { markEpisode, setCheckpoint } from '../progress/progress';
import { isStatus, join, joinIfMissing, leave, updateEntry } from './entries';
import { addNote, deleteNote, NOTE_KINDS, type NoteKind } from './notes';
import { listLibrary, titleState } from './queries';
import { attachTag, detachTag, listTags } from './tags';
import { ensureTitle } from './titles';

type Body = Record<string, unknown>;

async function addTitle(b: Body, user: User): Promise<Response> {
  const mediaType = b.mediaType === 'movie' || b.mediaType === 'tv' ? b.mediaType : null;
  const tmdbId = num(b.tmdbId);
  if (!mediaType || !tmdbId) return fail(400, 'Titre invalide');
  const id = await ensureTitle(mediaType, tmdbId, user.id);
  join(id, user.id, isStatus(b.status) ? b.status : 'a_voir');
  if (num(b.rating) !== null) updateEntry(id, user.id, { rating: num(b.rating) });
  return json(titleState(id));
}

function noteKind(v: unknown): NoteKind {
  return (NOTE_KINDS as readonly unknown[]).includes(v) ? (v as NoteKind) : 'avis'; // vérifié par includes
}

function onTitle(method: string, sub: string | undefined, id: string, b: Body, user: User): Response | null {
  if (!sub && method === 'GET') return titleState(id) ? json(titleState(id)) : fail(404, 'Titre absent');
  if (sub === 'me' && method === 'PUT') {
    if (b.status !== undefined && !isStatus(b.status)) return fail(400, 'Statut invalide');
    if (!titleState(id)) return fail(404, 'Titre absent');
    joinIfMissing(id, user.id);
    updateEntry(id, user.id, {
      status: isStatus(b.status) ? b.status : undefined,
      rating: b.rating === null ? null : (num(b.rating) ?? undefined),
      languages: Array.isArray(b.languages) ? strList(b.languages) : undefined,
    });
  } else if (sub === 'me' && method === 'DELETE') leave(id, user.id);
  else if (sub === 'tags' && method === 'POST' && str(b.name)) attachTag(id, str(b.name) ?? '');
  else if (sub === 'tags' && method === 'DELETE' && num(b.tagId)) detachTag(id, num(b.tagId) ?? 0);
  else if (sub === 'notes' && method === 'POST' && str(b.body)) {
    addNote(id, user.id, {
      kind: noteKind(b.kind),
      body: str(b.body) ?? '',
      season: num(b.season),
      episode: num(b.episode),
      atSeconds: num(b.atSeconds),
      language: str(b.language),
    });
  } else if (sub === 'notes' && method === 'DELETE' && num(b.noteId)) deleteNote(num(b.noteId) ?? 0, user.id);
  else if (sub === 'checkpoint' && method === 'PUT') {
    setCheckpoint(id, user.id, num(b.season), num(b.episode), num(b.atSeconds));
  } else if (sub === 'episodes' && method === 'POST' && num(b.season) !== null && num(b.episode) !== null) {
    markEpisode(id, user.id, num(b.season) ?? 0, num(b.episode) ?? 0, b.watched !== false, b.upTo === true);
  } else return null;
  return json(titleState(id) ?? { removed: true });
}

export async function libraryRoutes(req: Request, path: string, user: User): Promise<Response | null> {
  try {
    if (path === '/api/library' && req.method === 'GET') return json({ titles: listLibrary(), tags: listTags() });
    if (path === '/api/library' && req.method === 'POST') return await addTitle(await readBody(req), user);
    const m = path.match(/^\/api\/library\/((?:movie|tv):\d+)(?:\/(\w+))?$/);
    if (!m?.[1]) return null;
    const body = req.method === 'GET' ? {} : await readBody(req);
    return onTitle(req.method, m[2], m[1], body, user);
  } catch (err) {
    log.error({ err, path }, 'Route bibliothèque en erreur');
    return fail(500, 'Erreur interne');
  }
}
