import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseMode } from '../js/modes.js';

test('desktop with motion gets the voyage', () => {
  assert.equal(chooseMode({ width: 1440, reducedMotion: false, search: '' }), 'voyage');
});
test('phones, reduced motion and ?view=list get the linear page', () => {
  assert.equal(chooseMode({ width: 390, reducedMotion: false, search: '' }), 'linear');
  assert.equal(chooseMode({ width: 1440, reducedMotion: true, search: '' }), 'linear');
  assert.equal(chooseMode({ width: 1440, reducedMotion: false, search: '?view=list' }), 'linear');
  assert.equal(chooseMode({ width: 767, reducedMotion: false, search: '' }), 'linear');
  assert.equal(chooseMode({ width: 768, reducedMotion: false, search: '?x=1' }), 'voyage');
});
