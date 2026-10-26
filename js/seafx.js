// Sea life: engraved wave marks drift in and out offshore, a tiny fish leaps once in a long while,
// and clicking open water sends out ink ripples. Everything stays small, rare and out of the way.
export const AMBIENT = { minDelay: 4000, maxDelay: 8000, fishEvery: 30000, fishChance: 0.5 };
const EDGE = 40;   // keep away from the screen edges
const PAD = 24;    // and this far from islands, cards and panels

// A random point in open water, or null if every try lands on something to avoid.
export function pickOffshorePoint(rand, area, avoid, tries = 12) {
  for (let i = 0; i < tries; i++) {
    const x = Math.round(EDGE + rand() * (area.width - 2 * EDGE));
    const y = Math.round(EDGE + rand() * (area.height - 2 * EDGE));
    const blocked = avoid.some((r) => x > r.left - PAD && x < r.right + PAD && y > r.top - PAD && y < r.bottom + PAD);
    if (!blocked) return { x, y };
  }
  return null;
}

// What happens next and when: mostly wave marks, a fish only after a long quiet spell.
export function nextAmbient(rand, sinceFish) {
  const delay = AMBIENT.minDelay + rand() * (AMBIENT.maxDelay - AMBIENT.minDelay);
  const kind = sinceFish >= AMBIENT.fishEvery && rand() < AMBIENT.fishChance ? 'fish' : 'wave';
  return { delay, kind };
}

export function canAnimate({ reducedMotion, hidden, modalOpen, touring, reading }) {
  return !(reducedMotion || hidden || modalOpen || touring || reading);
}

const NS = 'http://www.w3.org/2000/svg';

function fxSvg(layer, x, y, w = 80, h = 80) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('class', 'fx');
  s.setAttribute('width', w);
  s.setAttribute('height', h);
  s.setAttribute('viewBox', `${-w / 2} ${-h / 2} ${w} ${h}`);
  s.style.left = `${x - w / 2}px`;
  s.style.top = `${y - h / 2}px`;
  layer.appendChild(s);
  return s;
}
const el = (tag, attrs) => {
  const n = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  return n;
};
const later = (ms, fn) => setTimeout(fn, ms);

export function ripples(layer, x, y, count = 3) {
  const s = fxSvg(layer, x, y);
  for (let i = 0; i < count; i++) {
    const c = el('circle', { class: 'fx-ring', r: 22 });
    c.style.animationDelay = `${i * 0.32}s`;
    s.appendChild(c);
  }
  later(2600, () => s.remove());
}

export function waveMark(layer, x, y) {
  const s = fxSvg(layer, x, y, 60, 30);
  s.appendChild(el('path', { class: 'fx-wave', d: 'M-12 0 q3 -3 6 0 t6 0 t6 0 t6 0' }));
  if (Math.random() < 0.5) s.appendChild(el('path', { class: 'fx-wave fx-wave-2', d: 'M-6 5 q3 -3 6 0 t6 0 t6 0' }));
  later(3800, () => s.remove());
}

function droplets(layer, x, y) {
  const s = fxSvg(layer, x, y, 60, 60);
  s.appendChild(el('circle', { class: 'fx-ring', r: 12 }));
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI * (0.15 + (0.7 * i) / 4);
    const r = 8 + Math.random() * 5;
    const d = el('circle', { class: 'fx-drop', r: 1.2 });
    d.style.setProperty('--dx', `${(Math.cos(a) * r).toFixed(1)}px`);
    d.style.setProperty('--dy', `${(Math.sin(a) * r).toFixed(1)}px`);
    s.appendChild(d);
  }
  later(1600, () => s.remove());
}

export function fishLeap(layer, x, y) {
  const s = fxSvg(layer, x, y, 120, 80);
  const fish = el('path', { class: 'fx-fish', d: 'M5 0 q-5 -3 -9 0 q4 3 9 0 M-4 0 l-3 -2.5 l0 5 z' });
  s.appendChild(fish);
  ripples(layer, x - 22, y + 6, 1);
  later(1150, () => droplets(layer, x + 22, y + 6));
  later(1500, () => s.remove());
}

// Wires the effects to the stage. getState() reports what the page is doing right now.
export function initSeaFx({ stage, layer, getState }) {
  const avoidRects = () => {
    const sel = '.island .coast, #title-card, #panel:not(.is-empty), #letter:not([hidden]), #site-header, #markers, .cta';
    const base = layer.getBoundingClientRect();
    return [...document.querySelectorAll(sel)]
      .map((n) => n.getBoundingClientRect())
      .filter((r) => r.width && r.height)
      .map((r) => ({ left: r.left - base.left, top: r.top - base.top, right: r.right - base.left, bottom: r.bottom - base.top }));
  };

  let lastFish = performance.now();
  const tick = () => {
    const sinceFish = performance.now() - lastFish;
    const next = nextAmbient(Math.random, sinceFish);
    later(next.delay, () => {
      if (canAnimate(getState())) {
        const p = pickOffshorePoint(Math.random, { width: layer.clientWidth, height: layer.clientHeight }, avoidRects());
        if (p && next.kind === 'fish') { fishLeap(layer, p.x, p.y); lastFish = performance.now(); }
        else if (p) waveMark(layer, p.x, p.y);
      }
      tick();
    });
  };
  tick();

  // A click on open water (not on an island, card, panel, link or button) sends out ripples.
  stage.addEventListener('click', (ev) => {
    if (ev.target.closest('.island, a, button, #title-card, #panel, #letter')) return;
    if (!canAnimate({ ...getState(), reading: false, touring: false })) return;
    const base = layer.getBoundingClientRect();
    ripples(layer, ev.clientX - base.left, ev.clientY - base.top);
  });
}
