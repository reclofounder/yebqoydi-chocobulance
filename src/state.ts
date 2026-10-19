import { HOOK, LAUNCH_DATE, MODE, PHONE, PHONE_TEL } from './config';
import { t } from './i18n';

/** Sets the text and tags the element with its key, so a later applyI18n keeps it in sync. */
function setCopy(el: HTMLElement, key: string): void {
  el.dataset.i18n = key;
  el.textContent = t(key);
}

/** Turns a call-to-action into an inert span (in place if it already is one). */
function disableCta(el: HTMLElement, key: string): void {
  let span = el;
  if (el.localName !== 'span') {
    span = el.ownerDocument.createElement('span');
    span.className = el.className;
    span.setAttribute('data-cta', el.getAttribute('data-cta') ?? '');
    el.replaceWith(span);
  }
  span.classList.add('cta--disabled');
  span.setAttribute('aria-disabled', 'true');
  setCopy(span, key);
}

/** Applies the campaign mode (`MODE`) to every CTA and state note under `root`. */
export function applyMode(root: ParentNode): void {
  if (MODE === 'live') {
    for (const link of root.querySelectorAll<HTMLAnchorElement>('a[data-cta]')) {
      link.setAttribute('href', PHONE_TEL);
    }
    return;
  }

  for (const el of root.querySelectorAll<HTMLElement>('[data-cta]')) {
    disableCta(el, `state.${MODE}.cta`);
  }
  // Only the teaser has a variant for "launch date not announced yet".
  const noteKey =
    MODE === 'teaser' && !LAUNCH_DATE ? 'state.teaser.note.nodate' : `state.${MODE}.note`;
  for (const el of root.querySelectorAll<HTMLElement>('[data-state-note]')) {
    setCopy(el, noteKey);
  }
}

/** Shows the "or {phone}" hint only when the dial number differs from the campaign hook. */
export function applyPhoneHint(root: ParentNode): void {
  const show = PHONE !== HOOK;
  for (const el of root.querySelectorAll<HTMLElement>('[data-phone-hint]')) {
    el.toggleAttribute('hidden', !show);
    if (show) setCopy(el, 'cta.or');
  }
}
