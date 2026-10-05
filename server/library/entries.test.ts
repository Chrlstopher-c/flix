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
    "INSERT INTO titles (id, media_type, tmdb_id, kind, name, created_at) " +
      "VALUES ('movie:1', 'movie', 1, 'film', 'T', 0)",
  ).run();
});

test('changer la note ne touche pas au statut', () => {
  mod.join('movie:1', 1, 'vu');
  mod.joinIfMissing('movie:1', 1);
  mod.updateEntry('movie:1', 1, { rating: 7 });
  expect(db.query('SELECT status, rating FROM title_users').get()).toEqual({ status: 'vu', rating: 7 });
});

test('quitter le dernier supprime le titre', () => {
  mod.leave('movie:1', 1);
  expect(db.query('SELECT COUNT(*) AS n FROM titles').get()).toEqual({ n: 0 });
});
