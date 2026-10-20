import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseMode, BREAKPOINT } from '../js/modes.js';

test('desktop with motion gets the voyage', () => {
  assert.equal(chooseMode({ width: 1440, reducedMotion: false }), 'voyage');
});

test('mode follows the window width: phones and portrait tablets get the list, 1024px+ the voyage', () => {
  assert.equal(BREAKPOINT, 1024);
  assert.equal(chooseMode({ width: 390, reducedMotion: false }), 'linear');
  assert.equal(chooseMode({ width: 768, reducedMotion: false }), 'linear');
  assert.equal(chooseMode({ width: 1023, reducedMotion: false }), 'linear');
  assert.equal(chooseMode({ width: 1024, reducedMotion: false }), 'voyage');
});

test('reduced motion and the skip link force the linear page', () => {
  assert.equal(chooseMode({ width: 1440, reducedMotion: true }), 'linear');
  assert.equal(chooseMode({ width: 1440, reducedMotion: false, forceList: true }), 'linear');
});

test('the ?view=list URL switch is gone', () => {
  assert.equal(chooseMode({ width: 1440, reducedMotion: false, search: '?view=list' }), 'voyage');
});

test('falls back to the linear page when the animation library failed to load', () => {
  assert.equal(chooseMode({ width: 1440, reducedMotion: false, animationAvailable: false }), 'linear');
  assert.equal(chooseMode({ width: 1440, reducedMotion: false, animationAvailable: true }), 'voyage');
});
