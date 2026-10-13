const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => MAP[c]);
}

export function safeUrl(url) {
  if (typeof url !== 'string') return '#';
  const u = url.trim();
  if (/^(https?:|mailto:)/i.test(u)) return u;
  if (u.startsWith('//')) return '#';
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return '#';
  return u;
}
