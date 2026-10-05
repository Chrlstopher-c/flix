/** Routes de compte : connexion, inscription sur invitation, session, réglages. */
import { fail, json, readBody, str } from '../core/http';
import { clientIp, isBlocked, recordFailure } from './limiter';
import { changePassword, rename } from './settings';
import { inviteKey, rotateInviteKey, signup } from './signup';
import { listUsers, login, logout, readCookie, sessionCookie, userFromRequest, type User } from './users';

/** Connexion et inscription : protégées contre les essais répétés. */
async function entry(req: Request, path: string, ip: string): Promise<Response | null> {
  if (req.method !== 'POST' || (path !== '/api/login' && path !== '/api/signup')) return null;
  if (isBlocked(ip)) return fail(429, 'Trop de tentatives, réessaie dans un quart d’heure');
  const b = await readBody(req);
  const result = path === '/api/login'
    ? await login(str(b.name) ?? '', str(b.password) ?? '').then((token) => token ? { token } : { error: '' })
    : signup({ name: str(b.name) ?? '', password: str(b.password) ?? '', confirm: str(b.confirm) ?? '',
      key: str(b.key) ?? '' });
  if ('error' in result) {
    recordFailure(ip);
    return path === '/api/login' ? fail(401, 'Nom ou mot de passe incorrect') : fail(400, result.error);
  }
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie(result.token) });
}

async function account(req: Request, path: string, user: User): Promise<Response | null> {
  if (path === '/api/invite') return json({ key: req.method === 'POST' ? rotateInviteKey() : inviteKey() });
  if (path === '/api/me/name' && req.method === 'PUT') {
    const error = rename(user.id, str((await readBody(req)).name) ?? '');
    return error ? fail(400, error) : json({ ok: true });
  }
  if (path === '/api/me/password' && req.method === 'PUT') {
    const b = await readBody(req);
    const error = await changePassword(user.id, str(b.current) ?? '', str(b.next) ?? '', str(b.confirm) ?? '');
    return error ? fail(400, error) : json({ ok: true });
  }
  return null;
}

export async function authRoutes(req: Request, path: string): Promise<Response | null> {
  const entered = await entry(req, path, clientIp(req));
  if (entered) return entered;
  if (path === '/api/logout' && req.method === 'POST') {
    const token = readCookie(req);
    if (token) logout(token);
    return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0) });
  }
  const user = userFromRequest(req);
  if (path === '/api/me') return user ? json({ me: user, users: listUsers() }) : fail(401, 'Non connecté');
  return user ? account(req, path, user) : null;
}
