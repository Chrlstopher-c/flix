import { expect, test } from 'bun:test';
import { duoModel, userModel, type LibTitle } from './models';
import type { Traits } from './traits';

const tr = (id: string, feats: string[]): Traits => ({ id, name: id, feats, labels: {}, recs: [] });
const users = [
  { id: 1, name: 'Chris', color: '' },
  { id: 2, name: 'Mathéo', color: '' },
] as const;
const titles: LibTitle[] = [
  {
    id: 'a',
    entries: [
      { userId: 1, status: 'vu', rating: 9, addedAt: 0 },
      { userId: 2, status: 'vu', rating: 8, addedAt: 60_000 },
    ],
  },
  { id: 'b', entries: [{ userId: 2, status: 'vu', rating: 10, addedAt: 0 }] },
];
const traits = new Map([
  ['a', tr('a', ['g:1'])],
  ['b', tr('b', ['g:2'])],
]);

test('modèle par personne : exclusions et nombre de titres notés', () => {
  const m = userModel(users[0], titles, traits, new Map());
  expect([...m.exclude]).toEqual(['a']);
  expect(m.rated).toBe(1);
});

test('duo : titre aimé des deux sans auteur, titre d’un seul attribué', () => {
  const [a, b] = users.map((u) => userModel(u, titles, traits, new Map()));
  const duo = duoModel(a!, b!, titles, traits, [users[0], users[1]]);
  expect(duo.liked.find((l) => l.traits.id === 'a')?.by).toBeUndefined();
  expect(duo.liked.find((l) => l.traits.id === 'b')?.by).toBe('Mathéo');
  expect(duo.exclude).toEqual(new Set(['a', 'b']));
  expect(duo.profile.get('g:1') ?? 0).toBeGreaterThan(duo.profile.get('g:2') ?? 0);
});
