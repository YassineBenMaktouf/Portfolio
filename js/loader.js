// Ship's-wheel loading screen: part of the page itself so it shows instantly, then fades into the
// site once it's ready. At least 1.5 s so the wheel can turn, never more than 4 s, on every page load.
export const LOADER = { min: 1500, max: 4000, minReduced: 400, fade: 600 };

// How long to keep the loader up from now. `elapsed` is the time since the page started loading.
export function hideDelay({ elapsed, ready, reducedMotion = false }) {
  if (!ready) return Math.max(0, LOADER.max - elapsed);
  return Math.max(0, (reducedMotion ? LOADER.minReduced : LOADER.min) - elapsed);
}

export function initLoader({ el, reducedMotion, ready }) {
  const root = document.documentElement;
  if (!el) return { hide() {} };
  let done = false;
  const hide = () => {
    if (done) return;
    done = true;
    el.classList.add('is-done');
    root.classList.remove('loading');
    setTimeout(() => el.remove(), LOADER.fade + 100);
  };
  // hard limit, even if the site never reports ready
  setTimeout(hide, hideDelay({ elapsed: performance.now(), ready: false }));
  ready.then(() => setTimeout(hide, hideDelay({ elapsed: performance.now(), ready: true, reducedMotion })));
  // a click, tap or key press skips it
  ['pointerdown', 'keydown'].forEach((type) => window.addEventListener(type, hide, { once: true }));
  return { hide };
}
