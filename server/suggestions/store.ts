/** Suggestions entre amis : « ça pourrait te plaire », avec un mot, en attente jusqu’à ajout ou refus. */
import { db } from '../core/db';
import { hasEntry } from '../library/entries';
import { toCard, type Raw } from '../tmdb/cards';
import { fullDetails } from '../tmdb/details';
import type { MediaType } from '../tmdb/kind';

export type Suggestion = {
  id: number;
  titleId: string;
  card: Raw;
  fromUser: number;
  toUser: number;
  message: string | null;
  status: 'pending' | 'accepted' | 'dismissed';
  createdAt: number;
};

type Row = Omit<Suggestion, 'card'> & { card: string };

const COLUMNS = `id, title_id AS titleId, card, from_user AS fromUser, to_user AS toUser, message, status,
  created_at AS createdAt`;

function parse(rows: Row[]): Suggestion[] {
  return rows.map((r) => ({ ...r, card: JSON.parse(r.card) as Raw })); // carte écrite par suggest()
}

/** Vignette du titre figée au moment de la suggestion (pas besoin qu'il soit dans une bibliothèque). */
async function cardOf(mediaType: MediaType, tmdbId: number): Promise<Raw | null> {
  const d = (await fullDetails(mediaType, tmdbId)) as Raw & { genres?: { id: number }[] }; // fiche TMDB
  return toCard({ ...d, media_type: mediaType, genre_ids: (d.genres ?? []).map((g) => g.id) });
}

export async function suggest(
  from: number,
  to: number[],
  mediaType: MediaType,
  tmdbId: number,
  message: string | null,
): Promise<number> {
  const card = await cardOf(mediaType, tmdbId);
  if (!card) return 0;
  const insert = db.query(`INSERT INTO suggestions (title_id, card, from_user, to_user, message, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?) ON CONFLICT (title_id, from_user, to_user) DO UPDATE SET
    message = excluded.message, status = 'pending', created_at = excluded.created_at, card = excluded.card`);
  const targets = [...new Set(to)].filter((id) => id !== from);
  db.transaction(() => {
    for (const t of targets) insert.run(String(card.id), JSON.stringify(card), from, t, message, Date.now());
  })();
  return targets.length;
}

/** Suggestions reçues en attente ; celles déjà arrivées dans ma liste sont closes au passage. */
export function received(userId: number): Suggestion[] {
  const rows = parse(
    db
      .query(
        `SELECT ${COLUMNS} FROM suggestions WHERE to_user = ? AND status = 'pending'
    ORDER BY created_at DESC`,
      )
      .all(userId) as Row[],
  ); // colonnes du SELECT
  const open = rows.filter((r) => !hasEntry(r.titleId, userId));
  for (const r of rows) if (!open.includes(r)) settleForTitle(r.titleId, userId);
  return open;
}

export function sent(userId: number, limit = 40): Suggestion[] {
  return parse(
    db
      .query(`SELECT ${COLUMNS} FROM suggestions WHERE from_user = ? ORDER BY created_at DESC LIMIT ?`)
      .all(userId, limit) as Row[],
  ); // colonnes du SELECT
}

export function forTitle(titleId: string, userId: number): { toMe: Suggestion[]; fromMe: Suggestion[] } {
  const rows = parse(
    db
      .query(`SELECT ${COLUMNS} FROM suggestions WHERE title_id = ? AND (to_user = ? OR from_user = ?)`)
      .all(titleId, userId, userId) as Row[],
  ); // colonnes du SELECT
  return {
    toMe: rows.filter((r) => r.toUser === userId && r.status === 'pending'),
    fromMe: rows.filter((r) => r.fromUser === userId),
  };
}

export function setStatus(id: number, userId: number, status: 'accepted' | 'dismissed'): Suggestion | null {
  db.query('UPDATE suggestions SET status = ? WHERE id = ? AND to_user = ?').run(status, id, userId);
  return (
    parse(db.query(`SELECT ${COLUMNS} FROM suggestions WHERE id = ? AND to_user = ?`).all(id, userId) as Row[])[0] ??
    null
  ); // SELECT
}

/** Une suggestion reçue devient « acceptée » dès que le titre arrive dans ma liste, quel que soit le chemin. */
export function settleForTitle(titleId: string, userId: number): void {
  db.query(
    `UPDATE suggestions SET status = 'accepted' WHERE title_id = ? AND to_user = ? AND status = 'pending'`,
  ).run(titleId, userId);
}
