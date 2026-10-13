import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pick, validateContent, ISLAND_IDS } from '../js/content.js';
import { fixtureContent } from './fixtures.js';
import { readFileSync } from 'node:fs';

test('pick returns the requested language', () => {
  assert.equal(pick({ en: 'Hello', fr: 'Bonjour' }, 'fr'), 'Bonjour');
});
test('pick falls back to English when French is missing or empty', () => {
  assert.equal(pick({ en: 'Hello' }, 'fr'), 'Hello');
  assert.equal(pick({ en: 'Hello', fr: '' }, 'fr'), 'Hello');
});
test('pick passes plain strings through and never returns undefined', () => {
  assert.equal(pick('Python', 'fr'), 'Python');
  assert.equal(pick(null, 'en'), '');
  assert.equal(pick(undefined, 'fr'), '');
  assert.equal(pick({ de: 'Hallo' }, 'fr'), '');
});
test('fixture content is valid', () => {
  assert.deepEqual(validateContent(fixtureContent()), []);
});
test('validateContent reports islands out of order', () => {
  const c = fixtureContent();
  [c.islands[0], c.islands[1]] = [c.islands[1], c.islands[0]];
  assert.ok(validateContent(c).some((e) => e.includes('island 0')));
});
test('validateContent reports a missing scrolls array and a missing name', () => {
  const c = fixtureContent();
  delete c.islands[2].scrolls;
  c.person.name = '';
  const errors = validateContent(c);
  assert.ok(errors.some((e) => e.includes('experience') && e.includes('scrolls')));
  assert.ok(errors.some((e) => e.includes('person.name')));
});
test('shipped content.json is valid', () => {
  const data = JSON.parse(readFileSync(new URL('../content/content.json', import.meta.url), 'utf8'));
  assert.deepEqual(validateContent(data), []);
});
test('island ids are fixed', () => {
  assert.deepEqual(ISLAND_IDS, ['about', 'education', 'experience', 'projects', 'skills']);
});
