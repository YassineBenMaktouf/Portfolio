export const LANGS = ['en', 'fr'];

export function detectLanguage({ stored = null, browserLangs = [] } = {}) {
  if (LANGS.includes(stored)) return stored;
  const first = browserLangs.find((l) => typeof l === 'string' && l.length > 0);
  return first && first.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export function safeStorage(storage) {
  return {
    get(key) {
      try { return storage ? storage.getItem(key) : null; } catch { return null; }
    },
    set(key, value) {
      try { if (storage) storage.setItem(key, value); } catch { /* storage blocked: ignore */ }
    }
  };
}

export function createI18n(ui, lang) {
  let current = LANGS.includes(lang) ? lang : 'en';
  const listeners = new Set();
  function t(key, vars = {}) {
    const own = ui?.[current]?.[key];
    const raw = (typeof own === 'string' && own !== '') ? own : (ui?.en?.[key] || key);
    return String(raw).replace(/\{(\w+)\}/g, (match, name) => (vars[name] ?? match));
  }
  return {
    get lang() { return current; },
    t,
    setLang(next) {
      if (!LANGS.includes(next) || next === current) return;
      current = next;
      listeners.forEach((fn) => fn(current));
    },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  };
}

export function applyI18n(root, t) {
  // A missing translation comes back as its own key: keep the text already in the page instead.
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const text = t(el.dataset.i18n);
    if (text !== el.dataset.i18n) el.textContent = text;
  });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const label = t(el.dataset.i18nAria);
    if (label !== el.dataset.i18nAria) el.setAttribute('aria-label', label);
  });
}
