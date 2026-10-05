/** Réglages du compte : renommer, changer de mot de passe. */
import { db } from '../core/db';

export function rename(userId: number, name: string): string | null {
  if (name.length < 2 || name.length > 32) return 'Le nom doit faire entre 2 et 32 caractères';
  const taken = db.query('SELECT 1 FROM users WHERE name = ? AND id != ?').get(name, userId);
  if (taken) return 'Ce nom est déjà pris';
  db.query('UPDATE users SET name = ? WHERE id = ?').run(name, userId);
  return null;
}

export async function changePassword(
  userId: number,
  current: string,
  next: string,
  confirm: string,
): Promise<string | null> {
  const row = db.query('SELECT password_hash FROM users WHERE id = ?').get(userId) as {
    password_hash: string;
  } | null; // colonne du SELECT
  if (!row || !(await Bun.password.verify(current, row.password_hash))) return 'Mot de passe actuel incorrect';
  if (next.length < 6) return 'Le nouveau mot de passe doit faire au moins 6 caractères';
  if (next !== confirm) return 'Les deux nouveaux mots de passe ne correspondent pas';
  db.query('UPDATE users SET password_hash = ? WHERE id = ?').run(await Bun.password.hash(next), userId);
  return null;
}
