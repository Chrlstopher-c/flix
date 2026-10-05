/** Lectures de la bibliothèque : liste complète et état détaillé d'un titre. */
import { db } from '../core/db';

type Row = Record<string, unknown>;

function parse(row: Row, keys: string[]): Row {
  for (const k of keys) if (typeof row[k] === 'string') row[k] = JSON.parse(row[k] as string); // colonnes JSON connues
  return row;
}

export function listLibrary(): Row[] {
  const titles = db
    .query(
      `SELECT id, media_type AS mediaType, tmdb_id AS tmdbId, kind, name, poster_path AS poster,
                           backdrop_path AS backdrop, year, genres, original_language AS language,
                           spoken_languages AS spokenLanguages, created_at AS createdAt FROM titles`,
    )
    .all() as Row[]; // SELECT explicite
  const entries = db
    .query(
      `SELECT title_id AS titleId, user_id AS userId, status, rating, languages,
                            added_at AS addedAt, updated_at AS updatedAt FROM title_users`,
    )
    .all() as Row[]; // SELECT explicite
  const tags = db
    .query(
      `SELECT tt.title_id AS titleId, t.id, t.name, t.color FROM title_tags tt
                         JOIN tags t ON t.id = tt.tag_id`,
    )
    .all() as Row[]; // SELECT explicite
  const byTitle = new Map<string, Row>();
  for (const t of titles)
    byTitle.set(t.id as string, { ...parse(t, ['genres', 'spokenLanguages']), entries: [], tags: [] }); // id TEXT
  for (const e of entries)
    (byTitle.get(e.titleId as string)?.entries as Row[] | undefined)?.push(parse(e, ['languages'])); // clé TEXT
  for (const t of tags) (byTitle.get(t.titleId as string)?.tags as Row[] | undefined)?.push(t); // clé TEXT
  return [...byTitle.values()].sort((a, b) => maxUpdate(b) - maxUpdate(a));
}

function maxUpdate(t: Row): number {
  return Math.max(0, ...(t.entries as Row[]).map((e) => e.updatedAt as number)); // updated_at INTEGER
}

export function titleState(titleId: string): Row | null {
  const title = listLibrary().find((t) => t.id === titleId);
  if (!title) return null;
  const notes = db
    .query(
      `SELECT n.id, n.user_id AS userId, n.kind, n.season, n.episode, n.at_seconds AS atSeconds,
                          n.body, n.language, n.created_at AS createdAt FROM notes n WHERE n.title_id = ?
                          ORDER BY n.season, n.episode, n.at_seconds, n.created_at`,
    )
    .all(titleId);
  const checkpoints = db
    .query(
      `SELECT user_id AS userId, season, episode, at_seconds AS atSeconds, updated_at AS updatedAt
                                FROM checkpoints WHERE title_id = ?`,
    )
    .all(titleId);
  const watched = db
    .query(`SELECT user_id AS userId, season, episode FROM watched_episodes WHERE title_id = ?`)
    .all(titleId);
  return { ...title, notes, checkpoints, watched };
}
