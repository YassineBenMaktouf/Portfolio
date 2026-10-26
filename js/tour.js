// Automatic voyage: plays the whole portfolio like a video. Each schedule segment gets a duration,
// so open scrolls are held long enough to read and the sailing in between moves along.
export const TOUR_SECONDS = { landing: 2, unfold: 2.5, sail: 3, open: 0.9, hold: 5, close: 0.7, return: 2.5, end: 1.5 };
const LINEAR_SPEED = 110;   // px per second for the stacked phone layout

export function buildTour(schedule, seconds = TOUR_SECONDS) {
  let t = 0;
  const steps = schedule.segments.map((g) => {
    const t0 = t;
    t += (seconds[g.phase] ?? 1) * 1000;
    return { t0, t1: t, p0: g.start / schedule.total, p1: g.end / schedule.total };
  });
  return { steps, duration: t };
}

export function progressAt(tour, ms) {
  if (!(ms > 0)) return 0;
  if (ms >= tour.duration) return 1;
  const s = tour.steps.find((x) => ms < x.t1) || tour.steps.at(-1);
  return s.p0 + (s.p1 - s.p0) * ((ms - s.t0) / (s.t1 - s.t0));
}

export function timeAt(tour, p) {
  if (!(p > 0)) return 0;
  if (p >= 1) return tour.duration;
  const s = tour.steps.find((x) => p < x.p1) || tour.steps.at(-1);
  return s.t0 + (s.t1 - s.t0) * ((p - s.p0) / (s.p1 - s.p0));
}

export function initTour({ btn, t, getApp }) {
  let playing = false, raf = 0, last = 0, elapsed = 0, tour = null;

  const render = () => {
    btn.setAttribute('aria-pressed', String(playing));
    btn.setAttribute('aria-label', t(playing ? 'tour.pauseAria' : 'tour.playAria'));
    btn.querySelector('.tour-icon').textContent = playing ? '❚❚' : '▶';
    btn.querySelector('.tour-label').textContent = t(playing ? 'tour.pause' : 'tour.play');
  };

  const stop = () => {
    if (!playing) return;
    playing = false;
    cancelAnimationFrame(raf);
    render();
  };

  const frame = (ts) => {
    if (!playing) return;
    const dt = Math.min(ts - last, 50);   // a hidden tab or a slow frame never makes it jump
    last = ts;
    const app = getApp();
    if (app.mode === 'voyage') {
      elapsed += dt;
      const p = progressAt(tour, elapsed);
      app.controller.scrollToProgress(p, { instant: true });
      if (p >= 1) { stop(); return; }
    } else {
      window.scrollBy(0, (LINEAR_SPEED * dt) / 1000);
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) { stop(); return; }
    }
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    const app = getApp();
    if (app.mode === 'voyage') {
      tour = buildTour(app.schedule);
      let p = app.controller.getProgress?.() ?? 0;
      if (p >= 0.999) { p = 0; app.controller.scrollToProgress(0, { instant: true }); }
      elapsed = timeAt(tour, p);
    } else if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      window.scrollTo(0, 0);
    }
    playing = true;
    render();
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  btn.addEventListener('click', () => (playing ? stop() : start()));
  // Any sign the visitor wants to steer stops the tour.
  ['wheel', 'touchstart'].forEach((type) => window.addEventListener(type, stop, { passive: true }));
  window.addEventListener('keydown', (ev) => { if (ev.target !== btn) stop(); });
  document.addEventListener('pointerdown', (ev) => { if (!btn.contains(ev.target)) stop(); });

  render();
  return { stop, refresh: render };
}
