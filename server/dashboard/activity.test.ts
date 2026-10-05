import { expect, test } from 'bun:test';
import { latestActivity, resumeOf, tasteOf, weekStats, type Title } from './activity';

const t = (id: string, entries: Title['entries'], extra: Partial<Title> = {}): Title => ({
  id,
  mediaType: 'tv',
  tmdbId: 1,
  name: id,
  poster: null,
  backdrop: null,
  genres: [{ id: 1, name: 'Drame' }],
  entries,
  ...extra,
});
const e = (userId: number, status: string, updatedAt: number, rating: number | null = null) => ({
  userId,
  status,
  rating,
  languages: [],
  updatedAt,
});

test('reprise : le titre en cours touché le plus récemment', () => {
  const titles = [t('a', [e(1, 'en_cours', 10)]), t('b', [e(1, 'en_cours', 5)])];
  const cps = [{ titleId: 'b', userId: 1, season: 1, episode: 3, atSeconds: 60, at: 50 }];
  expect(resumeOf(1, titles, cps)?.title.id).toBe('b');
  expect(resumeOf(2, titles, cps)).toBeNull();
});

test('activité : l’événement le plus récent gagne', () => {
  const titles = [t('a', [e(2, 'vu', 10)])];
  const eps = [{ titleId: 'a', userId: 2, season: 3, episode: 12, at: 99 }];
  expect(latestActivity(2, titles, eps, [])).toEqual({ titleId: 'a', userId: 2, label: 'S3 É12', at: 99 });
});

test('semaine et goût', () => {
  const now = 10 * 86_400_000;
  const titles = [
    t('m', [e(1, 'vu', now - 1000, 9)], { mediaType: 'movie' }),
    t('x', [e(1, 'vu', now - 1000, 3)], { genres: [{ id: 2, name: 'Horreur' }] }),
  ];
  const eps = [{ titleId: 'a', userId: 1, season: 1, episode: 1, at: now - 5 }];
  expect(weekStats(1, titles, eps, now)).toEqual({ episodes: 1, films: 1 });
  expect(tasteOf(1, titles).genres).toEqual(['Drame']);
});
