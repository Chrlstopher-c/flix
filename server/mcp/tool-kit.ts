/** Briques communes des outils MCP : définition, arguments, identifiant de titre. */
import type { User } from '../auth/users';
import type { MediaType } from '../tmdb/kind';

export type Args = Record<string, unknown>;
export type Tool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  write?: boolean;
  run: (args: Args, user: User) => Promise<unknown>;
};

export class ToolError extends Error {}

export const TITLE_PROPS = {
  media_type: { type: 'string', enum: ['movie', 'tv'], description: 'movie = film, tv = série ou animé' },
  tmdb_id: { type: 'integer', description: 'Identifiant TMDB (donné par search_titles)' },
};

export function schema(props: Record<string, unknown>, required: string[] = []): Record<string, unknown> {
  return { type: 'object', properties: props, required, additionalProperties: false };
}

export function titleOf(a: Args): { mediaType: MediaType; tmdbId: number; id: string } {
  const mediaType = a.media_type === 'movie' || a.media_type === 'tv' ? a.media_type : null;
  const tmdbId = typeof a.tmdb_id === 'number' && Number.isInteger(a.tmdb_id) ? a.tmdb_id : null;
  if (!mediaType || !tmdbId) throw new ToolError('media_type (movie|tv) et tmdb_id entier sont requis');
  return { mediaType, tmdbId, id: `${mediaType}:${tmdbId}` };
}

export function int(a: Args, key: string): number | null {
  const v = a[key];
  return typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null;
}

export function text(a: Args, key: string): string | null {
  const v = a[key];
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}
