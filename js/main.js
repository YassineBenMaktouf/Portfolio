import { loadContent, pick, ISLAND_IDS } from './content.js';
import { initNav } from './nav.js';
import { detectLanguage, safeStorage, createI18n, applyI18n } from './i18n.js';
import { chartSVG, setChartLabels } from './chart.js';
import { buildSchedule } from './timeline-model.js';
import { renderLinear, renderLetter, islandMeta } from './scrolls.js';
import { chooseMode } from './modes.js';
import { initLinear } from './linear.js';
import { createVoyage } from './voyage.js';
import { ISLANDS } from './layout.js';

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

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mode = chooseMode({ width: window.innerWidth, reducedMotion, search: location.search });
  document.body.classList.toggle('mode-voyage', mode === 'voyage');
  document.body.classList.toggle('mode-linear', mode === 'linear');

  const linearEl = document.getElementById('linear');
  const letterEl = document.getElementById('letter');
  const cvLink = document.getElementById('cv-link');
  const app = { content, ui, i18n, schedule, svg, mode, controller: null };

  function renderText() {
    document.documentElement.lang = i18n.lang;
    applyI18n(document, i18n.t);
    labelMarkers(i18n, content);
    setChartLabels(svg, titlesFor(content, i18n.lang), i18n.t('chart.harbour'), i18n.t('island'));
    cvLink.href = pick(content.person.cv, i18n.lang) || '#';
    letterEl.innerHTML = renderLetter({ person: content.person, lang: i18n.lang, t: i18n.t });
    const hero = linearEl.querySelector('.linear-hero');
    linearEl.innerHTML = renderLinear({ content, lang: i18n.lang, t: i18n.t });
    if (hero) {
      linearEl.prepend(hero);
      applyI18n(hero, i18n.t);
    }
    document.querySelectorAll('#lang-toggle button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === i18n.lang)));
    app.controller?.refresh();
  }

  renderText();
  document.getElementById('lang-toggle').addEventListener('click', (ev) => {
    const btn = ev.target.closest('button[data-lang]');
    if (!btn) return;
    i18n.setLang(btn.dataset.lang);
  });
  i18n.onChange((lang) => { storage.set('lang', lang); renderText(); });

  if (mode === 'linear') {
    linearEl.classList.remove('sr-only');
    app.controller = initLinear({
      stage: document.getElementById('stage'), svg, linearEl,
      card: document.getElementById('title-card'),
      onIsland: (key) => { document.body.dataset.phase = key === null ? 'landing' : 'hold'; }
    });
    app.controller.refresh = () => {};
  } else {
    app.controller = createVoyage(app);
  }

  initNav({
    markersEl: document.getElementById('markers'),
    ids: ISLAND_IDS,
    schedule,
    mode,
    scrollToProgress: (p) => app.controller.scrollToProgress(p),
    scrollToSection: (id) => document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
  });
  app.controller.refresh();   // re-render once so the markers and hash pick up the current state

  document.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-action="sail-again"]')) {
      if (app.mode === 'voyage') app.controller.scrollToProgress(0);
      else window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  });
  window.__voyage = app;
}

boot().catch((err) => {
  console.error(err);
  document.body.classList.add('boot-failed');
});
