import { ISLANDS, ROUTE_POINTS } from './layout.js';
import {
  stateAt, cameraAt, fullViewBox, focusViewBox, boatAt, anchorFractions, scrollStatus,
  unrollAt, cardAt, chartFadeAt, letterAt, labelMix, cardOpacityAt
} from './timeline-model.js';
import { islandMeta, renderScroll, scrollLabel } from './scrolls.js';

const UNIT_VH = 70;                 // scroll distance per schedule unit
const CARD_BIG_W = 660;
const CARD_SMALL = { x: 40, y: 50, w: 350 };
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function createVoyage(app) {
  const { schedule, svg } = app;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  const track = document.getElementById('track');
  const stage = document.getElementById('stage');
  const card = document.getElementById('title-card');
  const panel = document.getElementById('panel');
  const panelContent = panel.querySelector('.scroll-content');
  const stubRead = panel.querySelector('.stub-read');
  const stubNext = panel.querySelector('.stub-next');
  const letter = document.getElementById('letter');
  const route = svg.querySelector('#route');
  const routeDone = svg.querySelector('#route-done');
  const boat = svg.querySelector('#boat');
  const icons = ISLANDS.map((isl) => [...svg.querySelectorAll(`.island[data-island="${isl.id}"] .scroll-icon`)]);

  track.style.height = `${schedule.total * UNIT_VH + 100}vh`;
  const routeLen = route.getTotalLength();
  const anchors = anchorFractions((l) => route.getPointAtLength(l), routeLen, ROUTE_POINTS);

  let views, cardBig, current = { phase: 'landing', island: null, scroll: null, t: 0 };
  let panelKey = '', lastBoatX = null, lastProgress = 0;

  function measure() {
    const aspect = stage.clientWidth / Math.max(1, stage.clientHeight);
    views = { full: fullViewBox(), focus: ISLANDS.map((isl) => focusViewBox(isl, aspect)) };
    card.style.transform = 'none';
    const h = card.offsetHeight;
    cardBig = { x: (stage.clientWidth - CARD_BIG_W) / 2, y: (stage.clientHeight - h) / 2 - stage.clientHeight * 0.02 };
  }

  function applyCard(c) {
    const s = lerp(1, CARD_SMALL.w / CARD_BIG_W, c);
    const x = lerp(cardBig.x, CARD_SMALL.x, c);
    const y = lerp(cardBig.y, CARD_SMALL.y, c);
    card.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
  }

  function applyPanel(state) {
    const meta = islandMeta(app.content, app.i18n.lang);
    const inScroll = state.island !== null && state.scroll !== null && ['open', 'hold', 'close'].includes(state.phase);
    if (!inScroll) {
      panel.classList.add('is-empty');
      panelKey = '';
      return;
    }
    const island = meta[state.island];
    const scrolls = app.content.islands[state.island].scrolls;
    const key = `${app.i18n.lang}:${state.island}:${state.scroll}`;
    if (key !== panelKey) {
      panelKey = key;
      panelContent.innerHTML = renderScroll({
        island, item: scrolls[state.scroll], index: state.scroll, total: scrolls.length,
        person: app.content.person, lang: app.i18n.lang, t: app.i18n.t
      });
      panelContent.querySelectorAll('a, button').forEach((el) => el.setAttribute('tabindex', '-1'));
      panelContent.scrollTop = 0;
      panel.style.setProperty('--content-h', `${panelContent.offsetHeight}px`);
      const label = (j) => scrollLabel({ island, item: scrolls[j], lang: app.i18n.lang, t: app.i18n.t });
      stubRead.hidden = state.scroll === 0;
      if (state.scroll > 0) stubRead.querySelector('.stub-label').textContent = `${label(state.scroll - 1)} · ${app.i18n.t('scroll.read')} ✓`;
      stubNext.hidden = state.scroll >= scrolls.length - 1;
      if (state.scroll < scrolls.length - 1) stubNext.querySelector('.stub-label').textContent = `${app.i18n.t('scroll.next')} · ${label(state.scroll + 1)}`;
    }
    panel.classList.remove('is-empty');
    panel.style.setProperty('--unroll', unrollAt(state).toFixed(3));
  }

  function render(progress) {
    lastProgress = progress;
    const state = stateAt(schedule, progress);
    current = state;
    document.body.dataset.phase = state.phase;

    const vb = cameraAt(state, views);
    svg.setAttribute('viewBox', `${vb.x.toFixed(2)} ${vb.y.toFixed(2)} ${vb.w.toFixed(2)} ${vb.h.toFixed(2)}`);
    const zoom = fullViewBox().w / vb.w;
    const mixes = labelMix(zoom);
    svg.style.setProperty('--full-mix', mixes.full.toFixed(3));
    svg.style.setProperty('--zoom-mix', mixes.zoom.toFixed(3));
    svg.style.opacity = chartFadeAt(state).toFixed(3);

    const f = boatAt(state, anchors);
    const pt = route.getPointAtLength(f * routeLen);
    const facingLeft = lastBoatX !== null && pt.x < lastBoatX - 0.01;
    lastBoatX = pt.x;
    boat.setAttribute('transform', `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})${facingLeft ? ' scale(-1 1)' : ''}`);
    routeDone.style.strokeDasharray = `${(f * routeLen).toFixed(1)} ${routeLen.toFixed(1)}`;

    icons.forEach((list, i) => list.forEach((el, j) => { el.dataset.status = scrollStatus(state, i, j); }));
    applyCard(cardAt(state));
    const cardOpacity = cardOpacityAt(state);
    card.style.opacity = cardOpacity.toFixed(3);
    card.style.visibility = cardOpacity === 0 ? 'hidden' : 'visible';
    applyPanel(state);

    const l = letterAt(state);
    letter.hidden = l === 0;
    letter.style.opacity = l.toFixed(3);
    letter.style.pointerEvents = l > 0.5 ? 'auto' : 'none';

    document.dispatchEvent(new CustomEvent('voyage:state', { detail: state }));
  }

  measure();
  const proxy = { p: 0 };
  const toP = gsap.quickTo(proxy, 'p', { duration: 0.6, ease: 'power3.out', onUpdate: () => render(proxy.p) });
  const trigger = ScrollTrigger.create({
    trigger: track, start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => toP(self.progress)
  });
  proxy.p = trigger.progress;
  render(proxy.p);

  window.addEventListener('resize', () => { measure(); ScrollTrigger.refresh(); render(lastProgress); });

  return {
    refresh() { panelKey = ''; measure(); render(lastProgress); },
    scrollToProgress(p) {
      const top = trigger.start + clamp01(p) * (trigger.end - trigger.start);
      window.scrollTo({ top, behavior: 'smooth' });
    },
    getState() { return current; }
  };
}
