/** Classement des candidats : proximité au profil, soutien des titres aimés, diversité, raison affichée. */
import type { Raw } from '../tmdb/cards';
import type { Candidate } from './candidates';
import { affinity, type Profile } from './profile';

export type Scored = { c: Candidate; score: number; top: string | null; why: string | null };
export type Rec = Raw & { reason: string };

const SAME_REASON_CAP = 3;
const SAME_SOURCE_CAP = 4;
/** Ordre de préférence des traits pour expliquer une recommandation : une personne parle plus qu'une langue. */
const WHY_ORDER = ['p:', 'g:', 'k:'];

function explain(profile: Profile, feats: string[]): string | null {
  for (const prefix of WHY_ORDER) {
    const best = feats
      .filter((f) => f.startsWith(prefix) && (profile.get(f) ?? 0) > 0)
      .sort((a, b) => (profile.get(b) ?? 0) - (profile.get(a) ?? 0))[0];
    if (best) return best;
  }
  return null;
}

function mainSource(c: Candidate): string {
  return [...c.sources].sort((a, b) => b.weight - a.weight)[0]?.id ?? 'none';
}

function diversify(scored: Scored[]): void {
  const reasons = new Map<string, number>();
  const sources = new Map<string, number>();
  for (const s of scored) {
    const r = s.top ?? 'none';
    const src = mainSource(s.c);
    if ((reasons.get(r) ?? 0) >= SAME_REASON_CAP) s.score *= 0.8;
    if (src !== 'none' && (sources.get(src) ?? 0) >= SAME_SOURCE_CAP) s.score *= 0.7;
    reasons.set(r, (reasons.get(r) ?? 0) + 1);
    sources.set(src, (sources.get(src) ?? 0) + 1);
  }
}

export function rankCandidates(
  pool: Iterable<Candidate>,
  profile: Profile,
  exclude: Set<string>,
  limit: number,
): Scored[] {
  const scored: Scored[] = [];
  for (const c of pool) {
    if (exclude.has(String(c.card.id))) continue;
    const { score, top } = affinity(profile, c.feats);
    const vote = typeof c.card.vote === 'number' ? c.card.vote : 0;
    const why = explain(profile, c.feats);
    scored.push({ c, top, why, score: score + 0.45 * Math.log1p(c.support) + 0.1 * (vote / 10) });
  }
  scored.sort((a, b) => b.score - a.score);
  diversify(scored);
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function reasonFor(s: Scored, duo: boolean): string {
  const parts: string[] = [];
  const src = [...s.c.sources].sort((a, b) => b.weight - a.weight)[0];
  if (src && duo)
    parts.push(
      src.by ? `${src.by} ${src.by.includes(' et ') ? 'ont' : 'a'} aimé ${src.name}` : `Vous avez aimé ${src.name}`,
    );
  else if (src) parts.push(`Parce que tu as aimé ${src.name}`);
  const label = s.why ? s.c.labels[s.why] : undefined;
  if (label) parts.push(label);
  return parts.join(' · ') || (duo ? 'Dans vos genres communs' : 'Populaire dans tes genres');
}

export function toRec(s: Scored, duo: boolean): Rec {
  return { ...s.c.card, reason: reasonFor(s, duo) };
}
