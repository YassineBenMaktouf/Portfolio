// Contact form: validation and delivery through Web3Forms (a static site can't send email itself).
export const WEB3FORMS_URL = 'https://api.web3forms.com/submit';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns { field: true } for each invalid field; an empty object means the form can be sent.
export function validateContact({ name = '', email = '', message = '' }) {
  const errors = {};
  const n = name.trim(), e = email.trim(), m = message.trim();
  if (!n || n.length > 100) errors.name = true;
  if (!EMAIL.test(e) || e.length > 200) errors.email = true;
  if (!m || m.length > 5000) errors.message = true;
  return errors;
}

export function buildPayload({ name, email, message, botcheck = false }, { accessKey, subject }) {
  return {
    access_key: accessKey,
    subject,
    from_name: 'Portfolio contact form',
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    botcheck: Boolean(botcheck)
  };
}

export async function submitContact(payload, fetchImpl = globalThis.fetch) {
  if (payload.botcheck) return { ok: true };   // a bot filled the hidden field: pretend it worked
  try {
    const res = await fetchImpl(WEB3FORMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    return { ok: Boolean(res.ok && data.success) };
  } catch {
    return { ok: false };
  }
}

// Wires the <dialog id="contact-modal">: opened by any [data-action="write"] button.
export function initContactModal({ dialog, t, getAccessKey, getEmail }) {
  const form = dialog.querySelector('#contact-form');
  const status = dialog.querySelector('#contact-status');
  const sendBtn = dialog.querySelector('#contact-send');
  const closeBtn = dialog.querySelector('#contact-modal-close');
  const fields = ['name', 'email', 'message'].map((k) => dialog.querySelector(`#contact-${k}`));
  let opener = null;

  const setError = (input, on) => {
    input.setAttribute('aria-invalid', String(on));
    const msg = dialog.querySelector(`#contact-${input.name}-error`);
    msg.textContent = on ? t(`contact.err.${input.name}`) : '';
  };
  const reset = () => {
    form.reset();
    form.hidden = false;
    fields.forEach((f) => setError(f, false));
    status.textContent = '';
    status.className = 'contact-status';
    sendBtn.disabled = false;
  };
  const close = () => {
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
  };

  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('modal-open');
    opener?.focus({ preventScroll: true });
    opener = null;
  });
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-action="write"]');
    if (!btn) return;
    opener = btn;
    reset();
    document.documentElement.classList.add('modal-open');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    fields[0].focus({ preventScroll: true });
  });
  closeBtn.addEventListener('click', close);
  dialog.addEventListener('click', (ev) => { if (ev.target === dialog) close(); });
  fields.forEach((f) => f.addEventListener('input', () => setError(f, false)));

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const values = Object.fromEntries(fields.map((f) => [f.name, f.value]));
    const errors = validateContact(values);
    fields.forEach((f) => setError(f, Boolean(errors[f.name])));
    const firstBad = fields.find((f) => errors[f.name]);
    if (firstBad) { firstBad.focus(); return; }

    sendBtn.disabled = true;
    status.className = 'contact-status';
    status.textContent = t('contact.sending');
    const payload = buildPayload({ ...values, botcheck: form.elements.botcheck?.checked },
      { accessKey: getAccessKey(), subject: t('contact.subject', { name: values.name.trim() }) });
    const { ok } = await submitContact(payload);
    if (ok) {
      form.hidden = true;
      status.className = 'contact-status is-sent';
      status.textContent = t('contact.sent');
      closeBtn.focus({ preventScroll: true });
    } else {
      sendBtn.disabled = false;
      status.className = 'contact-status is-error';
      status.textContent = t('contact.error', { email: getEmail() });
    }
  });
}
