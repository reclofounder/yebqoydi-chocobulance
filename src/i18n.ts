import uz from './i18n/uz.json';
import ru from './i18n/ru.json';
import { HOOK, LAUNCH_DATE, PHONE_DISPLAY, PRICE } from './config';

export type Lang = 'uz' | 'ru';

const DICTS: Record<Lang, Record<string, string>> = { uz, ru };
const STORAGE_KEY = 'lang';
const DEFAULT_LANG: Lang = 'uz';

/** Language the page is currently shown in; set by applyI18n, so `t(key)` follows the toggle. */
let active: Lang | undefined;

export function isLang(value: unknown): value is Lang {
  return value === 'uz' || value === 'ru';
}

/** `?lang=` query, then `localStorage.lang`, then `uz`. */
export function getLang(): Lang {
  const query = new URLSearchParams(window.location.search).get('lang');
  if (isLang(query)) return query;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    // Storage can throw (private mode, blocked site data); fall through to the default.
  }
  return DEFAULT_LANG;
}

function fill(template: string): string {
  const values: Record<string, string> = {
    hook: HOOK,
    phone: PHONE_DISPLAY,
    price: PRICE,
    date: LAUNCH_DATE,
  };
  return template.replace(/\{(hook|phone|price|date)\}/g, (_, name: string) => values[name]);
}

export function t(key: string, lang: Lang = active ?? getLang()): string {
  const own = DICTS[lang][key];
  if (own !== undefined) return fill(own);
  console.warn('[i18n] missing', key, lang);
  const fallback = DICTS[DEFAULT_LANG][key];
  return fallback !== undefined ? fill(fallback) : key;
}

function applyText(el: HTMLElement, text: string): void {
  switch (el.localName) {
    case 'meta':
      el.setAttribute('content', text);
      break;
    case 'title':
      el.textContent = text;
      // An SVG <title> is just an accessible name; only the HTML one is the page title.
      if (el instanceof HTMLTitleElement) document.title = text;
      break;
    default:
      el.textContent = text;
  }
}

function applyAttributes(el: HTMLElement, lang: Lang): void {
  for (const pair of (el.dataset.i18nAttr ?? '').split(',')) {
    const sep = pair.indexOf(':');
    if (sep < 1) continue;
    const attr = pair.slice(0, sep).trim();
    const key = pair.slice(sep + 1).trim();
    if (attr && key) el.setAttribute(attr, t(key, lang));
  }
}

/** Point each `link[hreflang]` alternate at this page with the matching `?lang=`. */
function applyHreflang(): void {
  for (const link of document.querySelectorAll<HTMLLinkElement>('link[hreflang]')) {
    const code = link.getAttribute('hreflang');
    if (!isLang(code)) continue;
    const url = new URL(window.location.href);
    url.search = `?lang=${code}`;
    url.hash = '';
    link.setAttribute('href', url.href);
  }
}

export function applyI18n(root: ParentNode, lang: Lang): void {
  active = lang;
  document.documentElement.lang = lang;
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n]')) {
    applyText(el, t(el.dataset.i18n ?? '', lang));
  }
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n-attr]')) {
    applyAttributes(el, lang);
  }
  // The language buttons are a toggle: say which one is on (the styles read it too).
  for (const el of root.querySelectorAll<HTMLElement>('[data-lang]')) {
    el.setAttribute('aria-pressed', String(el.dataset.lang === lang));
  }
  applyHreflang();
}

export function setLang(lang: Lang): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Not persisted; the choice still applies for this page view.
  }
  applyI18n(document, lang);
  document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
}
