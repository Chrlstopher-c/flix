import { expect, test } from 'bun:test';
import type { Candidate } from './candidates';
import { rankCandidates, reasonFor } from './rank';

const cand = (id: string, feats: string[], sources: Candidate['sources'] = []): Candidate => ({
  card: { id, vote: 7 },
  feats,
  labels: { 'p:1': 'Réalisé par X', 'g:1': 'Drame' },
  support: sources.length,
  sources,
});

test('exclut les titres déjà suivis et classe par proximité', () => {
  const profile = new Map([
    ['p:1', 2],
    ['g:2', -1],
  ]);
  const out = rankCandidates(
    [cand('a', ['g:2']), cand('b', ['p:1']), cand('c', ['p:1'])],
    profile,
    new Set(['c']),
    10,
  );
  expect(out.map((s) => s.c.card.id)).toEqual(['b', 'a']);
  expect(out[0]?.why).toBe('p:1');
});

test('la raison cite le titre source et le trait dominant', () => {
  const [s] = rankCandidates(
    [cand('a', ['p:1'], [{ id: 'movie:1', name: 'Inception', weight: 2 }])],
    new Map([['p:1', 1]]),
    new Set(),
    1,
  );
  expect(reasonFor(s!, false)).toBe('Parce que tu as aimé Inception · Réalisé par X');
  expect(reasonFor(s!, true)).toBe('Vous avez aimé Inception · Réalisé par X');
  s!.c.sources[0]!.by = 'Mathéo';
  expect(reasonFor(s!, true)).toBe('Mathéo a aimé Inception · Réalisé par X');
});
