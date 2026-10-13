import { SX, SY } from './layout.js';

export function rng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function blobPath(cx, cy, R, k, sx = 1, sy = 1, steps = 100) {
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const r = R * (1 + 0.12 * Math.sin(3 * t + k) + 0.07 * Math.cos(5 * t + 1.7 * k) + 0.05 * Math.sin(9 * t - k));
    d += (i ? ' L' : 'M') + (cx + r * Math.cos(t) * sx).toFixed(1) + ' ' + (cy + r * Math.sin(t) * sy).toFixed(1);
  }
  return d + ' Z';
}

export function catmullRomPath(points) {
  if (!Array.isArray(points) || points.length < 2) throw new Error('catmullRomPath needs at least 2 points');
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export function rhumbLines(cx, cy, n = 16, len = 1700) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `M${cx} ${cy} L${(cx + len * Math.cos(a)).toFixed(0)} ${(cy + len * Math.sin(a)).toFixed(0)}`;
  });
}

export function soundings({ seed = 5, count = 34, attempts = 200, width = 1200, height = 760, exclude = () => false } = {}) {
  const r = rng(seed);
  const out = [];
  for (let i = 0; i < attempts && out.length < count; i++) {
    const x = 30 + r() * (width - 60);
    const y = 90 + r() * (height - 110);
    const v = Math.round(4 + r() * 40);
    if (exclude(x, y)) continue;
    out.push({ x: Math.round(x), y: Math.round(y), v });
  }
  return out;
}

// Corners first, then top/bottom middle (in island-radius units, before the SX/SY stretch).
const SLOT_OFFSETS = [[-0.52, -0.42], [0.52, -0.42], [0.52, 0.42], [-0.52, 0.42], [0, -0.58], [0, 0.58]];

export function islandScrollSlots(island, n, sx = SX, sy = SY) {
  if (!n || n <= 0) return [];
  if (n === 1) return [[island.cx, +(island.cy + 0.5 * island.R * sy).toFixed(1)]];
  return Array.from({ length: n }, (_, i) => {
    const [dx, dy] = SLOT_OFFSETS[i % SLOT_OFFSETS.length];
    const ring = Math.floor(i / SLOT_OFFSETS.length);
    const f = ring === 0 ? 1 : 0.62;            // inner ring for items 7+
    const rot = ring === 0 ? 0 : Math.PI / 6;   // rotate inner ring so it doesn't sit on the outer one
    const rx = dx * Math.cos(rot) - dy * Math.sin(rot);
    const ry = dx * Math.sin(rot) + dy * Math.cos(rot);
    return [+(island.cx + rx * f * island.R * sx).toFixed(1), +(island.cy + ry * f * island.R * sy).toFixed(1)];
  });
}
