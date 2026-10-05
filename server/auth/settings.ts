/** Réglages du compte : renommer, changer de mot de passe. */
import { db } from '../core/db';

/** Règle unique pour un nom d'utilisateur : 2 à 32 caractères, pas déjà pris (hors soi-même). */
export function nameError(name: string, selfId = 0): string | null {
  if (name.length < 2 || name.length > 32) return 'Le nom doit faire entre 2 et 32 caractères';
  if (db.query('SELECT 1 FROM users WHERE name = ? AND id != ?').get(name, selfId)) return 'Ce nom est déjà pris';
  return null;
}

/** Règle unique pour un nouveau mot de passe et sa confirmation. */
export function passwordError(next: string, confirm: string): string | null {
  if (next.length < 6) return 'Le mot de passe doit faire au moins 6 caractères';
  if (next !== confirm) return 'Les deux mots de passe ne correspondent pas';
  return null;
}

export function rename(userId: number, name: string): string | null {
  const error = nameError(name, userId);
  if (error) return error;
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
  const error = passwordError(next, confirm);
  if (error) return error;
  db.query('UPDATE users SET password_hash = ? WHERE id = ?').run(await Bun.password.hash(next), userId);
  return null;
}
