import { expect, test } from 'bun:test';
import type { LibraryTitle } from '../shared/types';
import { applyFilters, DEFAULT_FILTERS, titleLanguages } from './filters';

const base: LibraryTitle = {
  id: 'tv:1',
  mediaType: 'tv',
  tmdbId: 1,
  kind: 'anime',
  name: 'B',
  poster: null,
  backdrop: null,
  year: 2020,
  genres: [],
  language: 'ja',
  spokenLanguages: ['ja'],
  createdAt: 0,
  tags: [],
  entries: [{ userId: 1, status: 'vu', rating: 8, languages: ['audio:fr'], addedAt: 0, updatedAt: 1 }],
};
const other: LibraryTitle = {
  ...base,
  id: 'movie:2',
  mediaType: 'movie',
  kind: 'film',
  name: 'A',
  language: 'en',
  spokenLanguages: ['en', 'it'],
  entries: [{ ...base.entries[0]!, userId: 2, status: 'a_voir', languages: [] }],
};

test('filtre par personne et statut', () => {
  expect(applyFilters([base, other], { ...DEFAULT_FILTERS, who: 'me' }, 1).map((t) => t.id)).toEqual(['tv:1']);
  expect(applyFilters([base, other], { ...DEFAULT_FILTERS, status: 'a_voir' }, 1).map((t) => t.id)).toEqual([
    'movie:2',
  ]);
});

test('les langues incluent celles de visionnage', () => {
  expect(titleLanguages(base)).toEqual(['ja', 'fr']);
  expect(applyFilters([base, other], { ...DEFAULT_FILTERS, lang: 'it' }, 1).map((t) => t.id)).toEqual(['movie:2']);
});

test('tri par nom', () => {
  expect(applyFilters([base, other], { ...DEFAULT_FILTERS, sort: 'name' }, 1).map((t) => t.name)).toEqual(['A', 'B']);
});
