/** Ce que chacun fait d'un titre : statut, note, langues de visionnage. */
import { db } from '../core/db';

export const STATUSES = ['a_voir', 'en_cours', 'vu', 'abandonne'] as const;
export type Status = (typeof STATUSES)[number];

export function isStatus(v: unknown): v is Status {
  return typeof v === 'string' && (STATUSES as readonly string[]).includes(v);
}

export function join(titleId: string, userId: number, status: Status): void {
  const now = Date.now();
  db.query(
    `INSERT INTO title_users (title_id, user_id, status, added_at, updated_at) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT (title_id, user_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at`,
  ).run(titleId, userId, status, now, now);
}

export function joinIfMissing(titleId: string, userId: number): void {
  const now = Date.now();
  db.query(
    `INSERT OR IGNORE INTO title_users (title_id, user_id, status, added_at, updated_at) VALUES (?, ?, 'a_voir', ?, ?)`,
  ).run(titleId, userId, now, now);
}

export function updateEntry(
  titleId: string,
  userId: number,
  patch: { status?: Status; rating?: number | null; languages?: string[] },
): void {
  const now = Date.now();
  if (patch.status) {
    db.query('UPDATE title_users SET status = ?, updated_at = ? WHERE title_id = ? AND user_id = ?').run(
      patch.status,
      now,
      titleId,
      userId,
    );
  }
  if (patch.rating !== undefined) {
    db.query('UPDATE title_users SET rating = ?, updated_at = ? WHERE title_id = ? AND user_id = ?').run(
      patch.rating,
      now,
      titleId,
      userId,
    );
  }
  if (patch.languages) {
    db.query('UPDATE title_users SET languages = ?, updated_at = ? WHERE title_id = ? AND user_id = ?').run(
      JSON.stringify(patch.languages),
      now,
      titleId,
      userId,
    );
  }
}

export function leave(titleId: string, userId: number): void {
  db.query('DELETE FROM title_users WHERE title_id = ? AND user_id = ?').run(titleId, userId);
  db.query('DELETE FROM titles WHERE id = ? AND NOT EXISTS (SELECT 1 FROM title_users WHERE title_id = ?)').run(
    titleId,
    titleId,
  );
}
