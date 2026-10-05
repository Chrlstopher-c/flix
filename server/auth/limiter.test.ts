import { expect, test } from 'bun:test';
import { isBlocked, recordFailure } from './limiter';

test('bloque après 10 échecs, débloque après 15 min', () => {
  for (let i = 0; i < 10; i++) recordFailure('1.2.3.4', 1000);
  expect(isBlocked('1.2.3.4', 2000)).toBe(true);
  expect(isBlocked('1.2.3.4', 1000 + 15 * 60_000 + 1)).toBe(false);
  expect(isBlocked('5.6.7.8', 2000)).toBe(false);
});
