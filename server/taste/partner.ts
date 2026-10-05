/** Avec qui calculer le duo : la personne demandée, sinon celle avec qui je partage le plus de titres. */
import { listUsers, type User } from '../auth/users';
import { listLibrary } from '../library/queries';

export function partnerOf(me: User, requested: number | null): User | null {
  const others = listUsers().filter((u) => u.id !== me.id);
  const asked = others.find((u) => u.id === requested);
  if (asked) return asked;
  const shared = new Map<number, number>();
  for (const t of listLibrary()) {
    const ids = (t.entries as { userId: number }[]).map((e) => e.userId); // forme listLibrary
    if (!ids.includes(me.id)) continue;
    for (const id of ids) if (id !== me.id) shared.set(id, (shared.get(id) ?? 0) + 1);
  }
  return [...others].sort((a, b) => (shared.get(b.id) ?? 0) - (shared.get(a.id) ?? 0))[0] ?? null;
}
