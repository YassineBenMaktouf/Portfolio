import { loadContent, pick, ISLAND_IDS } from './content.js';
import { initNav } from './nav.js';
import { detectLanguage, safeStorage, createI18n, applyI18n } from './i18n.js';
import { chartSVG, setChartLabels } from './chart.js';
import { buildSchedule } from './timeline-model.js';
import { renderLinear, renderLetter, islandMeta, cvHref } from './scrolls.js';
import { chooseMode, BREAKPOINT } from './modes.js';
import { initLinear } from './linear.js';
import { createVoyage } from './voyage.js';
import { ISLANDS } from './layout.js';
import { initCertModal } from './certmodal.js';
import { initContactModal } from './contactform.js';
import { initCvModal } from './cvmodal.js';
import { initTour } from './tour.js';
import { initSeaFx } from './seafx.js';

function getLocalStorage() {
  try { return window.localStorage; } catch { return null; }
}

function titlesFor(content, lang) {
  return Object.fromEntries(content.islands.map((isl) => [isl.id, pick(isl.title, lang)]));
}

function labelMarkers(i18n, content) {
  const meta = islandMeta(content, i18n.lang);
  document.querySelectorAll('#markers .marker').forEach((btn, i) => {
    btn.setAttribute('aria-label', i18n.t('marker.label', { num: ISLANDS[i].num, title: meta[i].title }));
  });
}

async function boot() {
  // The voyage is a story: always start at the landing card unless a deep link says otherwise.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const { content, ui } = await loadContent();
  const storage = safeStorage(getLocalStorage());
  const browserLangs = navigator.languages?.length ? navigator.languages : [navigator.language];
  const i18n = createI18n(ui, detectLanguage({ stored: storage.get('lang'), browserLangs }));

  const scrollCounts = content.islands.map((isl) => isl.scrolls.length);
  const schedule = buildSchedule(scrollCounts);
  const chartRoot = document.getElementById('chart-root');
  chartRoot.innerHTML = chartSVG({
    titles: titlesFor(content, i18n.lang),
    scrollCounts: Object.fromEntries(content.islands.map((isl) => [isl.id, isl.scrolls.length])),
    harbourLabel: i18n.t('chart.harbour'),
    islandWord: i18n.t('island')
  });
  const svg = document.getElementById('chart');

  const narrowQuery = window.matchMedia(`(max-width: ${BREAKPOINT - 1}px)`);
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animationAvailable = Boolean(window.gsap && window.ScrollTrigger);
  let forceList = false;   // set by the skip link: the visitor asked for the plain page
  const wantedMode = () => chooseMode({
    width: window.innerWidth, reducedMotion: motionQuery.matches, animationAvailable, forceList
  });

  const linearEl = document.getElementById('linear');
  const letterEl = document.getElementById('letter');
  const cvLink = document.getElementById('cv-link');
  const app = { content, ui, i18n, schedule, svg, mode: null, controller: null };
  let linearKey = null;   // island the linear page is showing (null = top, 'contact' = letter)

  // In voyage mode #linear is a visually hidden copy for screen readers: keep it out of the Tab order
  // so keyboard focus never lands on something invisible (keyboard users get the skip link instead).
  function syncLinearTabOrder() {
    linearEl.querySelectorAll('a, button').forEach((el) => {
      if (app.mode === 'voyage') el.setAttribute('tabindex', '-1');
      else el.removeAttribute('tabindex');
    });
  }

  function renderText() {
    document.documentElement.lang = i18n.lang;
    applyI18n(document, i18n.t);
    labelMarkers(i18n, content);
    setChartLabels(svg, titlesFor(content, i18n.lang), i18n.t('chart.harbour'), i18n.t('island'));
    cvLink.href = cvHref(content.person, i18n.lang);
    letterEl.innerHTML = renderLetter({ person: content.person, lang: i18n.lang, t: i18n.t });
    const hero = linearEl.querySelector('.linear-hero');
    linearEl.innerHTML = renderLinear({ content, lang: i18n.lang, t: i18n.t });
    if (hero) {
      linearEl.prepend(hero);
      applyI18n(hero, i18n.t);
    }
    syncLinearTabOrder();
    document.querySelectorAll('#lang-toggle button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === i18n.lang)));
    app.controller?.refresh();
    app.tour?.refresh();
  }

  renderText();
  document.getElementById('lang-toggle').addEventListener('click', (ev) => {
    const btn = ev.target.closest('button[data-lang]');
    if (!btn) return;
    i18n.setLang(btn.dataset.lang);
  });
  i18n.onChange((lang) => { storage.set('lang', lang); renderText(); });

  // Where the visitor is right now, as a nav target, so a mode switch can land them in the same place.
  function currentTarget() {
    if (app.mode === 'linear') return linearKey;
    const st = app.controller?.getState();
    if (!st) return null;
    if (st.phase === 'return' || st.phase === 'end') return 'contact';
    return st.island;
  }

  const nav = initNav({
    markersEl: document.getElementById('markers'),
    ids: ISLAND_IDS,
    schedule,
    getMode: () => app.mode,
    scrollToProgress: (p, opts) => app.controller.scrollToProgress(p, opts),
    scrollToSection: (id, { instant = false } = {}) => document.getElementById(id)?.scrollIntoView({ behavior: instant || motionQuery.matches ? 'auto' : 'smooth', block: 'start' })
  });

  function setMode(next) {
    if (next === app.mode) return;
    app.tour?.stop();
    const target = app.mode ? currentTarget() : null;
    const switching = app.mode !== null;
    app.controller?.destroy();
    app.mode = next;
    document.body.classList.toggle('mode-voyage', next === 'voyage');
    document.body.classList.toggle('mode-linear', next === 'linear');
    linearEl.classList.toggle('sr-only', next === 'voyage');
    syncLinearTabOrder();
    if (next === 'linear') {
      linearKey = null;
      app.controller = initLinear({
        stage: document.getElementById('stage'), svg, linearEl,
        card: document.getElementById('title-card'),
        onIsland: (key) => { linearKey = key; document.body.dataset.phase = key === null ? 'landing' : 'hold'; }
      });
      app.controller.scrollToProgress = () => {};
      app.controller.getState = () => null;
    } else {
      app.controller = createVoyage(app);
    }
    app.controller.refresh();   // re-render once so the markers and hash pick up the current state
    if (!switching) return;
    if (target !== null) nav.go(target, { instant: true });
    else window.scrollTo({ top: 0, behavior: 'auto' });
  }

  setMode(wantedMode());
  // The page follows the window: crossing the breakpoint (or toggling reduced motion) swaps modes live.
  const onQueryChange = () => setMode(wantedMode());
  narrowQuery.addEventListener('change', onQueryChange);
  motionQuery.addEventListener('change', onQueryChange);
  // Web fonts change the title card's height; re-measure once they are in.
  document.fonts?.ready.then(() => app.controller.refresh());

  initCertModal({ dialog: document.getElementById('cert-modal'), t: (k, v) => i18n.t(k, v) });
  app.tour = initTour({ btn: document.getElementById('tour-btn'), t: (k, v) => i18n.t(k, v), getApp: () => app });
  initSeaFx({
    stage: document.getElementById('stage'), layer: document.getElementById('seafx'),
    getState: () => ({
      reducedMotion: motionQuery.matches, hidden: document.hidden,
      modalOpen: document.documentElement.classList.contains('modal-open'),
      touring: Boolean(app.tour?.isPlaying()),
      reading: app.mode === 'voyage' && !document.getElementById('panel').classList.contains('is-empty')
    })
  });
  initCvModal({ dialog: document.getElementById('cv-modal'), t: (k, v) => i18n.t(k, v), getPerson: () => content.person, getLang: () => i18n.lang });
  initContactModal({
    dialog: document.getElementById('contact-modal'), t: (k, v) => i18n.t(k, v),
    getAccessKey: () => content.person.contactFormKey, getEmail: () => content.person.email
  });

  document.getElementById('skip-link').addEventListener('click', (ev) => {
    ev.preventDefault();
    forceList = true;
    setMode('linear');
    const first = document.getElementById(`leg-${ISLAND_IDS[0]}`);
    first?.scrollIntoView({ behavior: 'auto', block: 'start' });
    linearEl.setAttribute('tabindex', '-1');
    linearEl.focus({ preventScroll: true });
  });

  document.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-action="sail-again"]')) {
      if (app.mode === 'voyage') app.controller.scrollToProgress(0);
      else window.scrollTo({ top: 0, behavior: motionQuery.matches ? 'auto' : 'smooth' });
    }
  });
  window.__voyage = app;
}

boot().catch((err) => {
  console.error(err);
  // Never strand a visitor on the landing card: show whatever content was rendered as a plain page.
  document.body.classList.add('boot-failed');
  document.body.classList.remove('mode-voyage');
  document.body.classList.add('mode-linear');
  document.getElementById('linear')?.classList.remove('sr-only');
  document.getElementById('track')?.style.removeProperty('height');
});
