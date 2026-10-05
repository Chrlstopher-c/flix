/** Sous-ensemble de la fiche TMDB réellement utilisé par la page titre. */
import type { Person } from '../shared/types';

type Named = { id: number; name: string };

export type Translation = {
  iso_639_1: string;
  iso_3166_1: string;
  english_name: string;
  data: { title?: string; name?: string; overview?: string };
};

export type SeasonSummary = {
  season_number: number;
  name: string;
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
};

export type Details = {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  tagline?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  genres: Named[];
  vote_average: number;
  vote_count: number;
  original_language: string;
  status?: string;
  spoken_languages: { iso_639_1: string; name: string }[];
  origin_country?: string[];
  production_countries?: { iso_3166_1: string; name: string }[];
  seasons?: SeasonSummary[];
  created_by?: Named[];
  networks?: Named[];
  credits?: { cast: Person[]; crew: Person[] };
  aggregate_credits?: {
    cast: (Person & { roles: { character: string; episode_count: number }[]; total_episode_count: number })[];
  };
  translations?: { translations: Translation[] };
  recommendations?: { results: Record<string, unknown>[] };
  videos?: { results: { key: string; site: string; type: string; name: string; iso_639_1: string }[] };
  'watch/providers'?: {
    results: Record<string, { flatrate?: { provider_name: string; logo_path: string }[]; link?: string }>;
  };
  keywords?: { keywords?: Named[]; results?: Named[] };
};

export type Episode = {
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string | null;
  runtime: number | null;
  vote_average: number;
};

export type Season = { season_number: number; name: string; overview: string; episodes: Episode[] };
