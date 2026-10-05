/** Connexion SQLite et schéma. */
import { Database } from 'bun:sqlite';
import { existsSync, mkdirSync, renameSync } from 'node:fs';
import { ENV } from './env';

mkdirSync(ENV.dataDir, { recursive: true });

const DB_PATH = `${ENV.dataDir}/flix.db`;

/** Ancien nom de l'app (FluxTube) : la base est renommée une fois, avec ses fichiers WAL. */
function renameLegacyDb(): void {
  const legacy = `${ENV.dataDir}/fluxtube.db`;
  if (!existsSync(legacy) || existsSync(DB_PATH)) return;
  for (const ext of ['', '-wal', '-shm']) if (existsSync(legacy + ext)) renameSync(legacy + ext, DB_PATH + ext);
}

renameLegacyDb();
export const db = new Database(DB_PATH, { create: true, strict: true });
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA synchronous = NORMAL;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, color TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS tmdb_cache (key TEXT PRIMARY KEY, body TEXT NOT NULL, fetched_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS titles (
  id TEXT PRIMARY KEY, media_type TEXT NOT NULL, tmdb_id INTEGER NOT NULL, kind TEXT NOT NULL,
  name TEXT NOT NULL, poster_path TEXT, backdrop_path TEXT, year INTEGER,
  genres TEXT NOT NULL DEFAULT '[]', original_language TEXT, spoken_languages TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL, created_by INTEGER REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS title_users (
  title_id TEXT NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'a_voir', rating REAL, languages TEXT NOT NULL DEFAULT '[]',
  added_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  PRIMARY KEY (title_id, user_id)
);
CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, color TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS title_tags (
  title_id TEXT NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (title_id, tag_id)
);
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY, title_id TEXT NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, season INTEGER, episode INTEGER, at_seconds INTEGER,
  body TEXT NOT NULL, language TEXT, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS checkpoints (
  title_id TEXT NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  season INTEGER, episode INTEGER, at_seconds INTEGER, updated_at INTEGER NOT NULL,
  PRIMARY KEY (title_id, user_id)
);
CREATE TABLE IF NOT EXISTS watched_episodes (
  title_id TEXT NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  season INTEGER NOT NULL, episode INTEGER NOT NULL, watched_at INTEGER NOT NULL,
  PRIMARY KEY (title_id, user_id, season, episode)
);
CREATE INDEX IF NOT EXISTS notes_title ON notes(title_id);
CREATE TABLE IF NOT EXISTS mcp_tokens (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, token_hash TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL, last_used_at INTEGER
);
CREATE TABLE IF NOT EXISTS taste_results (scope TEXT PRIMARY KEY, body TEXT NOT NULL, computed_at INTEGER NOT NULL);
`);
