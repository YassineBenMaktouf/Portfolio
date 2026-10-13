export const ISLAND_IDS = ['about', 'education', 'experience', 'projects', 'skills'];

export function pick(value, lang) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'object') {
    if (typeof value[lang] === 'string' && value[lang] !== '') return value[lang];
    if (typeof value.en === 'string') return value.en;
  }
  return '';
}

export function validateContent(data) {
  const errors = [];
  if (!data || typeof data !== 'object') return ['content is not an object'];
  if (!data.person || !pick(data.person.name, 'en')) errors.push('person.name is required');
  if (!Array.isArray(data.islands) || data.islands.length !== ISLAND_IDS.length) {
    errors.push(`islands must be an array of ${ISLAND_IDS.length}`);
    return errors;
  }
  data.islands.forEach((island, i) => {
    if (island.id !== ISLAND_IDS[i]) errors.push(`island ${i} must have id "${ISLAND_IDS[i]}" (found "${island.id}")`);
    if (!pick(island.title, 'en')) errors.push(`${island.id}: title.en is required`);
    if (!Array.isArray(island.scrolls)) errors.push(`${island.id}: scrolls must be an array`);
  });
  return errors;
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  return res.json();
}

export async function loadContent(base = '.') {
  const [content, ui] = await Promise.all([
    fetchJSON(`${base}/content/content.json`),
    fetchJSON(`${base}/content/i18n.json`)
  ]);
  const errors = validateContent(content);
  if (errors.length) console.warn('Content problems:\n- ' + errors.join('\n- '));
  return { content, ui };
}
