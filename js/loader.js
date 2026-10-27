// Ship's-wheel loading screen: part of the page itself so it shows instantly, then fades into the
// site once it's ready. At least 1.5 s so the wheel can turn, never more than 4 s, once per session.
export const LOADER = { min: 1500, max: 4000, minReduced: 400, fade: 600 };
export const SEEN_KEY = 'voyage-loader-seen';

// How long to keep the loader up from now. `elapsed` is the time since the page started loading.
export function hideDelay({ elapsed, ready, reducedMotion = false }) {
  if (!ready) return Math.max(0, LOADER.max - elapsed);
  return Math.max(0, (reducedMotion ? LOADER.minReduced : LOADER.min) - elapsed);
}

// Show it unless this session has already seen it. Storage that fails never blocks the site.
export function shouldShowLoader(storage) {
  try {
    return !storage.get(SEEN_KEY);
  } catch {
    return true;
  }
}

export function initLoader({ el, storage, reducedMotion, ready }) {
  const root = document.documentElement;
  if (!el) return { hide() {} };
  if (!shouldShowLoader(storage)) {
    el.remove();
    root.classList.remove('loading');
    return { hide() {} };
  }
  let done = false;
  const hide = () => {
    if (done) return;
    done = true;
    el.classList.add('is-done');
    root.classList.remove('loading');
    try { storage.set(SEEN_KEY, '1'); } catch { /* private mode: it just shows again next time */ }
    setTimeout(() => el.remove(), LOADER.fade + 100);
  };
  // hard limit, even if the site never reports ready
  setTimeout(hide, hideDelay({ elapsed: performance.now(), ready: false }));
  ready.then(() => setTimeout(hide, hideDelay({ elapsed: performance.now(), ready: true, reducedMotion })));
  // a click, tap or key press skips it
  ['pointerdown', 'keydown'].forEach((type) => window.addEventListener(type, hide, { once: true }));
  return { hide };
}
