/** Comptes et sessions : deux personnes, mot de passe, cookie de session. */
import { randomBytes } from 'node:crypto';
import { db } from '../core/db';
import { ENV } from '../core/env';
import { log } from '../core/logger';

export type User = { id: number; name: string; color: string };

const COLORS = ['#ff8a5c', '#7cc4ff', '#c79bff', '#7fe0a8'];
const SESSION_DAYS = 180;
export const COOKIE = 'ft_session';
const SECURE = process.env.NODE_ENV === 'production' ? '; Secure' : '';

export function seedUsers(): void {
  const count = db.query('SELECT COUNT(*) AS n FROM users').get() as { n: number }; // COUNT renvoie toujours une ligne
  if (count.n > 0) return;
  const pairs: [string, string][] = ENV.users
    ? ENV.users.split(',').map((p) => [p.split(':')[0] ?? '', p.split(':').slice(1).join(':')])
    : [
        ['Chris', randomBytes(6).toString('base64url')],
        ['Mathéo', randomBytes(6).toString('base64url')],
      ];
  pairs.forEach(([name, password], i) => {
    db.query('INSERT INTO users (name, password_hash, color) VALUES (?, ?, ?)').run(
      name,
      Bun.password.hashSync(password),
      COLORS[i % COLORS.length] ?? '#ff8a5c',
    );
    log.warn({ name, password }, 'Compte créé — note ce mot de passe');
  });
}

export function listUsers(): User[] {
  return db.query('SELECT id, name, color FROM users ORDER BY id').all() as User[]; // colonnes du SELECT = User
}

export async function login(name: string, password: string): Promise<string | null> {
  const row = db.query('SELECT id, password_hash FROM users WHERE name = ?').get(name) as {
    id: number;
    password_hash: string;
  } | null; // colonnes du SELECT
  if (!row || !(await Bun.password.verify(password, row.password_hash))) return null;
  const token = randomBytes(32).toString('base64url');
  db.query('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)').run(token, row.id, Date.now());
  return token;
}

export function logout(token: string): void {
  db.query('DELETE FROM sessions WHERE token = ?').run(token);
}

export function userFromRequest(req: Request): User | null {
  const token = readCookie(req);
  if (!token) return null;
  const minCreated = Date.now() - SESSION_DAYS * 86_400_000;
  return db
    .query(
      `SELECT u.id, u.name, u.color FROM sessions s JOIN users u ON u.id = s.user_id
            WHERE s.token = ? AND s.created_at > ?`,
    )
    .get(token, minCreated) as User | null; // colonnes du SELECT = User
}

export function readCookie(req: Request): string | null {
  const match = req.headers.get('cookie')?.match(new RegExp(`${COOKIE}=([^;]+)`));
  return match?.[1] ?? null;
}

export function sessionCookie(token: string, maxAge = SESSION_DAYS * 86_400): string {
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${SECURE}`;
}
