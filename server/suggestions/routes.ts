/** Routes suggestions : envoyer, lister, accepter (ajoute à ma liste), ignorer. */
import type { User } from '../auth/users';
import { fail, json, num, readBody, str } from '../core/http';
import { log } from '../core/logger';
import { join } from '../library/entries';
import { ensureTitle } from '../library/titles';
import { markDirty } from '../taste/scheduler';
import type { MediaType } from '../tmdb/kind';
import { forTitle, received, sent, setStatus, suggest } from './store';

async function create(req: Request, user: User): Promise<Response> {
  const b = await readBody(req);
  const mediaType = b.mediaType === 'movie' || b.mediaType === 'tv' ? b.mediaType : null;
  const tmdbId = num(b.tmdbId);
  const to = Array.isArray(b.to) ? b.to.filter((x): x is number => typeof x === 'number') : [];
  if (!mediaType || !tmdbId || !to.length) return fail(400, 'Titre et destinataires requis');
  const count = await suggest(user.id, to, mediaType, tmdbId, str(b.message)?.slice(0, 280) ?? null);
  markDirty();
  return json({ sent: count, ...forTitle(`${mediaType}:${tmdbId}`, user.id) });
}

async function accept(id: number, user: User): Promise<Response> {
  const s = setStatus(id, user.id, 'accepted');
  if (!s) return fail(404, 'Suggestion introuvable');
  const [mediaType, tmdbId] = s.titleId.split(':');
  await ensureTitle(mediaType as MediaType, Number(tmdbId), user.id); // titleId « movie:123 » posé par toCard
  join(s.titleId, user.id, 'a_voir');
  markDirty();
  return json({ ok: true });
}

export async function suggestionRoutes(req: Request, path: string, user: User): Promise<Response | null> {
  if (!path.startsWith('/api/suggestions')) return null;
  try {
    if (path === '/api/suggestions' && req.method === 'GET')
      return json({ received: received(user.id), sent: sent(user.id) });
    if (path === '/api/suggestions' && req.method === 'POST') return await create(req, user);
    const forOne = path.match(/^\/api\/suggestions\/title\/((?:movie|tv):\d+)$/);
    if (forOne?.[1]) return json(forTitle(forOne[1], user.id));
    const act = path.match(/^\/api\/suggestions\/(\d+)\/(accept|dismiss)$/);
    if (act?.[1] && req.method === 'POST') {
      if (act[2] === 'accept') return await accept(Number(act[1]), user);
      markDirty();
      return setStatus(Number(act[1]), user.id, 'dismissed')
        ? json({ ok: true })
        : fail(404, 'Suggestion introuvable');
    }
    return null;
  } catch (err) {
    log.error({ err, path }, 'Route suggestions en erreur');
    return fail(500, 'Erreur interne');
  }
}
