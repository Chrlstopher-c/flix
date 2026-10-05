import { expect, test } from 'bun:test';
import { classify } from './kind';

test('animation japonaise = animé, film ou série', () => {
  expect(classify('tv', [16, 10759], 'ja')).toBe('anime');
  expect(classify('movie', [16], 'ja')).toBe('anime');
});

test('animation non japonaise reste film/série', () => {
  expect(classify('movie', [16], 'en')).toBe('film');
  expect(classify('tv', [18], 'ja')).toBe('serie');
});
