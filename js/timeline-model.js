import { VIEW, SX, SY } from './layout.js';

export const SEGMENT_LEN = { landing: 0.6, unfold: 1, sail: 1, open: 0.5, hold: 1, close: 0.5, return: 1, end: 0.8 };

export function buildSchedule(scrollCounts) {
  const segments = [];
  let pos = 0;
  const add = (phase, island = null, scroll = null) => {
    const len = SEGMENT_LEN[phase];
    segments.push({ phase, island, scroll, start: pos, end: pos + len });
    pos += len;
  };
  add('landing');
  add('unfold');
  scrollCounts.forEach((n, i) => {
    add('sail', i);
    if (!n) add('hold', i, null);
    for (let j = 0; j < n; j++) { add('open', i, j); add('hold', i, j); add('close', i, j); }
  });
  add('return');
  add('end');
  return { segments, total: pos, scrollCounts: [...scrollCounts] };
}

export function stateAt(schedule, progress) {
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  const x = p * schedule.total;
  const segs = schedule.segments;
  let seg = segs[segs.length - 1];
  for (const s of segs) { if (x < s.end) { seg = s; break; } }
  const t = Math.min(1, Math.max(0, (x - seg.start) / (seg.end - seg.start)));
  return { phase: seg.phase, island: seg.island, scroll: seg.scroll, t };
}

export const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function progressOf(schedule, match) {
  const s = schedule.segments.find((seg) => Object.entries(match).every(([k, v]) => seg[k] === v));
  return s ? s.start / schedule.total : null;
}

export function islandProgress(schedule, i) {
  const p = progressOf(schedule, { phase: 'hold', island: i });
  return p === null ? null : p + 1e-6;
}

const BEFORE = new Set(['landing', 'unfold']);
const AFTER = new Set(['return', 'end']);

export function scrollStatus(state, i, j) {
  const { phase, island, scroll, t } = state;
  if (BEFORE.has(phase)) return 'hidden';
  if (AFTER.has(phase)) return 'read';
  if (i < island) return 'read';
  if (i > island) return 'hidden';
  if (phase === 'sail') return t < 0.7 ? 'hidden' : 'next';
  if (scroll === null) return 'next';
  if (j < scroll) return 'read';
  if (j > scroll) return 'next';
  return phase === 'close' && t >= 1 ? 'read' : 'open';
}

export function unrollAt(state) {
  if (state.phase === 'open') return ease(state.t);
  if (state.phase === 'hold') return state.scroll === null ? 0 : 1;
  if (state.phase === 'close') return 1 - ease(state.t);
  return 0;
}

export function markerStatus(state, i) {
  if (BEFORE.has(state.phase)) return 'upcoming';
  if (AFTER.has(state.phase)) return 'done';
  if (i < state.island) return 'done';
  return i === state.island ? 'current' : 'upcoming';
}

export function fullViewBox() {
  return { x: 0, y: 0, w: VIEW.w, h: VIEW.h };
}

export function focusViewBox(island, aspect) {
  const islandW = 2 * island.R * SX * 1.25;
  const w = islandW / 0.42;
  const h = w / aspect;
  return { x: island.cx - w * 0.28, y: island.cy - h * 0.5, w, h };
}

// Linear-mode map strip: the whole island (with its ripples) centred and fitted.
export function stripViewBox(island, aspect) {
  const halfW = island.R * SX * 1.45;
  const halfH = island.R * SY * 1.45;
  const w = Math.max(2 * halfW, 2 * halfH * aspect);
  const h = w / aspect;
  return { x: island.cx - w / 2, y: island.cy - h / 2, w, h };
}

// Exact at the ends so segment boundaries line up without floating-point drift.
const mix = (a, b, t) => (t <= 0 ? a : t >= 1 ? b : a + (b - a) * t);

export function lerpViewBox(a, b, t) {
  return { x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), w: mix(a.w, b.w, t), h: mix(a.h, b.h, t) };
}

export function cameraAt(state, { full, focus }) {
  const { phase, island, t } = state;
  if (BEFORE.has(phase) || phase === 'end') return full;
  if (phase === 'sail') return lerpViewBox(island === 0 ? full : focus[island - 1], focus[island], ease(t));
  if (phase === 'return') return lerpViewBox(focus[focus.length - 1], full, ease(t));
  return focus[island];
}

export function boatAt(state, anchors) {
  const { phase, island, t } = state;
  const last = anchors.length - 1;
  if (BEFORE.has(phase)) return anchors[0];
  if (phase === 'sail') return mix(anchors[island], anchors[island + 1], ease(t));
  if (phase === 'return') return mix(anchors[last - 1], anchors[last], ease(t));
  if (phase === 'end') return anchors[last];
  return anchors[island + 1];
}

export function anchorFractions(pointAt, totalLength, points, samples = 800) {
  const pts = [];
  for (let i = 0; i <= samples; i++) pts.push({ len: (i / samples) * totalLength, ...pointAt((i / samples) * totalLength) });
  return points.map(([x, y]) => {
    let best = pts[0];
    let bestD = Infinity;
    for (const p of pts) {
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bestD) { bestD = d; best = p; }
    }
    return best.len / totalLength;
  });
}

export function cardAt(state) {
  if (state.phase === 'landing') return 0;
  if (state.phase === 'unfold') return ease(state.t);
  return 1;
}

export function chartFadeAt(state) {
  if (state.phase === 'landing') return 0.22;
  if (state.phase === 'unfold') return mix(0.22, 1, ease(state.t));
  if (state.phase === 'end') return mix(1, 0.55, ease(state.t));
  return 1;
}

export function letterAt(state) {
  return state.phase === 'end' ? ease(state.t) : 0;
}

export function hashForState(state, ids) {
  if (BEFORE.has(state.phase)) return '';
  if (AFTER.has(state.phase)) return '#contact';
  return `#${ids[state.island]}`;
}
