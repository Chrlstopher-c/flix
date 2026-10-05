/** Où chacun en est : point d'arrêt et épisodes cochés. */
import { db } from '../core/db';

export function setCheckpoint(
  titleId: string,
  userId: number,
  season: number | null,
  episode: number | null,
  atSeconds: number | null,
): void {
  db.query(
    `INSERT INTO checkpoints (title_id, user_id, season, episode, at_seconds, updated_at) VALUES (?,?,?,?,?,?)
            ON CONFLICT (title_id, user_id) DO UPDATE SET season = excluded.season, episode = excluded.episode,
            at_seconds = excluded.at_seconds, updated_at = excluded.updated_at`,
  ).run(titleId, userId, season, episode, atSeconds, Date.now());
}

/** Coche ou décoche un épisode ; « jusqu'ici » coche aussi tous les précédents de la saison. */
export function markEpisode(
  titleId: string,
  userId: number,
  season: number,
  episode: number,
  watched: boolean,
  upTo: boolean,
): void {
  if (!watched) {
    db.query('DELETE FROM watched_episodes WHERE title_id = ? AND user_id = ? AND season = ? AND episode = ?').run(
      titleId,
      userId,
      season,
      episode,
    );
    return;
  }
  const insert = db.query(`INSERT OR IGNORE INTO watched_episodes (title_id, user_id, season, episode, watched_at)
                           VALUES (?,?,?,?,?)`);
  const now = Date.now();
  db.transaction(() => {
    for (let e = upTo ? 1 : episode; e <= episode; e++) insert.run(titleId, userId, season, e, now);
  })();
  setCheckpoint(titleId, userId, season, episode, null);
}

export type EpisodeEvent = { titleId: string; userId: number; season: number; episode: number; at: number };
export type CheckpointRow = {
  titleId: string;
  userId: number;
  season: number | null;
  episode: number | null;
  atSeconds: number | null;
  at: number;
};

/** Épisodes cochés depuis une date, du plus récent au plus ancien. */
export function episodesSince(since: number): EpisodeEvent[] {
  return db
    .query(
      `SELECT title_id AS titleId, user_id AS userId, season, episode, watched_at AS at
                   FROM watched_episodes WHERE watched_at > ? ORDER BY watched_at DESC`,
    )
    .all(since) as EpisodeEvent[]; // SELECT explicite
}

export function allCheckpoints(): CheckpointRow[] {
  return db
    .query(
      `SELECT title_id AS titleId, user_id AS userId, season, episode, at_seconds AS atSeconds,
                   updated_at AS at FROM checkpoints ORDER BY updated_at DESC`,
    )
    .all() as CheckpointRow[]; // SELECT explicite
}
