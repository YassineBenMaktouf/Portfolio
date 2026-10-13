const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => MAP[c]);
}

export function safeUrl(url) {
  if (typeof url !== 'string') return '#';
  // Browsers ignore tabs/newlines inside URLs and leading control characters,
  // so strip them before deciding (otherwise "java\tscript:" slips through).
  const u = url.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (/^(https?:|mailto:)/i.test(u)) return u;
  if (/^[\\/]{2}/.test(u)) return '#';   // "//x", "\\x", "/\x", "\/x" are all protocol-relative
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return '#';
  return u;
}
