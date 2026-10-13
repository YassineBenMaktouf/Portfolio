import { test } from 'node:test';
import assert from 'node:assert/strict';
import { islandMeta, renderScroll, scrollFrame, scrollLabel, renderLetter, renderLinear } from '../js/scrolls.js';
import { createI18n } from '../js/i18n.js';
import { fixtureContent } from './fixtures.js';
import { readFileSync } from 'node:fs';

const ui = JSON.parse(readFileSync(new URL('../content/i18n.json', import.meta.url), 'utf8'));
const t = createI18n(ui, 'en').t;
const tFr = createI18n(ui, 'fr').t;

function render(islandIndex, scrollIndex, content = fixtureContent(), lang = 'en', tt = t) {
  const island = islandMeta(content, lang)[islandIndex];
  const scrolls = content.islands[islandIndex].scrolls;
  return renderScroll({ island, item: scrolls[scrollIndex], index: scrollIndex, total: scrolls.length, person: content.person, lang, t: tt });
}

test('islandMeta carries ids, numerals, kinds and titles in the chosen language', () => {
  const meta = islandMeta(fixtureContent(), 'fr');
  assert.deepEqual(meta.map((m) => m.num), ['I', 'II', 'III', 'IV', 'V']);
  assert.equal(meta[0].title, 'À propos');
  assert.equal(meta[3].kind, 'project');
});

test('kicker shows island and scroll position', () => {
  const html = render(3, 0);
  assert.ok(html.includes('Island IV'));
  assert.ok(html.includes('Scroll 1 / 1'));
});

test('about scroll shows a placeholder when there is no photo', () => {
  const html = render(0, 0);
  assert.ok(html.includes('portrait-placeholder'));
  assert.ok(html.includes('Yassine Ben Maktouf'));
  assert.ok(html.includes('Home port'));
});

test('content with markup characters is escaped everywhere', () => {
  const c = fixtureContent();
  c.islands[3].scrolls[0].title = { en: 'R&D <script>x</script>' };
  c.islands[3].scrolls[0].tools = ['<b>bold</b>'];
  const html = render(3, 0, c);
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('R&amp;D &lt;script&gt;'));
  assert.ok(html.includes('&lt;b&gt;bold&lt;/b&gt;'));
});

test('unsafe project links are neutralised', () => {
  const c = fixtureContent();
  c.islands[3].scrolls[0].links = [{ label: { en: 'Bad' }, url: 'javascript:alert(1)' }];
  const html = render(3, 0, c);
  assert.ok(!html.includes('javascript:'));
  assert.ok(html.includes('href="#"'));
});

test('external links open safely in a new tab', () => {
  const html = render(3, 0);
  assert.ok(html.includes('target="_blank"'));
  assert.ok(html.includes('rel="noopener noreferrer"'));
});

test('French falls back to English for missing fields', () => {
  const html = render(1, 0, fixtureContent(), 'fr', tFr);
  assert.ok(html.includes('Actuarial Science'));
  assert.ok(html.includes('Cours clés'));
  assert.ok(!html.includes('undefined'));
});

test('skills and certifications render tags and seals, never percentages', () => {
  const skills = render(4, 0);
  assert.ok(skills.includes('Instruments aboard'));
  assert.equal((skills.match(/class="tag"/g) || []).length, 2);
  assert.ok(!skills.includes('%'));
  const certs = render(4, 1);
  assert.ok(certs.includes('class="seal"'));
  assert.ok(certs.includes('Cert A'));
});

test('scrollFrame wraps content with two rollers', () => {
  const html = scrollFrame('<p>x</p>');
  assert.equal((html.match(/class="roller"/g) || []).length, 2);
  assert.ok(html.includes('<div class="scroll-content"><p>x</p></div>'));
});

test('scrollLabel gives a short label per kind', () => {
  const c = fixtureContent();
  const meta = islandMeta(c, 'en');
  assert.equal(scrollLabel({ island: meta[1], item: c.islands[1].scrolls[0], lang: 'en', t }), 'Actuarial Science');
  assert.equal(scrollLabel({ island: meta[3], item: c.islands[3].scrolls[0], lang: 'en', t }), 'Reserving model');
  assert.equal(scrollLabel({ island: meta[4], item: c.islands[4].scrolls[1], lang: 'en', t }), 'Certifications');
  assert.equal(scrollLabel({ island: meta[0], item: c.islands[0].scrolls[0], lang: 'en', t }), 'About me');
});

test('letter has mailto, links, CV in the current language and a sail-again button', () => {
  const p = fixtureContent().person;
  const fr = renderLetter({ person: p, lang: 'fr', t: tFr });
  assert.ok(fr.includes('href="mailto:yassine@example.com"'));
  assert.ok(fr.includes('cv/CV-Yassine-Ben-Maktouf-FR.pdf'));
  assert.ok(fr.includes('data-action="sail-again"'));
  assert.ok(fr.includes('ensemble ?'));
});

test('renderLinear has five island sections plus contact', () => {
  const html = renderLinear({ content: fixtureContent(), lang: 'en', t });
  assert.equal((html.match(/<section class="leg/g) || []).length, 6);
  for (const id of ['about', 'education', 'experience', 'projects', 'skills', 'contact']) assert.ok(html.includes(`id="leg-${id}"`), id);
});
