import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('index.html exposes every id later modules rely on', () => {
  const ids = ['skip-link', 'site-header', 'brand', 'lang-toggle', 'cv-link', 'markers', 'track',
    'stage', 'chart-root', 'title-card', 'landing-cta', 'chart-cta', 'panel', 'letter', 'linear'];
  for (const id of ids) assert.ok(html.includes(`id="${id}"`), `missing #${id}`);
});

test('has five island markers in order', () => {
  for (let i = 0; i < 5; i++) assert.ok(html.includes(`data-index="${i}"`), `missing marker ${i}`);
});

test('loads pinned GSAP 3.12.5 from cdnjs and main.js as a module', () => {
  assert.ok(html.includes('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js'));
  assert.ok(html.includes('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js'));
  assert.ok(html.includes('<script type="module" src="js/main.js">'));
});

test('panel contains the scroll component parts', () => {
  for (const cls of ['stub-read', 'scroll-content', 'stub-next']) assert.ok(html.includes(cls), cls);
});
