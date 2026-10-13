import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHTML, safeUrl } from '../js/escape.js';

test('escapeHTML neutralises markup characters', () => {
  assert.equal(escapeHTML('R&D <ML> "pricing" it\'s'), 'R&amp;D &lt;ML&gt; &quot;pricing&quot; it&#39;s');
  assert.equal(escapeHTML(null), '');
  assert.equal(escapeHTML(42), '42');
});
test('safeUrl keeps http(s), mailto and relative links', () => {
  assert.equal(safeUrl('https://github.com/x'), 'https://github.com/x');
  assert.equal(safeUrl('mailto:a@b.c'), 'mailto:a@b.c');
  assert.equal(safeUrl('cv/CV-EN.pdf'), 'cv/CV-EN.pdf');
  assert.equal(safeUrl('  https://x.y  '), 'https://x.y');
});
test('safeUrl blocks script and protocol-relative URLs', () => {
  assert.equal(safeUrl('javascript:alert(1)'), '#');
  assert.equal(safeUrl('JaVaScRiPt:alert(1)'), '#');
  assert.equal(safeUrl('data:text/html,hi'), '#');
  assert.equal(safeUrl('//evil.example'), '#');
  assert.equal(safeUrl(undefined), '#');
});
