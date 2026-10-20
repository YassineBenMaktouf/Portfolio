import { pick } from './content.js';
import { escapeHTML as e, safeUrl } from './escape.js';
import { ISLANDS } from './layout.js';

export function islandMeta(content, lang) {
  return content.islands.map((isl, i) => ({ id: isl.id, num: ISLANDS[i].num, kind: isl.kind, title: pick(isl.title, lang) }));
}

const tags = (items, lang) => (items?.length
  ? `<ul class="tags">${items.map((x) => `<li class="tag">${e(pick(x, lang))}</li>`).join('')}</ul>` : '');

function kicker({ island, index, total, t }, meta = '') {
  return `<p class="scroll-kicker"><span>${e(t('island'))} ${island.num} · ${e(t('scroll.of', { n: index + 1, total }))}</span>`
    + (meta ? `<span>${e(meta)}</span>` : '') + '</p>';
}

function externalLink(url, label) {
  const href = safeUrl(url);
  const external = /^https?:/i.test(href);
  return `<a href="${e(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${e(label)} ↗</a>`;
}

const RENDERERS = {
  about({ item, person, lang, t }) {
    const name = pick(person.name, lang);
    const photo = person.photo
      ? `<img class="portrait" src="${e(safeUrl(person.photo))}" alt="${e(t('about.photoAlt', { name }))}" width="92" height="112">`
      : '<span class="portrait portrait-placeholder" aria-hidden="true"></span>';
    const fact = (key, value) => `<div class="fact"><dt>${e(t(key))}</dt><dd>${e(pick(value, lang))}</dd></div>`;
    return `<div class="about-head">${photo}<div><h3 class="scroll-title">${e(name)}</h3>`
      + `<p class="scroll-sub">${e(pick(person.role, lang))}</p></div></div>`
      + `<p class="scroll-lede">${e(pick(item.bio, lang))}</p>`
      + `<dl class="facts">${fact('about.homePort', item.homePort)}${fact('about.languages', item.languages)}${fact('about.seeking', item.seeking)}</dl>`;
  },
  education({ item, lang, t }) {
    return `<h3 class="scroll-title">${e(pick(item.degree, lang))}</h3>`
      + `<p class="scroll-place">${e(pick(item.school, lang))}, ${e(pick(item.city, lang))}</p>`
      + `<p class="scroll-text">${e(pick(item.summary, lang))}</p>`
      + (item.courses?.length ? `<p class="scroll-label">${e(t('education.courses'))}</p>${tags(item.courses, lang)}` : '');
  },
  experience({ item, lang }) {
    const points = (item.points || []).map((p) => `<li>${e(pick(p, lang))}</li>`).join('');
    return `<h3 class="scroll-title">${e(pick(item.role, lang))}</h3>`
      + `<p class="scroll-place">${e(pick(item.company, lang))} · ${e(pick(item.city, lang))}</p>`
      + (points ? `<ul class="points">${points}</ul>` : '') + tags(item.tools, lang);
  },
  project({ item, lang }) {
    const links = (item.links || []).map((l) => `<li>${externalLink(l.url, pick(l.label, lang))}</li>`).join('');
    const art = item.illustration === 'triangle'
      ? '<svg class="illus" role="img" aria-label="Run-off triangle" width="120" height="72" viewBox="0 0 120 72"><path d="M0 0 H120 V12 H100 V24 H80 V36 H60 V48 H40 V60 H20 V72 H0 Z" fill="none" stroke="#1C2B4A"/><path d="M100 0 H120 V12 H100 Z M80 12 H100 V24 H80 Z M60 24 H80 V36 H60 Z M40 36 H60 V48 H40 Z M20 48 H40 V60 H20 Z M0 60 H20 V72 H0 Z" fill="#A8834A"/></svg>'
      : '';
    return `<h3 class="scroll-title">${e(pick(item.title, lang))}</h3>`
      + `<p class="scroll-lede">${e(pick(item.summary, lang))}</p>` + art + tags(item.tools, lang)
      + (links ? `<ul class="links">${links}</ul>` : '');
  },
  skills({ item, lang, t }) {
    if (item.type === 'certifications') {
      const certs = (item.items || []).map((c) => {
        const name = pick(c.name, lang);
        const label = c.url && safeUrl(c.url) !== '#' ? externalLink(c.url, name) : e(name);
        return `<li><span class="seal" aria-hidden="true"></span><span>${label}`
          + `<small>${e([pick(c.issuer, lang), pick(c.year, lang)].filter(Boolean).join(' · '))}</small></span></li>`;
      }).join('');
      return `<h3 class="scroll-title">${e(pick(item.title, lang) || t('certs.title'))}</h3><ul class="certs">${certs}</ul>`;
    }
    const groups = (item.groups || []).map((g) => `<div class="skill-group"><h4>${e(pick(g.name, lang))}</h4>${tags(g.items, lang)}</div>`).join('');
    return `<h3 class="scroll-title">${e(pick(item.title, lang) || t('skills.title'))}</h3>${groups}`;
  }
};

function metaFor(island, item, lang, t) {
  if (island.kind === 'education') return pick(item.years, lang);
  if (island.kind === 'experience') return pick(item.dates, lang);
  if (island.kind === 'project') return item.category === 'data' ? t('project.data') : t('project.actuarial');
  return '';
}

export function renderScroll({ island, item, index, total, person, lang, t }) {
  const body = (RENDERERS[island.kind] || RENDERERS.about)({ island, item, person, lang, t });
  return kicker({ island, index, total, t }, metaFor(island, item, lang, t)) + body;
}

export function scrollFrame(innerHTML) {
  return `<div class="scroll"><div class="roller"></div><div class="scroll-body"><div class="scroll-content">${innerHTML}</div></div><div class="roller"></div></div>`;
}

export function scrollLabel({ island, item, lang, t }) {
  switch (island.kind) {
    case 'education': return pick(item.degree, lang);
    case 'experience': return pick(item.role, lang);
    case 'project': return pick(item.title, lang);
    case 'skills': return item.type === 'certifications' ? (pick(item.title, lang) || t('certs.title')) : (pick(item.title, lang) || t('skills.title'));
    default: return island.title;
  }
}

export function cvHref(person, lang) {
  const raw = pick(person?.cv, lang);
  return raw ? safeUrl(raw) : '#';
}

export function renderLetter({ person, lang, t }) {
  const email = String(person.email || '').trim();
  const row = (label, href) => `<li><span>${e(label)}</span>${href}</li>`;
  return '<div class="letter-inner">'
    + '<span class="letter-seal" aria-hidden="true">Y</span>'
    + `<p class="letter-kicker">${e(t('end.kicker'))}</p>`
    + `<h2 class="letter-title">${e(t('end.title'))}<br><em>${e(t('end.titleEm'))}</em></h2>`
    + `<p class="letter-sub">${e(t('end.subtitle'))}</p>`
    + '<ul class="letter-links">'
    + (email ? row(t('end.email'), `<a href="${e(safeUrl('mailto:' + email))}">${e(email)}</a>`) : '')
    + (person.linkedin ? row('LinkedIn', externalLink(person.linkedin, 'LinkedIn')) : '')
    + (person.github ? row('GitHub', externalLink(person.github, 'GitHub')) : '')
    + '</ul>'
    + '<div class="letter-actions">'
    + `<a class="btn btn-solid" href="${e(cvHref(person, lang))}" download>${e(t('header.cv'))}</a>`
    + `<button type="button" class="btn btn-outline" data-action="sail-again">↺ ${e(t('end.again'))}</button>`
    + '</div></div>';
}

export function renderLinear({ content, lang, t }) {
  const meta = islandMeta(content, lang);
  const legs = content.islands.map((isl, i) => {
    const m = meta[i];
    const scrolls = isl.scrolls.map((item, j) => scrollFrame(renderScroll({ island: m, item, index: j, total: isl.scrolls.length, person: content.person, lang, t }))).join('');
    return `<section class="leg" id="leg-${m.id}" data-island-index="${i}" aria-labelledby="leg-${m.id}-title">`
      + `<h2 class="leg-title" id="leg-${m.id}-title"><span class="leg-num">${e(t('island'))} ${m.num}</span>${e(m.title)}</h2>${scrolls}</section>`;
  }).join('');
  return legs + `<section class="leg leg-contact" id="leg-contact" data-island-index="contact" aria-label="${e(t('contact'))}">`
    + `<div class="letter letter-static">${renderLetter({ person: content.person, lang, t })}</div></section>`;
}
