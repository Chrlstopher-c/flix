/** Modèles de goût construits depuis la bibliothèque : un par personne, et celui du duo. */
import type { User } from '../auth/users';
import { buildProfile, duoProfile, entryWeight, seenTogether, type Profile } from './profile';
import type { Liked } from './candidates';
import type { Traits } from './traits';

export type LibEntry = { userId: number; status: string; rating: number | null; addedAt: number };
export type LibTitle = { id: string; entries: LibEntry[] };
export type Model = { liked: Liked[]; profile: Profile; exclude: Set<string>; rated: number };

export function userModel(
  user: User,
  titles: LibTitle[],
  traits: Map<string, Traits>,
  notes: Map<string, number>,
): Model {
  const liked: Liked[] = [];
  const exclude = new Set<string>();
  let rated = 0;
  for (const t of titles) {
    const e = t.entries.find((x) => x.userId === user.id);
    const tr = traits.get(t.id);
    if (!e) continue;
    exclude.add(t.id);
    if (e.status === 'vu' || e.status === 'abandonne' || e.rating !== null) rated++;
    if (tr) liked.push({ traits: tr, weight: entryWeight({ ...e, notes: notes.get(`${t.id}|${user.id}`) ?? 0 }) });
  }
  return {
    liked,
    exclude,
    rated,
    profile: buildProfile(liked.map((l) => ({ feats: l.traits.feats, weight: l.weight }))),
  };
}

export function duoModel(
  a: Model,
  b: Model,
  titles: LibTitle[],
  traits: Map<string, Traits>,
  users: [User, User],
): Model {
  const ids = users.map((u) => u.id);
  const together = titles.filter((t) => {
    const [ea, eb] = ids.map((id) => t.entries.find((e) => e.userId === id));
    return ea && eb && seenTogether(ea, eb);
  });
  const togetherProfile = buildProfile(
    together.flatMap((t) => {
      const tr = traits.get(t.id);
      return tr ? [{ feats: tr.feats, weight: 1 }] : [];
    }),
  );
  const byId = new Map<string, Liked>();
  for (const [i, m] of [a, b].entries()) {
    for (const l of m.liked) {
      const cur = byId.get(l.traits.id);
      byId.set(
        l.traits.id,
        cur
          ? { traits: l.traits, weight: Math.min(cur.weight, l.weight) + 0.3 }
          : { traits: l.traits, weight: l.weight * 0.6, by: users[i]?.name },
      );
    }
  }
  return {
    liked: [...byId.values()],
    profile: duoProfile(a.profile, b.profile, togetherProfile),
    exclude: new Set([...a.exclude, ...b.exclude]),
    rated: Math.min(a.rated, b.rated),
  };
}
