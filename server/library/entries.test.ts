import { beforeAll, expect, test } from 'bun:test';

process.env.TMDB_API_KEY ??= 'test';
process.env.DATA_DIR = `${process.env.TMPDIR ?? '/tmp'}/fluxtube-test-${process.pid}`;

let mod: typeof import('./entries');
let db: typeof import('../core/db').db;

beforeAll(async () => {
  db = (await import('../core/db')).db;
  mod = await import('./entries');
  db.query("INSERT INTO users (id, name, password_hash, color) VALUES (1, 'a', 'x', '#fff')").run();
  db.query(
    'INSERT INTO titles (id, media_type, tmdb_id, kind, name, created_at) ' +
      "VALUES ('movie:1', 'movie', 1, 'film', 'T', 0)",
  ).run();
});

test('changer la note ne touche pas au statut', () => {
  mod.join('movie:1', 1, 'vu');
  mod.joinIfMissing('movie:1', 1);
  mod.updateEntry('movie:1', 1, { rating: 7 });
  expect(db.query('SELECT status, rating FROM title_users').get()).toEqual({ status: 'vu', rating: 7 });
});

test('nouveau suivi : langue originale en audio par défaut', () => {
  db.query(
    "INSERT INTO titles (id, media_type, tmdb_id, kind, name, original_language, created_at) " +
      "VALUES ('movie:2', 'movie', 2, 'film', 'F', 'fr', 0)",
  ).run();
  mod.join('movie:2', 1, 'vu');
  expect(db.query("SELECT languages FROM title_users WHERE title_id = 'movie:2'").get()).toEqual({
    languages: '["audio:fr"]',
  });
});

test('migration : seuls les suivis sans version sont complétés, une seule fois', () => {
  db.query("UPDATE title_users SET languages = '[]' WHERE title_id = 'movie:2'").run();
  expect(mod.migrateDefaultLanguages()).toBe(1);
  db.query("UPDATE title_users SET languages = '[]' WHERE title_id = 'movie:2'").run();
  expect(mod.migrateDefaultLanguages()).toBe(0);
});

test('quitter le dernier supprime le titre', () => {
  mod.leave('movie:1', 1);
  expect(db.query("SELECT COUNT(*) AS n FROM titles WHERE id = 'movie:1'").get()).toEqual({ n: 0 });
});
