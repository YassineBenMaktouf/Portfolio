import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chartSVG, splitTitle, zoomFontSize, labelsMarkup } from '../js/chart.js';
import { ISLANDS } from '../js/layout.js';

const titles = { about: 'About me', education: 'Education', experience: 'Experience', projects: 'Projects', skills: 'Skills & certifications' };
const scrollCounts = { about: 1, education: 2, experience: 2, projects: 4, skills: 2 };

test('splitTitle keeps short titles and splits long ones after the ampersand', () => {
  assert.deepEqual(splitTitle('Projects'), ['Projects']);
  assert.deepEqual(splitTitle('Skills & certifications'), ['Skills &', 'certifications']);
  assert.deepEqual(splitTitle('Compétences & certifications'), ['Compétences &', 'certifications']);
  assert.equal(splitTitle('A very long title without ampersand').length, 2);
});

test('zoomFontSize is positive and never larger than 0.32 R', () => {
  for (const isl of ISLANDS) {
    const fs = zoomFontSize(isl, splitTitle(titles[isl.id]));
    assert.ok(fs > 0 && fs <= isl.R * 0.32 + 1e-9, `${isl.id}: ${fs}`);
  }
});

test('chartSVG has five islands, route, done route, compass and boat', () => {
  const svg = chartSVG({ titles, scrollCounts, harbourLabel: 'Home harbour' });
  assert.ok(svg.startsWith('<svg id="chart"'));
  assert.equal((svg.match(/class="island"/g) || []).length, 5);
  for (const id of ['id="route"', 'id="route-done"', 'id="boat"', 'class="compass"', 'class="harbour-label"']) assert.ok(svg.includes(id), id);
});

test('icons match scroll counts and start hidden', () => {
  const svg = chartSVG({ titles, scrollCounts, harbourLabel: 'Home harbour' });
  assert.equal((svg.match(/class="scroll-icon"/g) || []).length, 11);
  assert.equal((svg.match(/data-status="hidden"/g) || []).length, 11);
  const projects = svg.split('data-island="projects"')[1].split('data-island="skills"')[0];
  assert.equal((projects.match(/class="scroll-icon"/g) || []).length, 4);
});

test('titles are escaped and zoom labels are uppercase', () => {
  const markup = labelsMarkup(ISLANDS[0], 'R&D <b>');
  assert.ok(markup.includes('R&amp;D &lt;B&gt;'));
  assert.ok(markup.includes('R&amp;D &lt;b&gt;'));
  assert.ok(!markup.includes('<b>'));
});

test('missing scroll count draws no icons for that island', () => {
  const svg = chartSVG({ titles, scrollCounts: { about: 1 }, harbourLabel: 'x' });
  assert.equal((svg.match(/class="scroll-icon"/g) || []).length, 1);
});
