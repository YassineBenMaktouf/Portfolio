import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectLanguage, safeStorage, createI18n, LANGS } from '../js/i18n.js';

const ui = { en: { hello: 'Hello {name}', only: 'English only' }, fr: { hello: 'Bonjour {name}' } };

test('stored language wins when valid', () => {
  assert.equal(detectLanguage({ stored: 'fr', browserLangs: ['en-US'] }), 'fr');
});
test('invalid stored language is ignored', () => {
  assert.equal(detectLanguage({ stored: 'xx', browserLangs: ['fr-FR'] }), 'fr');
});
test('browser language starting with fr gives French, anything else English', () => {
  assert.equal(detectLanguage({ browserLangs: ['fr-CA', 'en'] }), 'fr');
  assert.equal(detectLanguage({ browserLangs: ['de-DE'] }), 'en');
  assert.equal(detectLanguage({}), 'en');
});
test('t translates, interpolates and falls back to English then to the key', () => {
  const i18n = createI18n(ui, 'fr');
  assert.equal(i18n.t('hello', { name: 'Yassine' }), 'Bonjour Yassine');
  assert.equal(i18n.t('only'), 'English only');
  assert.equal(i18n.t('missing.key'), 'missing.key');
});
test('t leaves unknown placeholders untouched', () => {
  assert.equal(createI18n(ui, 'en').t('hello'), 'Hello {name}');
});
test('setLang switches and notifies; invalid or same language does nothing', () => {
  const i18n = createI18n(ui, 'en');
  const seen = [];
  i18n.onChange((l) => seen.push(l));
  i18n.setLang('fr');
  i18n.setLang('fr');
  i18n.setLang('de');
  assert.equal(i18n.lang, 'fr');
  assert.deepEqual(seen, ['fr']);
});
test('unknown initial language falls back to English', () => {
  assert.equal(createI18n(ui, 'es').lang, 'en');
});
test('safeStorage survives a storage that throws', () => {
  const throwing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  const s = safeStorage(throwing);
  assert.equal(s.get('lang'), null);
  assert.doesNotThrow(() => s.set('lang', 'fr'));
});
test('safeStorage works with a missing storage and a real one', () => {
  assert.equal(safeStorage(null).get('x'), null);
  const map = new Map();
  const s = safeStorage({ getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) });
  s.set('lang', 'fr');
  assert.equal(s.get('lang'), 'fr');
});
test('LANGS is en and fr', () => assert.deepEqual(LANGS, ['en', 'fr']));
