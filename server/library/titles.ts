/** Titres suivis : fiche locale copiée de TMDB à l'ajout, pour lister sans appeler TMDB. */
import { db } from '../core/db';
import { classify, type MediaType } from '../tmdb/kind';
import { TTL, tmdb } from '../tmdb/client';

type Details = {
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  genres?: { id: number; name: string }[];
  original_language?: string;
  spoken_languages?: { iso_639_1: string }[];
};

export async function ensureTitle(mediaType: MediaType, tmdbId: number, userId: number): Promise<string> {
  const id = `${mediaType}:${tmdbId}`;
  if (db.query('SELECT 1 FROM titles WHERE id = ?').get(id)) return id;
  const d = (await tmdb(`/${mediaType}/${tmdbId}`, {}, TTL.details)) as Details; // forme de la fiche TMDB
  const genres = d.genres ?? [];
  const date = d.release_date ?? d.first_air_date ?? '';
  db.query(
    `INSERT INTO titles (id, media_type, tmdb_id, kind, name, poster_path, backdrop_path, year, genres,
            original_language, spoken_languages, created_at, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    id,
    mediaType,
    tmdbId,
    classify(
      mediaType,
      genres.map((g) => g.id),
      d.original_language ?? null,
    ),
    d.title ?? d.name ?? '?',
    d.poster_path ?? null,
    d.backdrop_path ?? null,
    date ? Number(date.slice(0, 4)) : null,
    JSON.stringify(genres),
    d.original_language ?? null,
    JSON.stringify((d.spoken_languages ?? []).map((l) => l.iso_639_1)),
    Date.now(),
    userId,
  );
  return id;
}
