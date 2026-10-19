import uz from '../src/i18n/uz.json';
import ru from '../src/i18n/ru.json';
import { applyI18n, getLang, setLang, t } from '../src/i18n';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  window.history.replaceState({}, '', '/');
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  document.documentElement.lang = '';
});

test('key parity and no empty strings', () => {
  expect(Object.keys(ru).sort()).toEqual(Object.keys(uz).sort());
  for (const d of [uz, ru]) for (const [k, v] of Object.entries(d)) expect(v, k).not.toBe('');
});

test('no literal hotline or price in copy, only templates', () => {
  for (const d of [uz, ru]) {
    for (const [k, v] of Object.entries(d)) {
      expect(v, k).not.toMatch(/(?<!\d)105(?!\d)/);
      expect(v, k).not.toMatch(/99\s000/); // \s also matches the no-break space
    }
  }
});

test('t fills templates', () => {
  expect(t('hero.title2', 'uz')).toBe('105 ga qoʻngʻiroq qiling.');
  expect(t('hero.title2', 'ru')).toBe('Звоните 105.');
  expect(t('hero.numeral', 'uz')).toBe('105');
  expect(t('door.price', 'uz')).toBe('99\u00a0000 soʻm');
  expect(t('cta.or', 'uz')).toBe('yoki 105');
});

test('t falls back to uz and warns', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  expect(t('__missing__', 'ru')).toBe('__missing__');
  expect(warn).toHaveBeenCalledWith('[i18n] missing', '__missing__', 'ru');
});

test('a key missing in ru falls back to the uz string, warns, and still renders', () => {
  const dict = ru as Record<string, string>;
  const removed = dict['hero.body'];
  delete dict['hero.body'];
  try {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const uzText = t('hero.body', 'uz');
    expect(uzText).not.toBe('hero.body');

    expect(t('hero.body', 'ru')).toBe(uzText);
    expect(warn).toHaveBeenCalledWith('[i18n] missing', 'hero.body', 'ru');

    document.body.innerHTML = '<p data-i18n="hero.body">x</p>';
    applyI18n(document, 'ru');
    expect(document.querySelector('p')!.textContent).toBe(uzText);
  } finally {
    dict['hero.body'] = removed;
  }
});

test('getLang precedence: query, then localStorage, then uz', () => {
  expect(getLang()).toBe('uz');

  localStorage.setItem('lang', 'ru');
  expect(getLang()).toBe('ru');

  window.history.replaceState({}, '', '/?lang=uz');
  expect(getLang()).toBe('uz');
});

test('getLang ignores unsupported values', () => {
  localStorage.setItem('lang', 'de');
  window.history.replaceState({}, '', '/?lang=fr');
  expect(getLang()).toBe('uz');
});

test('getLang survives localStorage throwing', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('denied');
  });
  expect(getLang()).toBe('uz');
});

test('applyI18n sets lang and text', () => {
  document.body.innerHTML = '<a data-i18n="hero.cta">x</a>';
  applyI18n(document, 'ru');
  expect(document.querySelector('a')!.textContent).toBe('Позвонить 105');
  expect(document.documentElement.lang).toBe('ru');
});

test('applyI18n sets attributes from data-i18n-attr', () => {
  document.body.innerHTML =
    '<div data-i18n-attr="aria-label:a11y.van, title:a11y.lang"></div><p data-i18n-attr="oops"></p>';
  applyI18n(document, 'uz');
  const div = document.querySelector('div')!;
  expect(div.getAttribute('aria-label')).toBe('Chocobulance mashinasi');
  expect(div.getAttribute('title')).toBe('Tilni tanlang');
});

test('applyI18n sets document title and meta content, not textContent of meta', () => {
  document.head.innerHTML =
    '<title data-i18n="meta.title">x</title><meta name="description" content="x" data-i18n="meta.description">';
  applyI18n(document, 'uz');
  expect(document.title).toBe('Chocobulance · 105 — Chococream shokolad tez yordami');
  expect(document.querySelector('title')!.textContent).toBe(document.title);
  const meta = document.querySelector('meta[name="description"]')!;
  expect(meta.getAttribute('content')).toBe(t('meta.description', 'uz'));
  expect(meta.textContent).toBe('');
});

test('an svg <title data-i18n> gets its own text and leaves document.title alone', () => {
  document.head.innerHTML = '<title>keep me</title>';
  document.body.innerHTML = '<svg><title data-i18n="a11y.van">x</title></svg>';
  applyI18n(document, 'uz');
  expect(document.querySelector('svg title')!.textContent).toBe('Chocobulance mashinasi');
  expect(document.title).toBe('keep me');
});

test('applyI18n works with no hreflang links and updates them when present', () => {
  expect(() => applyI18n(document, 'uz')).not.toThrow();

  document.head.innerHTML =
    '<link rel="alternate" hreflang="uz" href="/"><link rel="alternate" hreflang="ru" href="/">';
  applyI18n(document, 'ru');
  const hrefs = [...document.querySelectorAll<HTMLLinkElement>('link[hreflang]')].map(
    (l) => new URL(l.href).search,
  );
  expect(hrefs).toEqual(['?lang=uz', '?lang=ru']);
});

test('setLang persists, re-applies and dispatches langchange', () => {
  document.body.innerHTML = '<h1 data-i18n="hero.title">x</h1>';
  const heard: string[] = [];
  const listener = (e: Event) => heard.push((e as CustomEvent<string>).detail);
  document.addEventListener('langchange', listener);

  setLang('ru');

  document.removeEventListener('langchange', listener);
  expect(localStorage.getItem('lang')).toBe('ru');
  expect(document.documentElement.lang).toBe('ru');
  expect(document.querySelector('h1')!.textContent).toBe('Chococream закончился?');
  expect(heard).toEqual(['ru']);
});

test('setLang still applies when localStorage throws', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('denied');
  });
  document.body.innerHTML = '<h1 data-i18n="hero.title">x</h1>';
  expect(() => setLang('ru')).not.toThrow();
  expect(document.querySelector('h1')!.textContent).toBe('Chococream закончился?');
});

test('t without a lang follows the language last applied, even if ?lang= disagrees', () => {
  window.history.replaceState({}, '', '/?lang=uz');
  setLang('ru');
  expect(t('hero.title')).toBe('Chococream закончился?');
  setLang('uz');
  expect(t('hero.title')).toBe('Chococream tugadimi?');
});
