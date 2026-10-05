/** Traits d'un titre pour les goûts : genres, mots-clés, personnes, langue, époque, type — avec leur libellé. */
import { log } from '../core/logger';
import { toCard, type Raw } from '../tmdb/cards';
import { fullDetails } from '../tmdb/details';
import { classify, type MediaType } from '../tmdb/kind';

export type Traits = { id: string; name: string; feats: string[]; labels: Record<string, string>; recs: Raw[] };

type Named = { id: number; name: string };
type Person = Named & { job?: string; order?: number };
type Details = {
  title?: string;
  name?: string;
  genres?: Named[];
  original_language?: string;
  release_date?: string;
  first_air_date?: string;
  created_by?: Named[];
  keywords?: { keywords?: Named[]; results?: Named[] };
  credits?: { cast?: Person[]; crew?: Person[] };
  recommendations?: { results?: Raw[] };
};

const TOP_CAST = 5;
const TOP_KEYWORDS = 12;
const KIND_LABEL = { film: 'Un film', serie: 'Une série', anime: 'Un animé' } as const;
const LANGS = new Intl.DisplayNames(['fr'], { type: 'language' });

function langLabel(code: string): string {
  try {
    return `En ${LANGS.of(code) ?? code}`;
  } catch {
    return `En ${code}`;
  }
}

/** Traits communs, calculables depuis un simple résultat de liste TMDB. */
export function baseTraits(
  type: MediaType,
  genres: Named[],
  lang: string | null,
  date: string,
): [string[], Record<string, string>] {
  const kind = classify(
    type,
    genres.map((g) => g.id),
    lang,
  );
  const labels: Record<string, string> = { [`kind:${kind}`]: KIND_LABEL[kind] };
  for (const g of genres) labels[`g:${g.id}`] = g.name;
  if (lang) labels[`l:${lang}`] = langLabel(lang);
  const year = Number(date.slice(0, 4));
  if (year) labels[`d:${Math.floor(year / 10) * 10}`] = `Années ${String(Math.floor(year / 10) * 10).slice(2)}`;
  return [Object.keys(labels), labels];
}

/** Traits complets à partir de la fiche détaillée (mots-clés, distribution, réalisation). */
export function traitsOf(type: MediaType, tmdbId: number, d: Details): Traits {
  const [feats, labels] = baseTraits(
    type,
    d.genres ?? [],
    d.original_language ?? null,
    d.release_date ?? d.first_air_date ?? '',
  );
  const add = (key: string, label: string): void => {
    if (!labels[key]) {
      labels[key] = label;
      feats.push(key);
    }
  };
  for (const k of (d.keywords?.keywords ?? d.keywords?.results ?? []).slice(0, TOP_KEYWORDS))
    add(`k:${k.id}`, `Thème « ${k.name} »`);
  for (const c of (d.credits?.cast ?? []).slice(0, TOP_CAST)) add(`p:${c.id}`, `Avec ${c.name}`);
  for (const c of (d.credits?.crew ?? []).filter((x) => x.job === 'Director'))
    add(`p:${c.id}`, `Réalisé par ${c.name}`);
  for (const c of d.created_by ?? []) add(`p:${c.id}`, `Créé par ${c.name}`);
  const recs = (d.recommendations?.results ?? []).map((r) => toCard(r, type)).filter((c): c is Raw => c !== null);
  return { id: `${type}:${tmdbId}`, name: d.title ?? d.name ?? '?', feats, labels, recs };
}

export async function loadTraits(type: MediaType, tmdbId: number): Promise<Traits | null> {
  try {
    return traitsOf(type, tmdbId, (await fullDetails(type, tmdbId)) as Details); // forme de la fiche TMDB
  } catch (err) {
    log.warn({ err, type, tmdbId }, 'Traits indisponibles');
    return null;
  }
}
