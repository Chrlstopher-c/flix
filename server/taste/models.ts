/** Modèles de goût construits depuis la bibliothèque : un par personne, et celui du duo. */
import type { User } from '../auth/users';
import { buildProfile, entryWeight, groupProfile, seenTogether, type Profile } from './profile';
import type { Liked } from './candidates';
import type { Traits } from './traits';

export type LibEntry = { userId: number; status: string; rating: number | null; addedAt: number };
export type LibTitle = { id: string; entries: LibEntry[] };
export type Model = { liked: Liked[]; profile: Profile; exclude: Set<string>; rated: number };

/** Titres suggérés par d'autres : léger signal positif, et exclus des recommandations (ils ont leur propre rangée). */
export type Suggested = { traits: Traits; senders: number };

export function userModel(
  user: User,
  titles: LibTitle[],
  traits: Map<string, Traits>,
  notes: Map<string, number>,
  suggested: Suggested[] = [],
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
  for (const sg of suggested) {
    if (exclude.has(sg.traits.id)) continue;
    exclude.add(sg.traits.id);
    liked.push({ traits: sg.traits, weight: Math.min(0.8, 0.4 * sg.senders) });
  }
  return {
    liked,
    exclude,
    rated,
    profile: buildProfile(liked.map((l) => ({ feats: l.traits.feats, weight: l.weight }))),
  };
}

/** Titres vus ensemble par au moins deux membres du groupe (ajouts rapprochés). */
function togetherProfile(
  titles: LibTitle[],
  traits: Map<string, Traits>,
  ids: number[],
): ReturnType<typeof buildProfile> {
  const together = titles.filter((t) => {
    const es = ids.map((id) => t.entries.find((e) => e.userId === id)).filter((e) => e !== undefined);
    return es.some((a, i) => es.slice(i + 1).some((b) => seenTogether(a, b)));
  });
  return buildProfile(
    together.flatMap((t) => {
      const tr = traits.get(t.id);
      return tr ? [{ feats: tr.feats, weight: 1 }] : [];
    }),
  );
}

/** Titres aimés par les membres : partagés = poids du moins convaincu + bonus ; isolés = atténués et attribués. */
function mergeLiked(models: Model[], users: User[]): Liked[] {
  const byId = new Map<string, { traits: Traits; weights: number[]; names: string[] }>();
  models.forEach((m, i) => {
    for (const l of m.liked) {
      const cur = byId.get(l.traits.id) ?? { traits: l.traits, weights: [], names: [] };
      cur.weights.push(l.weight);
      cur.names.push(users[i]?.name ?? '?');
      byId.set(l.traits.id, cur);
    }
  });
  return [...byId.values()].map(({ traits, weights, names }) => {
    const all = names.length === models.length;
    const weight = names.length > 1 ? Math.min(...weights) + 0.3 * (names.length - 1) : (weights[0] ?? 0) * 0.6;
    return { traits, weight, by: all ? undefined : names.join(' et ') };
  });
}

export function groupModel(models: Model[], titles: LibTitle[], traits: Map<string, Traits>, users: User[]): Model {
  return {
    liked: mergeLiked(models, users),
    profile: groupProfile(
      models.map((m) => m.profile),
      togetherProfile(
        titles,
        traits,
        users.map((u) => u.id),
      ),
    ),
    exclude: new Set(models.flatMap((m) => [...m.exclude])),
    rated: Math.min(...models.map((m) => m.rated)),
  };
}

export function duoModel(
  a: Model,
  b: Model,
  titles: LibTitle[],
  traits: Map<string, Traits>,
  users: [User, User],
): Model {
  return groupModel([a, b], titles, traits, users);
}
