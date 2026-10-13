export function chooseMode({ width, reducedMotion, search = '', animationAvailable = true }) {
  if (!animationAvailable) return 'linear';   // GSAP blocked/offline: never strand the content
  if (/(^|[?&])view=list(&|$)/.test(search)) return 'linear';
  if (reducedMotion) return 'linear';
  return width < 768 ? 'linear' : 'voyage';
}
