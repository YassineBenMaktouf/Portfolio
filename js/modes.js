export function chooseMode({ width, reducedMotion, search = '' }) {
  if (/(^|[?&])view=list(&|$)/.test(search)) return 'linear';
  if (reducedMotion) return 'linear';
  return width < 768 ? 'linear' : 'voyage';
}
