import { expect, test } from 'bun:test';
import { affinity, buildProfile, duoProfile, entryWeight, seenTogether } from './profile';

test('poids : note > statut, abandon négatif', () => {
  expect(entryWeight({ status: 'vu', rating: 10, notes: 0 })).toBe(2);
  expect(entryWeight({ status: 'vu', rating: 2, notes: 3 })).toBeLessThan(0);
  expect(entryWeight({ status: 'abandonne', rating: 9, notes: 0 })).toBe(-1.5);
  expect(entryWeight({ status: 'a_voir', rating: null, notes: 0 })).toBe(0.35);
});

test('le profil favorise les traits des titres aimés', () => {
  const p = buildProfile([
    { feats: ['g:1', 'p:9'], weight: 2 },
    { feats: ['g:2'], weight: -1 },
  ]);
  expect(affinity(p, ['p:9']).score).toBeGreaterThan(0);
  expect(affinity(p, ['g:2']).score).toBeLessThan(0);
  expect(affinity(p, ['g:1', 'p:9']).top).toBe('p:9');
});

test('duo : accord récompensé, rejet de l’un prioritaire', () => {
  const a = new Map([
    ['g:1', 1],
    ['g:2', 1],
  ]);
  const b = new Map([
    ['g:1', 1],
    ['g:2', -0.5],
  ]);
  const duo = duoProfile(a, b, new Map());
  expect(duo.get('g:1')).toBeGreaterThan(1);
  expect(duo.get('g:2')).toBe(-0.5);
});

test('vu ensemble : ajouts rapprochés sur un titre vu', () => {
  expect(seenTogether({ addedAt: 0, status: 'vu' }, { addedAt: 5 * 60_000, status: 'vu' })).toBe(true);
  expect(seenTogether({ addedAt: 0, status: 'vu' }, { addedAt: 86_400_000, status: 'vu' })).toBe(false);
  expect(seenTogether({ addedAt: 0, status: 'a_voir' }, { addedAt: 1000, status: 'vu' })).toBe(false);
});
