import { renderCvList } from './scrolls.js';

// CV chooser: any [data-action="cv"] link opens the dialog; picking a version shows its preview
// and points the Download button at its PDF. Without JavaScript the links download directly.
export function initCvModal({ dialog, t, getPerson, getLang }) {
  const list = dialog.querySelector('#cv-modal-list');
  const preview = dialog.querySelector('#cv-preview');
  const label = dialog.querySelector('#cv-preview-label');
  const download = dialog.querySelector('#cv-download');
  const closeBtn = dialog.querySelector('#cv-modal-close');
  let opener = null;

  const select = (btn) => {
    list.querySelectorAll('.cv-choice').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    const file = btn.dataset.cvFile;
    preview.src = btn.dataset.cvPreview || '';
    preview.alt = t('cv.previewAlt', { label: btn.dataset.cvLabel });
    preview.hidden = !btn.dataset.cvPreview;
    label.textContent = btn.dataset.cvLabel;
    download.href = file;
    download.setAttribute('download', file.split('/').pop());
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
    const link = ev.target.closest('[data-action="cv"]');
    if (!link) return;
    const person = getPerson();
    if (!person.cvs?.length) return;               // nothing to choose from: let the link download
    ev.preventDefault();
    opener = link;
    list.innerHTML = renderCvList({ person, lang: getLang(), t });
    const choices = [...list.querySelectorAll('.cv-choice')];
    // start on the first version, in the language the visitor is reading
    const langName = getLang() === 'fr' ? t('cv.french') : t('cv.english');
    const first = choices.find((b) => b.textContent === langName) || choices[0];
    if (first) select(first);
    document.documentElement.classList.add('modal-open');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    (first || closeBtn).focus({ preventScroll: true });
  });
  list.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.cv-choice');
    if (btn) select(btn);
  });
  closeBtn.addEventListener('click', close);
  dialog.addEventListener('click', (ev) => { if (ev.target === dialog) close(); });
}
