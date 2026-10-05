/** Inscription sur invitation : une clé partagée, créée au premier démarrage, visible des comptes existants. */
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { db } from '../core/db';
import { log } from '../core/logger';
import { nameError, passwordError } from './settings';
import { COLORS, openSession } from './users';

const KEY = 'invite_key';

function newKey(): string {
  return randomBytes(9).toString('base64url');
}

export function inviteKey(): string {
  const row = db.query('SELECT value FROM app_settings WHERE key = ?').get(KEY) as { value: string } | null; // SELECT
  if (row) return row.value;
  return rotateInviteKey();
}

export function rotateInviteKey(): string {
  const key = newKey();
  db.query('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(KEY, key);
  return key;
}

/** Au démarrage : garantit qu'une clé existe et l'écrit dans le journal. */
export function ensureInviteKey(): void {
  log.info({ inviteKey: inviteKey() }, 'Clé d’invitation (aussi visible dans Réglages)');
}

function sameKey(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

type Signup = { name: string; password: string; confirm: string; key: string };

/** Crée le compte et rend un jeton de session, ou un message d'erreur. */
export function signup(s: Signup): { token: string } | { error: string } {
  if (!sameKey(s.key, inviteKey())) return { error: 'Clé d’invitation invalide' };
  const error = nameError(s.name) ?? passwordError(s.password, s.confirm);
  if (error) return { error };
  const { n } = db.query('SELECT COUNT(*) AS n FROM users').get() as { n: number }; // COUNT
  const res = db.query('INSERT INTO users (name, password_hash, color) VALUES (?, ?, ?)')
    .run(s.name, Bun.password.hashSync(s.password), COLORS[n % COLORS.length] ?? '#ff8a5c');
  log.info({ name: s.name }, 'Compte créé par invitation');
  return { token: openSession(Number(res.lastInsertRowid)) };
}
