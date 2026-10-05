/** Routes de connexion. */
import { fail, json, readBody, str } from '../core/http';
import { changePassword, rename } from './settings';
import { listUsers, login, logout, readCookie, sessionCookie, userFromRequest } from './users';

export async function authRoutes(req: Request, path: string): Promise<Response | null> {
  if (path === '/api/login' && req.method === 'POST') {
    const body = await readBody(req);
    const token = await login(str(body.name) ?? '', str(body.password) ?? '');
    if (!token) return fail(401, 'Nom ou mot de passe incorrect');
    return json({ ok: true }, 200, { 'set-cookie': sessionCookie(token) });
  }
  if (path === '/api/logout' && req.method === 'POST') {
    const token = readCookie(req);
    if (token) logout(token);
    return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0) });
  }
  if (path === '/api/users' && req.method === 'GET') {
    return json({ users: listUsers().map(({ name, color }) => ({ name, color })) });
  }
  if (path === '/api/me') {
    const user = userFromRequest(req);
    return user ? json({ me: user, users: listUsers() }) : fail(401, 'Non connecté');
  }
  const user = userFromRequest(req);
  if (path === '/api/me/name' && req.method === 'PUT' && user) {
    const error = rename(user.id, str((await readBody(req)).name) ?? '');
    return error ? fail(400, error) : json({ ok: true });
  }
  if (path === '/api/me/password' && req.method === 'PUT' && user) {
    const b = await readBody(req);
    const error = await changePassword(user.id, str(b.current) ?? '', str(b.next) ?? '', str(b.confirm) ?? '');
    return error ? fail(400, error) : json({ ok: true });
  }
  return null;
}
