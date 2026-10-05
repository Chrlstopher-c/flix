import { expect, test } from 'bun:test';
import { ago, dayLabel } from './types';

test('temps relatif', () => {
  const now = 10_000_000_000;
  expect(ago(now - 30_000, now)).toBe('à l’instant');
  expect(ago(now - 2 * 3_600_000, now)).toBe('il y a 2 h');
  expect(ago(now - 30 * 3_600_000, now)).toBe('hier');
});

test('jour de sortie', () => {
  const now = new Date('2026-10-05T10:00:00');
  expect(dayLabel('2026-10-05', now)).toBe('Auj.');
  expect(dayLabel('2026-10-06', now)).toBe('Demain');
  expect(dayLabel('2026-10-08', now)).toBe('Jeu.');
});
