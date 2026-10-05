/** Formes partagées des données renvoyées par l'API. */
export type { Kind, MediaType } from '../../../common/kind';
import type { Kind, MediaType } from '../../../common/kind';
export type Status = 'a_voir' | 'en_cours' | 'vu' | 'abandonne';

export type User = { id: number; name: string; color: string };

export type Card = {
  id: string;
  mediaType: MediaType;
  tmdbId: number;
  kind: Kind;
  name: string;
  poster: string | null;
  backdrop: string | null;
  year: number | null;
  vote: number | null;
  language: string | null;
  overview: string;
};

export type Entry = {
  userId: number;
  status: Status;
  rating: number | null;
  languages: string[];
  addedAt: number;
  updatedAt: number;
};

export type Tag = { id: number; name: string; color: string };

export type LibraryTitle = {
  id: string;
  mediaType: MediaType;
  tmdbId: number;
  kind: Kind;
  name: string;
  poster: string | null;
  backdrop: string | null;
  year: number | null;
  genres: { id: number; name: string }[];
  language: string | null;
  spokenLanguages: string[];
  createdAt: number;
  entries: Entry[];
  tags: Tag[];
};

export type Note = {
  id: number;
  userId: number;
  kind: 'avis' | 'moment';
  season: number | null;
  episode: number | null;
  atSeconds: number | null;
  body: string;
  language: string | null;
  createdAt: number;
};

export type Checkpoint = {
  userId: number;
  season: number | null;
  episode: number | null;
  atSeconds: number | null;
  updatedAt: number;
};

export type TitleState = LibraryTitle & {
  notes: Note[];
  checkpoints: Checkpoint[];
  watched: { userId: number; season: number; episode: number }[];
};

export type Person = { id: number; name: string; profile_path: string | null; character?: string; job?: string };

export type Rec = Card & { reason: string };

export type TasteHome = {
  forYou: Rec[]; duo: Rec[]; because: { id: string; name: string; items: Rec[] }[];
  rated: number; needsOnboarding: boolean; computing: boolean; computedAt: number | null; partnerId: number | null;
};

export type Suggestion = {
  id: number; titleId: string; card: Card; fromUser: number; toUser: number; message: string | null;
  status: 'pending' | 'accepted' | 'dismissed'; createdAt: number;
};
