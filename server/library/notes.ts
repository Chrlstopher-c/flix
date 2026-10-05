/** Avis et moments marquants, rattachés à un titre, un épisode et un instant, avec une langue. */
import { db } from '../core/db';

export const NOTE_KINDS = ['avis', 'moment'] as const;
export type NoteKind = (typeof NOTE_KINDS)[number];

export type NoteInput = {
  kind: NoteKind;
  body: string;
  season: number | null;
  episode: number | null;
  atSeconds: number | null;
  language: string | null;
};

export function addNote(titleId: string, userId: number, n: NoteInput): number {
  const res = db
    .query(
      `INSERT INTO notes (title_id, user_id, kind, season, episode, at_seconds, body, language, created_at)
                        VALUES (?,?,?,?,?,?,?,?,?)`,
    )
    .run(titleId, userId, n.kind, n.season, n.episode, n.atSeconds, n.body, n.language, Date.now());
  return Number(res.lastInsertRowid);
}

export function deleteNote(id: number, userId: number): boolean {
  return db.query('DELETE FROM notes WHERE id = ? AND user_id = ?').run(id, userId).changes > 0;
}

export type MomentRow = {
  titleId: string; userId: number; body: string; season: number | null; episode: number | null;
  atSeconds: number | null; language: string | null; at: number;
};

export function latestMoment(): MomentRow | null {
  return db.query(`SELECT title_id AS titleId, user_id AS userId, body, season, episode, at_seconds AS atSeconds,
                   language, created_at AS at FROM notes WHERE kind = 'moment' ORDER BY created_at DESC LIMIT 1`)
    .get() as MomentRow | null; // SELECT explicite
}
