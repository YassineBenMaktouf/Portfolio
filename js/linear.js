import { ISLANDS } from './layout.js';
import { stripViewBox, fullViewBox } from './timeline-model.js';

const box = (v) => `${v.x.toFixed(1)} ${v.y.toFixed(1)} ${v.w.toFixed(1)} ${v.h.toFixed(1)}`;

export function initLinear({ stage, svg, linearEl, card, onIsland }) {
  const hero = card.cloneNode(true);
  hero.removeAttribute('id');
  hero.classList.add('title-card-static');
  const heroWrap = document.createElement('header');
  heroWrap.className = 'linear-hero';
  heroWrap.appendChild(hero);
  linearEl.prepend(heroWrap);

  const focusOn = (key) => {
    const aspect = stage.clientWidth / Math.max(1, stage.clientHeight);
    const v = key === 'contact' || key === null ? fullViewBox() : stripViewBox(ISLANDS[key], aspect);
    svg.classList.add('is-switching');
    svg.setAttribute('viewBox', box(v));
    requestAnimationFrame(() => svg.classList.remove('is-switching'));
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
        leg.classList.add('is-visible');
        const raw = leg.dataset.islandIndex;
        key = raw === 'contact' ? 'contact' : Number(raw);
      }
    });
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom) {
      linearEl.querySelectorAll('.leg').forEach((leg) => leg.classList.add('is-visible'));
      key = 'contact';
    }
    if (key !== activeKey) {
      activeKey = key;
      focusOn(key);
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
    refresh() { activeKey = undefined; update(); },
    destroy() {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      heroWrap.remove();
      svg.style.removeProperty('opacity');
    }
  };
}
