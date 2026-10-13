import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rng, blobPath, catmullRomPath, rhumbLines, soundings, islandScrollSlots } from '../js/geometry.js';
import { ISLANDS, ROUTE_POINTS, SX, SY } from '../js/layout.js';

test('rng is deterministic and in (0,1)', () => {
  const a = rng(5), b = rng(5);
  for (let i = 0; i < 50; i++) {
    const x = a();
    assert.equal(x, b());
    assert.ok(x > 0 && x < 1);
  }
});

test('blobPath is a closed path with steps+1 points', () => {
  const d = blobPath(100, 100, 50, 0.7, 1.35, 0.82, 100);
  assert.ok(d.startsWith('M'));
  assert.ok(d.endsWith(' Z'));
  assert.equal(d.split(/[ML]/).filter((s) => s.trim()).length, 101);
  assert.equal(d, blobPath(100, 100, 50, 0.7, 1.35, 0.82, 100));
});

test('catmullRomPath passes through every point', () => {
  const d = catmullRomPath(ROUTE_POINTS);
  assert.ok(d.startsWith(`M${ROUTE_POINTS[0][0]} ${ROUTE_POINTS[0][1]}`));
  for (const [x, y] of ROUTE_POINTS.slice(1)) assert.ok(d.includes(`, ${x} ${y}`), `${x},${y}`);
  assert.throws(() => catmullRomPath([[0, 0]]));
});

test('rhumbLines returns n lines from the centre', () => {
  const lines = rhumbLines(960, 590, 16);
  assert.equal(lines.length, 16);
  assert.ok(lines.every((d) => d.startsWith('M960 590 L')));
});

test('soundings are deterministic, capped and respect exclusions', () => {
  const exclude = (x) => x < 600;
  const a = soundings({ seed: 5, count: 20, exclude });
  assert.deepEqual(a, soundings({ seed: 5, count: 20, exclude }));
  assert.ok(a.length <= 20 && a.length > 0);
  assert.ok(a.every((s) => s.x >= 600 && s.v >= 4 && s.v <= 44));
});

function insideEllipse(island, [x, y]) {
  const nx = (x - island.cx) / (island.R * SX);
  const ny = (y - island.cy) / (island.R * SY);
  return Math.hypot(nx, ny) < 0.76;
}

test('scroll slots: none, one below the name, and corners for 2–4', () => {
  const isl = ISLANDS[3];
  assert.deepEqual(islandScrollSlots(isl, 0), []);
  const [one] = islandScrollSlots(isl, 1);
  assert.equal(one[0], isl.cx);
  assert.ok(one[1] > isl.cy);
  const four = islandScrollSlots(isl, 4);
  assert.equal(four.length, 4);
  assert.equal(new Set(four.map((p) => p.join(','))).size, 4);
});

test('scroll slots stay inside the island even for 8 items', () => {
  for (const isl of ISLANDS) {
    for (const n of [1, 2, 4, 6, 8]) {
      const slots = islandScrollSlots(isl, n);
      assert.equal(slots.length, n);
      for (const p of slots) assert.ok(insideEllipse(isl, p), `${isl.id} n=${n} ${p}`);
    }
  }
});

test('layout has five islands in the fixed order', () => {
  assert.deepEqual(ISLANDS.map((i) => i.id), ['about', 'education', 'experience', 'projects', 'skills']);
  assert.equal(ROUTE_POINTS.length, 7);
});
