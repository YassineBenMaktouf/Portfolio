export const BREAKPOINT = 1024;  // below this width the page is the stacked list (phones, portrait tablets, small windows)

export function chooseMode({ width, reducedMotion, animationAvailable = true, forceList = false }) {
  if (!animationAvailable) return 'linear';   // GSAP blocked/offline: never strand the content
  if (forceList || reducedMotion) return 'linear';
  return width < BREAKPOINT ? 'linear' : 'voyage';
}
