import { SX, SY, ISLANDS, ROUTE_POINTS, COMPASS, HARBOUR, VIEW } from './layout.js';
import { blobPath, catmullRomPath, rhumbLines, soundings, islandScrollSlots } from './geometry.js';
import { escapeHTML } from './escape.js';

export function splitTitle(title) {
  const s = String(title ?? '');
  if (s.length <= 14) return [s];
  const amp = s.indexOf(' & ');
  if (amp > 0) return [s.slice(0, amp + 2), s.slice(amp + 3)];
  const mid = Math.ceil(s.length / 2);
  let best = -1;
  for (let i = 0; i < s.length; i++) if (s[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  return best > 0 ? [s.slice(0, best), s.slice(best + 1)] : [s];
}

export function zoomFontSize(island, lines) {
  const longest = Math.max(1, ...lines.map((l) => l.length));
  return +Math.min(island.R * 0.32, (1.6 * island.R * SX) / (longest * 0.92)).toFixed(2);
}

export function labelsMarkup(island, title, islandWord = 'Island') {
  const lines = splitTitle(title);
  const fullSize = Math.round(island.R * 0.3);
  const zoomSize = zoomFontSize(island, lines);
  const fullTop = island.cy - ((lines.length - 1) * fullSize * 1.05) / 2;
  const full = `<text class="label-full" x="${island.cx}" y="${(fullTop - fullSize * 0.55).toFixed(1)}" text-anchor="middle">`
    + `<tspan class="num" x="${island.cx}" font-size="7.5">${escapeHTML(String(islandWord).toUpperCase())} ${island.num}</tspan>`
    + lines.map((l, i) => `<tspan class="name" x="${island.cx}" dy="${i === 0 ? fullSize * 0.95 : fullSize * 1.05}" font-size="${fullSize}">${escapeHTML(l)}</tspan>`).join('')
    + '</text>';
  const zoomTop = island.cy - ((lines.length - 1) * zoomSize * 1.3) / 2 + zoomSize * 0.35;
  const zoom = `<text class="label-zoom" x="${island.cx}" y="${zoomTop.toFixed(1)}" text-anchor="middle" font-size="${zoomSize}">`
    + lines.map((l, i) => `<tspan x="${island.cx}" dy="${i === 0 ? 0 : zoomSize * 1.3}">${escapeHTML(l.toUpperCase())}</tspan>`).join('')
    + '</text>';
  return full + zoom;
}

function iconMarkup([x, y], j) {
  return `<g class="scroll-icon" data-scroll="${j}" data-status="hidden" transform="translate(${x} ${y}) scale(0.6)">`
    + '<circle class="halo" r="14"/>'
    + '<rect class="paper" x="-6" y="-8" width="12" height="16" rx="1.5"/>'
    + '<rect class="rod" x="-8" y="-10" width="16" height="4" rx="2"/>'
    + '<rect class="rod" x="-8" y="6" width="16" height="4" rx="2"/>'
    + '<path class="tick" d="M-5 15 l3 3 l7 -8"/>'
    + '</g>';
}

function islandMarkup(island, title, count, islandWord) {
  const ripples = [3, 2, 1].map((j) => `<path class="ripple" d="${blobPath(island.cx, island.cy, island.R + j * 11, island.k, SX, SY)}" opacity="${(0.2 + 0.1 * (3 - j)).toFixed(2)}"/>`).join('');
  const coast = `<path class="coast" d="${blobPath(island.cx, island.cy, island.R, island.k, SX, SY)}"/>`;
  const icons = islandScrollSlots(island, count).map(iconMarkup).join('');
  return `<g class="island" data-island="${island.id}">${ripples}${coast}<g class="labels">${labelsMarkup(island, title, islandWord)}</g><g class="icons">${icons}</g></g>`;
}

const COMPASS_MARKUP = `<g class="compass" transform="translate(${COMPASS.x} ${COMPASS.y})">`
  + '<circle r="72" class="compass-ring"/><circle r="64" class="compass-ring-brass"/>'
  + '<path class="compass-ink" d="M0 -86 L10 -10 L0 0 Z M0 86 L-10 10 L0 0 Z M86 0 L10 10 L0 0 Z M-86 0 L-10 -10 L0 0 Z"/>'
  + '<path class="compass-brass" d="M0 -86 L-10 -10 L0 0 Z M0 86 L10 10 L0 0 Z M86 0 L10 -10 L0 0 Z M-86 0 L-10 10 L0 0 Z"/>'
  + '<path class="compass-ink" opacity="0.7" d="M42 -42 L6 -2 L0 0 Z M-42 42 L-6 2 L0 0 Z M42 42 L2 6 L0 0 Z M-42 -42 L-2 -6 L0 0 Z"/>'
  + '</g>'
  + `<text class="compass-n" x="${COMPASS.x - 6}" y="${COMPASS.y - 94}">N</text>`;

const BOAT_MARKUP = '<g id="boat" class="boat"><g class="boat-body">'
  + '<path class="hull" d="M-18 6 L18 6 L11 15 L-11 15 Z"/>'
  + '<path class="sail-main" d="M0 6 V-26 L15 3 Z"/>'
  + '<path class="sail-jib" d="M-2 4 V-19 L-13 4 Z"/>'
  + '</g></g>';

function excludeSounding(x, y) {
  const nearIsland = ISLANDS.some((s) => Math.hypot((x - s.cx) / SX, (y - s.cy) / SY) < s.R + 50);
  return nearIsland || (x < 410 && y < 310) || Math.hypot(x - COMPASS.x, y - COMPASS.y) < 105;
}

export function chartSVG({ titles = {}, scrollCounts = {}, harbourLabel = '', islandWord = 'Island' }) {
  const rhumbs = rhumbLines(COMPASS.x, COMPASS.y).map((d) => `<path d="${d}"/>`).join('');
  const depth = soundings({ exclude: excludeSounding }).map((s) => `<text x="${s.x}" y="${s.y}">${s.v}</text>`).join('');
  const islands = ISLANDS.map((isl) => islandMarkup(isl, titles[isl.id] ?? '', scrollCounts[isl.id] ?? 0, islandWord)).join('');
  const route = catmullRomPath(ROUTE_POINTS);
  return `<svg id="chart" class="chart" viewBox="0 0 ${VIEW.w} ${VIEW.h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">`
    + `<g class="chart-art"><g class="rhumbs">${rhumbs}</g><g class="soundings">${depth}</g>${COMPASS_MARKUP}`
    + `<path id="route" class="route" d="${route}"/><path id="route-done" class="route-done" d="${route}"/>`
    + `<g class="islands">${islands}</g>`
    + `<text class="harbour-label" x="${HARBOUR.x + 30}" y="${HARBOUR.y + 14}">${escapeHTML(harbourLabel)}</text></g>`
    + BOAT_MARKUP
    + '</svg>';
}

export function setChartLabels(svgEl, titles, harbourLabel, islandWord = 'Island') {
  ISLANDS.forEach((isl) => {
    const g = svgEl.querySelector(`.island[data-island="${isl.id}"] .labels`);
    if (g) g.innerHTML = labelsMarkup(isl, titles[isl.id] ?? '', islandWord);
  });
  const harbour = svgEl.querySelector('.harbour-label');
  if (harbour) harbour.textContent = harbourLabel;
}
