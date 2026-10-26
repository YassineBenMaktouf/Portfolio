// Small solid icons for buttons. They use currentColor, so they match the button text, and a mask
// to cut a thin gap between overlapping parts (pen over scroll, hand over page).
let uid = 0;
const svg = (cls, id, body) =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">${body.replaceAll('MASK', id)}</svg>`;

// a scroll with a pen across it ("write to me")
export function iconWrite() {
  const id = `icon-mask-${++uid}`;
  return svg('icon-write', id,
    '<defs><mask id="MASK" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">'
    + '<rect width="24" height="24" fill="white"/>'
    + '<path d="M0.3 5.6 L4.6 2.1 L13.1 12.5 L14.2 18.2 L8.7 16 Z" fill="black"/>'
    + '</mask></defs>'
    + '<path mask="url(#MASK)" fill="currentColor" d="M8.5 3 H18 a3 3 0 0 1 0 6 h-0.5 v9 a3 3 0 0 1 -3 3 H5 a3 3 0 0 1 0 -6 h1.5 V5 a2 2 0 0 1 2 -2 Z"/>'
    + '<path fill="currentColor" d="M2 5.8 L4.4 3.8 L12.1 13.3 L12.8 16.6 L9.7 15.2 Z"/>');
}

// a hand holding a page ("download CV")
export function iconCv() {
  const id = `icon-mask-${++uid}`;
  const hand = '<rect x="7" y="8.5" width="3" height="8" rx="1.5"/>'
    + '<rect x="7" y="13.6" width="6.4" height="2.4" rx="1.2"/>'
    + '<rect x="7" y="16.4" width="5.8" height="2.4" rx="1.2"/>'
    + '<rect x="4" y="13" width="5" height="8" rx="1.5"/>';
  return svg('icon-cv', id,
    '<defs><mask id="MASK" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">'
    + '<rect width="24" height="24" fill="white"/>'
    + `<g fill="black" stroke="black" stroke-width="1.4">${hand}</g>`
    + '<g fill="black"><rect x="12" y="5.4" width="6" height="1.4" rx="0.7"/><rect x="12" y="8.4" width="6" height="1.4" rx="0.7"/>'
    + '<rect x="12" y="11.4" width="6" height="1.4" rx="0.7"/><rect x="14.5" y="14.4" width="3.5" height="1.4" rx="0.7"/></g>'
    + '</mask></defs>'
    + '<rect mask="url(#MASK)" fill="currentColor" x="9" y="2" width="12" height="16" rx="1.2"/>'
    + `<g fill="currentColor">${hand}<rect x="3.4" y="21.4" width="6.6" height="1.8" rx="0.4"/></g>`);
}
