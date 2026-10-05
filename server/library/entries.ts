/** Ce que chacun fait d'un titre : statut, note, langues de visionnage. */
import { db } from '../core/db';

export const STATUSES = ['a_voir', 'en_cours', 'vu', 'abandonne'] as const;
export type Status = (typeof STATUSES)[number];

export function isStatus(v: unknown): v is Status {
  return typeof v === 'string' && (STATUSES as readonly string[]).includes(v);
}

/** Version par défaut d'un nouveau suivi : langue originale en audio, sans sous-titres (rien si muet ou inconnu). */
const DEFAULT_LANGUAGES = `COALESCE((SELECT CASE
  WHEN original_language IS NULL OR original_language IN ('', 'xx') THEN '[]'
  ELSE json_array('audio:' || original_language) END FROM titles WHERE id = ?), '[]')`;

export function join(titleId: string, userId: number, status: Status): void {
  const now = Date.now();
  db.query(
    `INSERT INTO title_users (title_id, user_id, status, languages, added_at, updated_at)
     VALUES (?, ?, ?, ${DEFAULT_LANGUAGES}, ?, ?)
     ON CONFLICT (title_id, user_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at`,
  ).run(titleId, userId, status, titleId, now, now);
}

export function joinIfMissing(titleId: string, userId: number): void {
  const now = Date.now();
  db.query(
    `INSERT OR IGNORE INTO title_users (title_id, user_id, status, languages, added_at, updated_at)
     VALUES (?, ?, 'a_voir', ${DEFAULT_LANGUAGES}, ?, ?)`,
  ).run(titleId, userId, titleId, now, now);
}

/** Migration unique (user_version 1) : les suivis créés sans version reçoivent la langue originale. */
export function migrateDefaultLanguages(): number {
  const { v } = db.query('SELECT user_version AS v FROM pragma_user_version').get() as { v: number }; // pragma
  if (v >= 1) return 0;
  const { changes } = db
    .query(
      `UPDATE title_users SET languages = (SELECT json_array('audio:' || t.original_language) FROM titles t
       WHERE t.id = title_users.title_id)
     WHERE languages = '[]' AND title_id IN (SELECT id FROM titles WHERE original_language IS NOT NULL
       AND original_language NOT IN ('', 'xx'))`,
    )
    .run();
  db.exec('PRAGMA user_version = 1');
  return changes;
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
