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
    onIsland(key);
  };

  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((en) => en.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const raw = visible.target.dataset.islandIndex;
    focusOn(raw === 'contact' ? 'contact' : Number(raw));
    visible.target.classList.add('is-visible');
  }, { rootMargin: '-35% 0px -45% 0px', threshold: [0, 0.25, 0.5] });

  linearEl.querySelectorAll('.leg').forEach((leg) => observer.observe(leg));
  svg.style.opacity = '1';
  focusOn(null);
  return { destroy() { observer.disconnect(); } };
}
