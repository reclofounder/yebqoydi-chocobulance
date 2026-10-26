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

test('no literal number or price in copy, only templates (and no trace of the old 105 hook)', () => {
  for (const d of [uz, ru]) {
    for (const [k, v] of Object.entries(d)) {
      expect(v, k).not.toMatch(/(?<!\d)105(?!\d)/);
      expect(v, k).not.toMatch(/71\s?209/); // \s also matches the no-break space
      expect(v, k).not.toMatch(/99\s000/);
    }
  }
});

test('t fills templates', () => {
  expect(t('call.number', 'uz')).toBe('71\u00a0209\u00a099\u00a000');
  expect(t('header.call', 'ru')).toBe('71\u00a0209\u00a099\u00a000');
  expect(t('price.tub', 'uz')).toBe('Shokolad pastasi\u00a0— 99\u00a0000 soʻm.');
  expect(t('a11y.call', 'ru')).toBe('Позвонить по номеру 71\u00a0209\u00a099\u00a000');
});

test('t falls back to uz and warns', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  expect(t('__missing__', 'ru')).toBe('__missing__');
  expect(warn).toHaveBeenCalledWith('[i18n] missing', '__missing__', 'ru');
});

test('a key missing in ru falls back to the uz string, warns, and still renders', () => {
  const dict = ru as Record<string, string>;
  const removed = dict['soothe.title'];
  delete dict['soothe.title'];
  try {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const uzText = t('soothe.title', 'uz');
    expect(uzText).not.toBe('soothe.title');

    expect(t('soothe.title', 'ru')).toBe(uzText);
    expect(warn).toHaveBeenCalledWith('[i18n] missing', 'soothe.title', 'ru');

    document.body.innerHTML = '<p data-i18n="soothe.title">x</p>';
    applyI18n(document, 'ru');
    expect(document.querySelector('p')!.textContent).toBe(uzText);
  } finally {
    dict['soothe.title'] = removed;
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
  document.body.innerHTML = '<p data-i18n="price.free">x</p>';
  applyI18n(document, 'ru');
  expect(document.querySelector('p')!.textContent).toBe('Обслуживание бесплатно!');
  expect(document.documentElement.lang).toBe('ru');
});

test('applyI18n sets attributes from data-i18n-attr', () => {
  document.body.innerHTML =
    '<div data-i18n-attr="aria-label:a11y.call, title:a11y.lang"></div><p data-i18n-attr="oops"></p>';
  applyI18n(document, 'uz');
  const div = document.querySelector('div')!;
  expect(div.getAttribute('aria-label')).toBe(
    '71\u00a0209\u00a099\u00a000 raqamiga qoʻngʻiroq qilish',
  );
  expect(div.getAttribute('title')).toBe('Tilni tanlang');
});

test('applyI18n sets document title and meta content, not textContent of meta', () => {
  document.head.innerHTML =
    '<title data-i18n="meta.title">x</title><meta name="description" content="x" data-i18n="meta.description">';
  applyI18n(document, 'uz');
  expect(document.title).toBe('yebqoydi.uz — Chocobulance: Chococream shokolad tez yordami');
  expect(document.querySelector('title')!.textContent).toBe(document.title);
  const meta = document.querySelector('meta[name="description"]')!;
  expect(meta.getAttribute('content')).toBe(t('meta.description', 'uz'));
  expect(meta.textContent).toBe('');
});

test('an svg <title data-i18n> gets its own text and leaves document.title alone', () => {
  document.head.innerHTML = '<title>keep me</title>';
  document.body.innerHTML = '<svg><title data-i18n="a11y.lang">x</title></svg>';
  applyI18n(document, 'uz');
  expect(document.querySelector('svg title')!.textContent).toBe('Tilni tanlang');
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
  // Uzbek is the plain address (the canonical page), Russian the ?lang=ru one.
  expect(hrefs).toEqual(['', '?lang=ru']);
});

test('applyI18n leaves the x-default alternate as it is', () => {
  document.head.innerHTML =
    '<link rel="alternate" hreflang="uz" href="/?lang=uz">' +
    '<link rel="alternate" hreflang="x-default" href="/">';

  expect(() => applyI18n(document, 'ru')).not.toThrow();

  const href = (code: string) =>
    document.querySelector(`link[hreflang="${code}"]`)!.getAttribute('href');
  expect(href('x-default')).toBe('/');
  expect(new URL(href('uz')!).search).toBe('');
});

test('the canonical link names the page in the language shown', () => {
  window.history.replaceState({}, '', '/?lang=ru&utm_source=bio#how');
  document.head.innerHTML = '<link rel="canonical" href="/">';
  const canonical = () =>
    new URL(document.querySelector('link[rel="canonical"]')!.getAttribute('href')!);

  applyI18n(document, 'ru');
  expect(canonical().pathname + canonical().search + canonical().hash).toBe('/?lang=ru');

  applyI18n(document, 'uz');
  expect(canonical().pathname + canonical().search + canonical().hash).toBe('/');
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
  expect(document.querySelector('h1')!.textContent).toBe('Всё съели?');
  expect(heard).toEqual(['ru']);
});

test("setLang rewrites a ?lang= in the address, so a reload keeps the visitor's choice", () => {
  // Opened from a ?lang=ru link and switched to Uzbek: the query would win over the stored
  // choice on the next load. Other parameters and the fragment stay as they are.
  window.history.replaceState({ kept: 1 }, '', '/?utm_source=bio&lang=ru#faq');

  setLang('uz');

  expect(window.location.pathname + window.location.search + window.location.hash).toBe(
    '/?utm_source=bio&lang=uz#faq',
  );
  expect(window.history.state).toEqual({ kept: 1 });
  expect(getLang()).toBe('uz');
});

test('setLang leaves an address without ?lang= alone (the stored choice carries it)', () => {
  window.history.replaceState({}, '', '/?utm_source=bio#how');

  setLang('ru');

  expect(window.location.search + window.location.hash).toBe('?utm_source=bio#how');
  expect(getLang()).toBe('ru');
});

test('setLang still applies when localStorage throws', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('denied');
  });
  document.body.innerHTML = '<h1 data-i18n="hero.title">x</h1>';
  expect(() => setLang('ru')).not.toThrow();
  expect(document.querySelector('h1')!.textContent).toBe('Всё съели?');
});

test('t without a lang follows the language last applied, even if ?lang= disagrees', () => {
  window.history.replaceState({}, '', '/?lang=uz');
  setLang('ru');
  expect(t('hero.title')).toBe('Всё съели?');
  setLang('uz');
  expect(t('hero.title')).toBe('Yeb qoʻydingizmi?');
});

test('the language buttons say which language is on (aria-pressed), on load and on every switch', () => {
  document.body.innerHTML = `
    <div role="group">
      <button type="button" data-lang="uz">UZ</button>
      <button type="button" data-lang="ru">RU</button>
    </div>`;
  const pressed = () =>
    [...document.querySelectorAll('[data-lang]')].map((b) => b.getAttribute('aria-pressed'));

  applyI18n(document, 'uz');
  expect(pressed()).toEqual(['true', 'false']);

  setLang('ru');
  expect(pressed()).toEqual(['false', 'true']);

  setLang('uz');
  expect(pressed()).toEqual(['true', 'false']);
});
