import { islandProgress, markerStatus, hashForState } from './timeline-model.js';

export function resolveHash(hash, ids) {
  if (typeof hash !== 'string') return null;
  const key = hash.replace(/^#/, '').trim().toLowerCase();
  if (!key) return null;
  if (key === 'contact') return 'contact';
  const i = ids.indexOf(key);
  return i >= 0 ? i : null;
}

export function targetProgress(target, schedule) {
  if (target === 'contact') return 1;
  if (typeof target !== 'number') return null;
  return islandProgress(schedule, target);
}

export function initNav({ markersEl, ids, schedule, mode, scrollToProgress, scrollToSection }) {
  const go = (target) => {
    if (target === null) return;
    if (mode === 'voyage') {
      const p = targetProgress(target, schedule);
      if (p !== null) scrollToProgress(p);
    } else {
      scrollToSection(target === 'contact' ? 'leg-contact' : `leg-${ids[target]}`);
    }
  };

  markersEl.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.marker');
    if (btn) go(Number(btn.dataset.index));
  });
  window.addEventListener('hashchange', () => go(resolveHash(location.hash, ids)));
  const initial = resolveHash(location.hash, ids);
  if (initial !== null) requestAnimationFrame(() => go(initial));

  let lastHash = location.hash;
  document.addEventListener('voyage:state', (ev) => {
    const state = ev.detail;
    markersEl.querySelectorAll('.marker').forEach((m, i) => { m.dataset.status = markerStatus(state, i); });
    const hash = hashForState(state, ids);
    if (hash !== lastHash) {
      lastHash = hash;
      history.replaceState(null, '', hash || location.pathname + location.search);
    }
  });
}
