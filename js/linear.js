import { ISLANDS } from './layout.js';
import { stripViewBox, fullViewBox } from './timeline-model.js';

const box = (v) => `${v.x.toFixed(1)} ${v.y.toFixed(1)} ${v.w.toFixed(1)} ${v.h.toFixed(1)}`;

// The phone journal's red ribbon bookmark: a short tab at the top that grows to its full length
// as the visitor reads down the page.
export function ribbonLength(progress, max = 360, min = 24) {
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  return Math.round(min + p * (max - min));
}

// The address follows the section being read, so a reload or a shared link lands in the same place.
export function hashForKey(key, ids) {
  if (key === 'contact') return '#contact';
  if (typeof key === 'number' && ids[key]) return `#${ids[key]}`;
  return '';
}

// Is an element on screen (below the fixed header and tabs, with a small margin)? Checked in both
// scroll directions, so entries fade in when they arrive and out again when they leave.
export const REVEAL_MARGIN = 40;
export function isInView(rect, viewportHeight, top = 0, margin = REVEAL_MARGIN) {
  return rect.top < viewportHeight - margin && rect.bottom > top + margin;
}

const IDS = ISLANDS.map((isl) => isl.id);
const REVEAL = '.linear-hero, .leg-title, .entry, .letter-static';

export function initLinear({ stage, svg, linearEl, card, onIsland }) {
  const ribbon = document.getElementById('ribbon');
  const hero = card.cloneNode(true);
  hero.removeAttribute('id');
  hero.classList.add('title-card-static');
  const heroWrap = document.createElement('header');
  heroWrap.className = 'linear-hero';
  heroWrap.appendChild(hero);
  linearEl.prepend(heroWrap);

  const focusOn = (key) => {
    // the journal hides the map; only move it when it is actually on screen
    if (stage.clientWidth > 0) {
      const aspect = stage.clientWidth / Math.max(1, stage.clientHeight);
      const v = key === 'contact' || key === null ? fullViewBox() : stripViewBox(ISLANDS[key], aspect);
      svg.classList.add('is-switching');
      svg.setAttribute('viewBox', box(v));
      requestAnimationFrame(() => svg.classList.remove('is-switching'));
    }
    svg.querySelectorAll('.island').forEach((g, i) => {
      g.querySelectorAll('.scroll-icon').forEach((icon) => {
        icon.dataset.status = key === 'contact' || (typeof key === 'number' && i < key) ? 'read' : i === key ? 'next' : 'hidden';
      });
    });
    document.querySelectorAll('#markers .marker').forEach((m, i) => {
      m.dataset.status = key === 'contact' || (typeof key === 'number' && i < key) ? 'done' : i === key ? 'current' : 'upcoming';
    });
    onIsland(key);
  };

  // Active section = the last one whose top has passed 45% of the viewport. Measured on scroll
  // (one rAF per frame) rather than with IntersectionObserver, which can miss very tall sections
  // during long smooth scrolls and leave them invisible.
  let activeKey;
  let ticking = false;
  const update = () => {
    ticking = false;
    const line = window.innerHeight * 0.45;
    let key = null;
    linearEl.querySelectorAll('.leg').forEach((leg) => {
      if (leg.getBoundingClientRect().top <= line) {
        const raw = leg.dataset.islandIndex;
        key = raw === 'contact' ? 'contact' : Number(raw);
      }
    });
    const top = parseFloat(getComputedStyle(document.body).getPropertyValue('--journal-top')) || 0;
    linearEl.querySelectorAll(REVEAL).forEach((el) => {
      el.classList.toggle('is-visible', isInView(el.getBoundingClientRect(), window.innerHeight, top));
    });
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (ribbon) ribbon.style.height = `${ribbonLength(scrollable > 0 ? window.scrollY / scrollable : 0)}px`;
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom) key = 'contact';
    if (key !== activeKey) {
      // the first pass only reads the page: a link's #section is left for the navigation to honour
      const first = activeKey === undefined;
      activeKey = key;
      focusOn(key);
      if (!first) history.replaceState(null, '', hashForKey(key, IDS) || location.pathname + location.search);
    }
  };
  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  svg.style.opacity = '1';
  update();
  return {
    // Called after #linear is re-rendered (language switch): re-mark the new sections.
    refresh() { update(); },
    destroy() {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      heroWrap.remove();
      svg.style.removeProperty('opacity');
      ribbon?.style.removeProperty('height');
    }
  };
}
