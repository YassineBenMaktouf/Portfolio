// Certificate viewer: any [data-cert-image] button opens its image in the <dialog id="cert-modal">.
export function initCertModal({ dialog, t }) {
  const img = dialog.querySelector('#cert-modal-img');
  const title = dialog.querySelector('#cert-modal-title');
  const closeBtn = dialog.querySelector('#cert-modal-close');
  let opener = null;

  const close = () => {
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
  };

  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('modal-open');
    img.removeAttribute('src');
    opener?.focus({ preventScroll: true });
    opener = null;
  });

  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-cert-image]');
    if (!btn) return;
    opener = btn;
    const name = btn.dataset.certTitle || '';
    img.src = btn.dataset.certImage;
    img.alt = t('cert.alt', { title: name });
    title.textContent = name;
    document.documentElement.classList.add('modal-open');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    closeBtn.focus({ preventScroll: true });
  });

  closeBtn.addEventListener('click', close);
  // A click on the backdrop (outside the parchment card) closes the viewer.
  dialog.addEventListener('click', (ev) => { if (ev.target === dialog) close(); });
}
