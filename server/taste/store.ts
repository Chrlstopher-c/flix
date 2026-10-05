/** Résultats de recommandation calculés à l'avance, lus instantanément par l'accueil. */
import { db } from '../core/db';

/** Portée de stockage d'un duo : même clé quel que soit l'ordre des deux personnes. */
export function duoScope(a: number, b: number): string {
  return `duo:${Math.min(a, b)}-${Math.max(a, b)}`;
}

export function saveResult(scope: string, body: unknown): void {
  db.query('INSERT OR REPLACE INTO taste_results (scope, body, computed_at) VALUES (?, ?, ?)').run(
    scope,
    JSON.stringify(body),
    Date.now(),
  );
}

export function readResult<T>(scope: string): { body: T; computedAt: number } | null {
  const row = db.query('SELECT body, computed_at FROM taste_results WHERE scope = ?').get(scope) as {
    body: string;
    computed_at: number;
  } | null; // colonnes du SELECT
  return row ? { body: JSON.parse(row.body) as T, computedAt: row.computed_at } : null; // écrit par saveResult
}
