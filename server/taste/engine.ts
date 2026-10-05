/** Calcul complet des recommandations : traits, modèles, candidats, classement, stockage. */
import { listUsers, type User } from '../auth/users';
import { mapLimit } from '../core/concurrency';
import { log } from '../core/logger';
import { listLibrary, noteCounts } from '../library/queries';
import type { MediaType } from '../tmdb/kind';
import { gather, genreNames, type Genres } from './candidates';
import { received } from '../suggestions/store';
import { duoModel, userModel, type LibTitle, type Model, type Suggested } from './models';
import { rankCandidates, toRec, type Rec } from './rank';
import { duoScope, saveResult } from './store';
import { loadTraits, type Traits } from './traits';

export type Because = { id: string; name: string; items: Rec[] };
export type TasteResult = { forYou: Rec[]; because: Because[]; rated: number };

const REFINE = 40;
const KEEP = 30;
const BECAUSE_ROWS = 2;

async function refine(model: Model, genres: Genres, duo: boolean): Promise<Rec[]> {
  const pool = await gather(model.liked, model.profile, genres);
  const cheap = rankCandidates(pool.values(), model.profile, model.exclude, REFINE);
  await mapLimit(cheap, 4, async (s) => {
    const [type, id] = String(s.c.card.id).split(':');
    const full = await loadTraits(type as MediaType, Number(id)); // identifiant « movie:123 » posé par toCard
    if (full) {
      s.c.feats = full.feats;
      s.c.labels = { ...s.c.labels, ...full.labels };
    }
  });
  return rankCandidates(
    cheap.map((s) => s.c),
    model.profile,
    model.exclude,
    KEEP,
  ).map((s) => toRec(s, duo));
}

/** « Parce que tu as aimé X » : les titres proches de tes deux coups de cœur. */
function because(model: Model): Because[] {
  return [...model.liked]
    .filter((l) => l.weight >= 1.2)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, BECAUSE_ROWS)
    .map((l) => {
      const source = { id: l.traits.id, name: l.traits.name, weight: l.weight };
      const pool = l.traits.recs.map((card) => ({ card, feats: [], labels: {}, support: 1, sources: [source] }));
      const items = rankCandidates(pool, model.profile, model.exclude, 16).map((s) => toRec(s, false));
      return { id: l.traits.id, name: l.traits.name, items };
    })
    .filter((b) => b.items.length >= 3);
}

async function loadAllTraits(
  titles: { id: string; mediaType: string; tmdbId: number }[],
): Promise<Map<string, Traits>> {
  const traits = new Map<string, Traits>();
  await mapLimit(titles, 4, async (t) => {
    const tr = await loadTraits(t.mediaType as MediaType, t.tmdbId); // media_type contraint à movie|tv à l'insertion
    if (tr) traits.set(t.id, tr);
  });
  return traits;
}

/** Suggestions en attente de chaque personne, avec les traits des titres suggérés. */
async function loadSuggested(users: User[]): Promise<Map<number, Suggested[]>> {
  const out = new Map<number, Suggested[]>();
  for (const u of users) {
    const byTitle = new Map<string, number>();
    for (const s of received(u.id)) byTitle.set(s.titleId, (byTitle.get(s.titleId) ?? 0) + 1);
    const list = await mapLimit([...byTitle], 4, async ([id, senders]) => {
      const [type, tmdbId] = id.split(':');
      const traits = await loadTraits(type as MediaType, Number(tmdbId)); // identifiant « movie:123 »
      return traits ? { traits, senders } : null;
    });
    out.set(
      u.id,
      list.filter((x): x is Suggested => x !== null),
    );
  }
  return out;
}

export async function computeAll(): Promise<void> {
  const started = Date.now();
  const users: User[] = listUsers();
  type Row = LibTitle & { mediaType: string; tmdbId: number };
  const library = listLibrary() as unknown as Row[]; // forme de listLibrary
  const [traits, genres] = await Promise.all([loadAllTraits(library), genreNames()]);
  const notes = noteCounts();
  const suggested = await loadSuggested(users);
  const models = users.map((u) => userModel(u, library, traits, notes, suggested.get(u.id)));
  for (const [i, u] of users.entries()) {
    const m = models[i] as Model; // même index que users
    saveResult(`user:${u.id}`, { forYou: await refine(m, genres, false), because: because(m), rated: m.rated });
  }
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      // indices valides par construction des boucles
      const [ua, ub, a, b] = [users[i], users[j], models[i], models[j]] as [User, User, Model, Model];
      const duo = duoModel(a, b, library, traits, [ua, ub]);
      saveResult(duoScope(ua.id, ub.id), { forYou: await refine(duo, genres, true), because: [], rated: duo.rated });
    }
  }
  log.info({ ms: Date.now() - started, titles: library.length, users: users.length }, 'Recommandations recalculées');
}
