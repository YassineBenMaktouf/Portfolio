import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveHash, targetProgress } from '../js/nav.js';
import { buildSchedule, stateAt } from '../js/timeline-model.js';

const ids = ['about', 'education', 'experience', 'projects', 'skills'];
const schedule = buildSchedule([1, 2, 2, 4, 2]);

test('resolveHash maps island ids and contact, ignores the rest', () => {
  assert.equal(resolveHash('#projects', ids), 3);
  assert.equal(resolveHash('#about', ids), 0);
  assert.equal(resolveHash('#contact', ids), 'contact');
  assert.equal(resolveHash('#PROJECTS', ids), 3);
  assert.equal(resolveHash('#foo', ids), null);
  assert.equal(resolveHash('', ids), null);
  assert.equal(resolveHash(undefined, ids), null);
});

test('targetProgress lands on the island with its first scroll open', () => {
  const p = targetProgress(3, schedule);
  const s = stateAt(schedule, p);
  assert.equal(s.island, 3);
  assert.equal(s.phase, 'hold');
  assert.equal(targetProgress('contact', schedule), 1);
  assert.equal(targetProgress(null, schedule), null);
});
