/** Clés MCP : une par compte, stockée hachée, montrée une seule fois à la création. */
import { createHash, randomBytes } from 'node:crypto';
import { listUsers, type User } from '../auth/users';
import { db } from '../core/db';

const PREFIX = 'flx_';

function hash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createToken(userId: number): string {
  const token = PREFIX + randomBytes(24).toString('base64url');
  db.query(
    `INSERT INTO mcp_tokens (user_id, token_hash, created_at) VALUES (?, ?, ?)
            ON CONFLICT (user_id) DO UPDATE SET token_hash = excluded.token_hash, created_at = excluded.created_at,
            last_used_at = NULL`,
  ).run(userId, hash(token), Date.now());
  return token;
}

export function revokeToken(userId: number): void {
  db.query('DELETE FROM mcp_tokens WHERE user_id = ?').run(userId);
}

export function tokenStatus(userId: number): { createdAt: number; lastUsedAt: number | null } | null {
  return db
    .query('SELECT created_at AS createdAt, last_used_at AS lastUsedAt FROM mcp_tokens WHERE user_id = ?')
    .get(userId) as { createdAt: number; lastUsedAt: number | null } | null; // colonnes du SELECT
}

/** Retrouve le compte d'une clé ; note la date d'usage. */
export function userFromToken(token: string): User | null {
  if (!token.startsWith(PREFIX)) return null;
  const row = db.query('SELECT user_id AS id FROM mcp_tokens WHERE token_hash = ?').get(hash(token)) as {
    id: number;
  } | null; // SELECT
  if (!row) return null;
  db.query('UPDATE mcp_tokens SET last_used_at = ? WHERE user_id = ?').run(Date.now(), row.id);
  return listUsers().find((u) => u.id === row.id) ?? null;
}
