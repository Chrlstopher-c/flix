/** Étiquettes libres partagées entre les deux comptes. */
import { db } from '../core/db';

const PALETTE = ['#ff8a5c', '#7cc4ff', '#c79bff', '#7fe0a8', '#ffd166', '#ff6b9a', '#5ce1e6'];

export type Tag = { id: number; name: string; color: string };

export function listTags(): Tag[] {
  return db.query('SELECT id, name, color FROM tags ORDER BY name').all() as Tag[]; // colonnes du SELECT = Tag
}

export function attachTag(titleId: string, name: string): void {
  const count = listTags().length;
  db.query('INSERT OR IGNORE INTO tags (name, color) VALUES (?, ?)').run(
    name,
    PALETTE[count % PALETTE.length] ?? '#fff',
  );
  db.query('INSERT OR IGNORE INTO title_tags (title_id, tag_id) SELECT ?, id FROM tags WHERE name = ?').run(
    titleId,
    name,
  );
}

export function detachTag(titleId: string, tagId: number): void {
  db.query('DELETE FROM title_tags WHERE title_id = ? AND tag_id = ?').run(titleId, tagId);
  db.query('DELETE FROM tags WHERE id = ? AND NOT EXISTS (SELECT 1 FROM title_tags WHERE tag_id = ?)').run(
    tagId,
    tagId,
  );
}
