/** Profils de goût : poids d'un suivi, profil d'une personne, profil du duo, proximité d'un titre. */
export type Profile = Map<string, number>;
export type EntrySignal = { status: string; rating: number | null; notes: number };
export type Signal = { feats: string[]; weight: number };

const SCALE: Record<string, number> = { g: 0.6, k: 1, p: 1.2, l: 0.5, d: 0.3, kind: 0.5 };
const STATUS_WEIGHT: Record<string, number> = { a_voir: 0.35, en_cours: 0.8, vu: 1, abandonne: -1.5 };

/** Ce qu'un suivi dit du goût : une note prime sur le statut, un abandon est un rejet. */
export function entryWeight(e: EntrySignal): number {
  if (e.status === 'abandonne') return STATUS_WEIGHT.abandonne ?? -1.5;
  const base = e.rating !== null && e.status !== 'a_voir' ? (e.rating - 5) / 2.5 : (STATUS_WEIGHT[e.status] ?? 0);
  return base >= 0 ? base + Math.min(e.notes, 5) * 0.1 : base;
}

function scaleOf(feat: string): number {
  return SCALE[feat.slice(0, feat.indexOf(':'))] ?? 0.5;
}

export function buildProfile(signals: Signal[]): Profile {
  const profile: Profile = new Map();
  for (const s of signals) {
    const norm = s.weight / Math.sqrt(Math.max(1, s.feats.length));
    for (const f of s.feats) profile.set(f, (profile.get(f) ?? 0) + norm * scaleOf(f));
  }
  return profile;
}

/** Groupe (2 personnes ou plus) : ce qui plaît à tous monte, un fort désaccord descend, un seul rejet l'emporte. */
export function groupProfile(profiles: Profile[], together: Profile): Profile {
  const out: Profile = new Map();
  const keys = new Set([...profiles.flatMap((p) => [...p.keys()]), ...together.keys()]);
  for (const f of keys) {
    const vals = profiles.map((p) => p.get(f) ?? 0);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const mean = vals.reduce((x, y) => x + y, 0) / vals.length;
    const base = min < 0 ? min : mean - 0.5 * (max - min) + 0.25 * min;
    out.set(f, base + 0.5 * (together.get(f) ?? 0));
  }
  return out;
}

/** Duo = groupe de deux. */
export function duoProfile(a: Profile, b: Profile, together: Profile): Profile {
  return groupProfile([a, b], together);
}

/** Proximité d'un titre avec un profil, et le trait qui y contribue le plus. */
export function affinity(profile: Profile, feats: string[]): { score: number; top: string | null } {
  let score = 0;
  let top: string | null = null;
  let best = 0;
  for (const f of feats) {
    const v = profile.get(f) ?? 0;
    score += v;
    if (v > best && !f.startsWith('kind:')) {
      best = v;
      top = f;
    }
  }
  return { score: score / Math.sqrt(Math.max(1, feats.length)), top };
}

/** Deux ajouts à quelques minutes d'écart sur un titre vu = vu ensemble. */
export const TOGETHER_WINDOW_MS = 15 * 60_000;

export function seenTogether(
  a: { addedAt: number; status: string },
  b: { addedAt: number; status: string },
): boolean {
  const seen = (s: string): boolean => s === 'vu' || s === 'en_cours';
  return seen(a.status) && seen(b.status) && Math.abs(a.addedAt - b.addedAt) <= TOGETHER_WINDOW_MS;
}
