import { MODE, PHONE_TEL } from './config';
import { t } from './i18n';

/** Sets the text and tags the element with its key, so a later applyI18n keeps it in sync. */
function setCopy(el: HTMLElement, key: string): void {
  el.dataset.i18n = key;
  el.textContent = t(key);
}

/** Turns a call button into an inert span (in place if it already is one). */
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

/**
 * Applies the campaign mode (`MODE`) under `root`. Live: every call button (`[data-cta]`) and the
 * number in the copy (`[data-tel]`) dial `PHONE`. Otherwise the buttons become inert "soon" /
 * "ended" pills, and the number in the copy stays as text but is no longer a link.
 */
export function applyMode(root: ParentNode): void {
  if (MODE === 'live') {
    for (const link of root.querySelectorAll<HTMLAnchorElement>('a[data-cta], a[data-tel]')) {
      link.setAttribute('href', PHONE_TEL);
    }
    return;
  }

  for (const el of root.querySelectorAll<HTMLElement>('[data-cta]')) {
    disableCta(el, `state.${MODE}.cta`);
  }
  for (const el of root.querySelectorAll<HTMLElement>('[data-tel]')) {
    el.removeAttribute('href');
  }
}
