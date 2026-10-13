import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SEGMENT_LEN, buildSchedule, stateAt, ease, progressOf, islandProgress, scrollStatus, unrollAt,
  markerStatus, fullViewBox, focusViewBox, lerpViewBox, cameraAt, boatAt, anchorFractions,
  cardAt, chartFadeAt, letterAt, hashForState, stripViewBox
} from '../js/timeline-model.js';
import { ISLANDS } from '../js/layout.js';

const COUNTS = [1, 2, 2, 4, 2];
const sched = buildSchedule(COUNTS);
const ids = ISLANDS.map((i) => i.id);

test('schedule length and total for the default content', () => {
  assert.equal(sched.segments.length, 2 + 5 + 11 * 3 + 2);
  const expected = SEGMENT_LEN.landing + SEGMENT_LEN.unfold + 5 * SEGMENT_LEN.sail
    + 11 * (SEGMENT_LEN.open + SEGMENT_LEN.hold + SEGMENT_LEN.close) + SEGMENT_LEN.return + SEGMENT_LEN.end;
  assert.ok(Math.abs(sched.total - expected) < 1e-9);
});

test('segments are contiguous', () => {
  for (let i = 1; i < sched.segments.length; i++) assert.equal(sched.segments[i].start, sched.segments[i - 1].end);
});

test('stateAt at the ends and with bad input', () => {
  assert.deepEqual(stateAt(sched, 0), { phase: 'landing', island: null, scroll: null, t: 0 });
  assert.equal(stateAt(sched, 1).phase, 'end');
  assert.equal(stateAt(sched, 1).t, 1);
  assert.equal(stateAt(sched, -3).phase, 'landing');
  assert.equal(stateAt(sched, NaN).phase, 'landing');
  assert.equal(stateAt(sched, 7).phase, 'end');
});

test('islands are visited in order', () => {
  const seen = [];
  for (let p = 0; p <= 1; p += 0.002) {
    const s = stateAt(sched, p);
    if (s.island !== null && seen[seen.length - 1] !== s.island) seen.push(s.island);
  }
  assert.deepEqual(seen, [0, 1, 2, 3, 4]);
});

test('island with zero scrolls still gets a hold and many scrolls are all scheduled', () => {
  const s = buildSchedule([1, 0, 6, 1, 1]);
  const holds1 = s.segments.filter((g) => g.island === 1 && g.phase === 'hold');
  assert.equal(holds1.length, 1);
  assert.equal(holds1[0].scroll, null);
  assert.equal(s.segments.filter((g) => g.island === 2 && g.phase === 'open').length, 6);
  const st = stateAt(s, islandProgress(s, 1));
  assert.equal(unrollAt(st), 0);
});

test('progressOf and islandProgress land inside the first hold', () => {
  const p = islandProgress(sched, 3);
  const s = stateAt(sched, p);
  assert.equal(s.phase, 'hold');
  assert.equal(s.island, 3);
  assert.equal(s.scroll, 0);
  assert.equal(progressOf(sched, { phase: 'nope' }), null);
  assert.equal(islandProgress(sched, 9), null);
});

test('ease is 0 → 0, 0.5 → 0.5, 1 → 1', () => {
  assert.equal(ease(0), 0);
  assert.equal(ease(0.5), 0.5);
  assert.equal(ease(1), 1);
});

test('scroll status through a voyage', () => {
  assert.equal(scrollStatus({ phase: 'unfold', island: null, scroll: null, t: 0.5 }, 0, 0), 'hidden');
  assert.equal(scrollStatus({ phase: 'sail', island: 1, scroll: null, t: 0.3 }, 1, 0), 'hidden');
  assert.equal(scrollStatus({ phase: 'sail', island: 1, scroll: null, t: 0.9 }, 1, 0), 'next');
  assert.equal(scrollStatus({ phase: 'sail', island: 1, scroll: null, t: 0.9 }, 2, 0), 'hidden');
  assert.equal(scrollStatus({ phase: 'hold', island: 3, scroll: 1, t: 0.5 }, 3, 0), 'read');
  assert.equal(scrollStatus({ phase: 'hold', island: 3, scroll: 1, t: 0.5 }, 3, 1), 'open');
  assert.equal(scrollStatus({ phase: 'hold', island: 3, scroll: 1, t: 0.5 }, 3, 2), 'next');
  assert.equal(scrollStatus({ phase: 'close', island: 3, scroll: 1, t: 1 }, 3, 1), 'read');
  assert.equal(scrollStatus({ phase: 'hold', island: 3, scroll: 1, t: 0.5 }, 0, 0), 'read');
  assert.equal(scrollStatus({ phase: 'end', island: null, scroll: null, t: 0 }, 4, 1), 'read');
});

test('unroll follows open, hold and close', () => {
  assert.equal(unrollAt({ phase: 'open', island: 0, scroll: 0, t: 0 }), 0);
  assert.equal(unrollAt({ phase: 'open', island: 0, scroll: 0, t: 1 }), 1);
  assert.equal(unrollAt({ phase: 'hold', island: 0, scroll: 0, t: 0.4 }), 1);
  assert.equal(unrollAt({ phase: 'close', island: 0, scroll: 0, t: 1 }), 0);
  assert.equal(unrollAt({ phase: 'sail', island: 0, scroll: null, t: 0.5 }), 0);
});

test('marker status', () => {
  const s = { phase: 'hold', island: 2, scroll: 0, t: 0 };
  assert.deepEqual([0, 1, 2, 3, 4].map((i) => markerStatus(s, i)), ['done', 'done', 'current', 'upcoming', 'upcoming']);
  assert.equal(markerStatus({ phase: 'landing', island: null, scroll: null, t: 0 }, 0), 'upcoming');
  assert.equal(markerStatus({ phase: 'end', island: null, scroll: null, t: 0 }, 4), 'done');
});

test('focus view keeps the island at 28% from the left and matches the aspect', () => {
  const v = focusViewBox(ISLANDS[0], 16 / 9);
  assert.ok(Math.abs(v.w / v.h - 16 / 9) < 1e-9);
  assert.ok(Math.abs((ISLANDS[0].cx - v.x) / v.w - 0.28) < 1e-9);
  assert.deepEqual(lerpViewBox({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 10, w: 20, h: 20 }, 0.5), { x: 5, y: 5, w: 15, h: 15 });
});

test('strip view centres the whole island in a wide, short strip', () => {
  for (const isl of ISLANDS) {
    for (const aspect of [3.2, 1.6, 0.9]) {
      const v = stripViewBox(isl, aspect);
      assert.ok(Math.abs(v.w / v.h - aspect) < 1e-9);
      assert.ok(Math.abs(v.x + v.w / 2 - isl.cx) < 1e-9);
      assert.ok(Math.abs(v.y + v.h / 2 - isl.cy) < 1e-9);
      const halfW = isl.R * 1.35 * 1.45, halfH = isl.R * 0.82 * 1.45;
      assert.ok(v.w / 2 >= halfW - 1e-9 && v.h / 2 >= halfH - 1e-9, `${isl.id} @${aspect}`);
    }
  }
});

test('camera is continuous at segment boundaries', () => {
  const views = { full: fullViewBox(), focus: ISLANDS.map((i) => focusViewBox(i, 1.6)) };
  assert.deepEqual(cameraAt({ phase: 'sail', island: 0, scroll: null, t: 0 }, views), views.full);
  assert.deepEqual(cameraAt({ phase: 'sail', island: 0, scroll: null, t: 1 }, views), views.focus[0]);
  assert.deepEqual(cameraAt({ phase: 'sail', island: 2, scroll: null, t: 0 }, views), views.focus[1]);
  assert.deepEqual(cameraAt({ phase: 'return', island: null, scroll: null, t: 1 }, views), views.full);
});

test('boat moves from anchor to anchor', () => {
  const anchors = [0, 0.1, 0.3, 0.5, 0.7, 0.8, 1];
  assert.equal(boatAt({ phase: 'landing', island: null, scroll: null, t: 0 }, anchors), 0);
  assert.equal(boatAt({ phase: 'sail', island: 1, scroll: null, t: 1 }, anchors), 0.3);
  assert.equal(boatAt({ phase: 'hold', island: 3, scroll: 0, t: 0.5 }, anchors), 0.7);
  assert.equal(boatAt({ phase: 'end', island: null, scroll: null, t: 0 }, anchors), 1);
});

test('anchorFractions finds each point on a straight path', () => {
  const pointAt = (len) => ({ x: len, y: 0 });
  const f = anchorFractions(pointAt, 100, [[0, 0], [25, 3], [100, 0]], 400);
  assert.ok(Math.abs(f[0] - 0) < 0.01);
  assert.ok(Math.abs(f[1] - 0.25) < 0.01);
  assert.ok(Math.abs(f[2] - 1) < 0.01);
});

test('card, chart fade and letter', () => {
  assert.equal(cardAt({ phase: 'landing', t: 0.5 }), 0);
  assert.equal(cardAt({ phase: 'unfold', t: 1 }), 1);
  assert.equal(cardAt({ phase: 'hold', t: 0 }), 1);
  assert.equal(chartFadeAt({ phase: 'landing', t: 0 }), 0.22);
  assert.equal(chartFadeAt({ phase: 'unfold', t: 1 }), 1);
  assert.equal(chartFadeAt({ phase: 'end', t: 1 }), 0.55);
  assert.equal(letterAt({ phase: 'end', t: 1 }), 1);
  assert.equal(letterAt({ phase: 'return', t: 1 }), 0);
});

test('hash for state', () => {
  assert.equal(hashForState({ phase: 'landing', island: null }, ids), '');
  assert.equal(hashForState({ phase: 'open', island: 3 }, ids), '#projects');
  assert.equal(hashForState({ phase: 'end', island: null }, ids), '#contact');
});
