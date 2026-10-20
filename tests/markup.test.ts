// Static contract of index.html: the hooks the i18n engine, the scenes and the scroll timeline rely on.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import uz from '../src/i18n/uz.json';
import ru from '../src/i18n/ru.json';
import { t } from '../src/i18n';
import { siteUrl } from '../vite.config';

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const doc = new DOMParser().parseFromString(html, 'text/html');

describe('index.html markup', () => {
  it('has the required ids, attributes and sections', () => {
    expect(html).toContain('data-scene="road"');
    expect(html).toContain('id="sticky-cta"');
    expect(html).toContain('data-lang="ru"');
    expect(html).toContain('<html lang="uz"');
    expect(html.match(/<details/g)).toHaveLength(5);
  });

  it('ships hidden until main.ts has built the page, so no empty shell is painted and shifted', () => {
    expect(doc.documentElement.hasAttribute('data-booting')).toBe(true);
    const base = readFileSync(resolve(process.cwd(), 'src/styles/base.css'), 'utf8');
    expect(base).toMatch(/html\[data-booting\] body\s*\{[^}]*visibility:\s*hidden/);
  });

  it('reveals the page without the script: a noscript rule, and a CSS timer if boot never finishes', () => {
    // No JavaScript at all: the noscript rule shows the shell as it is. It needs !important: the
    // bundled stylesheet is linked after it and would win the tie on specificity.
    const fallback = doc.head.querySelector('noscript');
    expect(fallback, 'a <noscript> in <head>').not.toBeNull();
    expect(fallback!.textContent).toMatch(
      /html\[data-booting\]\s+body\s*\{\s*visibility:\s*visible\s*!important/,
    );

    // The bundle fails to load or to run (blocked, too old, a throw in a static import): the same
    // reveal comes from a 0-length animation that starts after 2.5 s and holds. main.ts removing
    // data-booting still reveals at once, because the rule stops matching.
    const base = readFileSync(resolve(process.cwd(), 'src/styles/base.css'), 'utf8');
    const rule = /html\[data-booting\] body\s*\{([^}]*)\}/.exec(base)![1];
    expect(rule).toMatch(/animation:\s*boot-reveal\s+0s\s+2\.5s\s+forwards/);
    expect(base).toMatch(/@keyframes boot-reveal\s*\{\s*to\s*\{\s*visibility:\s*visible/);
  });

  it('preloads the Latin Nunito weights for everyone and the Cyrillic ones only for Russian', () => {
    const preload = (rel: string) =>
      [...doc.querySelectorAll<HTMLLinkElement>(`link[rel="${rel}"]`)].map((l) =>
        l.getAttribute('href')!.replace(/^.*\//, ''),
      );
    expect(preload('preload')).toEqual([
      'nunito-latin-800-normal.woff2',
      'nunito-latin-900-normal.woff2',
    ]);
    expect(preload('x-preload-ru')).toEqual([
      'nunito-cyrillic-800-normal.woff2',
      'nunito-cyrillic-900-normal.woff2',
    ]);
    // Fonts are fetched anonymously (CORS mode) even from the same origin: without `crossorigin`
    // the preloaded copy is not reused and the font downloads twice.
    for (const link of doc.querySelectorAll('link[as="font"]')) {
      expect(link.hasAttribute('crossorigin')).toBe(true);
    }
  });

  describe('the inline script that promotes the Cyrillic preloads', () => {
    const script = doc.head.querySelector('script:not([src])')!.textContent!;
    const run = (url: string, stored: string | null) => {
      window.history.replaceState({}, '', url);
      if (stored) localStorage.setItem('lang', stored);
      document.head.innerHTML = [...doc.querySelectorAll('link[rel="x-preload-ru"]')]
        .map((l) => l.outerHTML)
        .join('');
      new Function(script)();
      return [...document.head.querySelectorAll('link')].map((l) => l.getAttribute('rel'));
    };
    afterEach(() => {
      localStorage.clear();
      window.history.replaceState({}, '', '/');
      document.head.innerHTML = '';
    });

    it('leaves them inert for the default language', () => {
      expect(run('/', null)).toEqual(['x-preload-ru', 'x-preload-ru']);
      expect(run('/?lang=uz', 'ru')).toEqual(['x-preload-ru', 'x-preload-ru']);
    });

    it('promotes them for ?lang=ru and for a stored Russian choice, as getLang() decides', () => {
      expect(run('/?lang=ru', null)).toEqual(['preload', 'preload']);
      expect(run('/', 'ru')).toEqual(['preload', 'preload']);
    });

    it('survives storage that throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('denied');
      });
      expect(run('/', null)).toEqual(['x-preload-ru', 'x-preload-ru']);
      vi.restoreAllMocks();
    });
  });

  it('never writes the hook or the price as literal copy', () => {
    // The hook is {hook} and the price {price} in the JSON; only attributes (tel:105) may carry them.
    expect(html).not.toMatch(/>\s*105\s*</);
    const text = doc.body.textContent ?? '';
    expect(text).not.toMatch(/105/);
    expect(text).not.toMatch(/99[\s ]?000/);
  });

  it('declares the five pinned scenes, each with copy and an empty stage', () => {
    const scenes = [...doc.querySelectorAll<HTMLElement>('section.scene')];
    expect(scenes.map((s) => s.dataset.scene)).toEqual(['hero', 'kitchen', 'call', 'road', 'door']);
    for (const scene of scenes) {
      expect(scene.querySelector(':scope > .scene__copy')).not.toBeNull();
      const stage = scene.querySelector(':scope > .scene__stage[data-stage]');
      expect(stage).not.toBeNull();
      expect(stage!.childElementCount).toBe(0);
    }
  });

  it('gives the hero its split headline, numeral, actions, note and phone hint', () => {
    const hero = doc.querySelector('#hero')!;
    expect(hero.querySelector('h1 > [data-i18n="hero.title"]')).not.toBeNull();
    expect(hero.querySelector('h1 > [data-i18n="hero.title2"]')).not.toBeNull();
    expect(hero.querySelector('.hero__numeral[data-i18n="hero.numeral"]')).not.toBeNull();
    expect(hero.querySelector('a.cta[data-cta][data-i18n="hero.cta"]')).not.toBeNull();
    expect(hero.querySelector('a.cta--ghost[href="#how"]')).not.toBeNull();
    expect(hero.querySelector('p.note[data-i18n="hero.note"][data-state-note]')).not.toBeNull();
    expect(hero.querySelector('p.phone-hint[data-phone-hint]')).not.toBeNull();
  });

  it('has a header with a brand link and both language buttons', () => {
    const header = doc.querySelector('header#header')!;
    expect(header.querySelector('a.brand')).not.toBeNull();
    const langs = [...header.querySelectorAll<HTMLElement>('.lang button[data-lang]')];
    expect(langs.map((b) => b.dataset.lang)).toEqual(['uz', 'ru']);
  });

  it('keeps every call-to-action a plain-text anchor the engine can swap for a pill', () => {
    // applyMode() replaces a CTA by a span that keeps only class and data-cta.
    const ctas = [...doc.querySelectorAll<HTMLElement>('[data-cta]')];
    expect(ctas).toHaveLength(4);
    for (const cta of ctas) {
      expect(cta.localName).toBe('a');
      expect(cta.childElementCount).toBe(0);
      expect(cta.hasAttribute('id')).toBe(false);
      expect(cta.hasAttribute('aria-label')).toBe(false);
      expect(cta.getAttribute('href')).toBe('tel:105');
    }
    expect(doc.querySelector('#sticky-cta a.cta[data-cta][data-i18n="sticky.cta"]')).not.toBeNull();
  });

  it('keeps a call action in reach after the hero: a header pill, and one under the steps', () => {
    // Desktop has no sticky bar: the header carries a compact call pill, between brand and language.
    // The real number's hint sits beside the pill (state.ts reveals it once PHONE differs from HOOK).
    const inner = [...doc.querySelector('#header .header__inner')!.children];
    expect(inner.map((el) => el.className)).toEqual([
      'brand',
      'cta cta--compact',
      'phone-hint header__hint',
      'lang',
    ]);
    expect(inner[1].matches('a[data-cta][data-i18n="sticky.cta"]')).toBe(true);
    expect(inner[2].matches('span[data-phone-hint]')).toBe(true);
    // "Dial 105" in step one, with something to tap right under the steps (every width), and the
    // real number's hint under it.
    const how = [...doc.querySelector('#how .container')!.children].slice(-3);
    expect(how[0].matches('ol.steps')).toBe(true);
    expect(how[1].matches('a.cta[data-cta][data-i18n="hero.cta"]')).toBe(true);
    expect(how[2].matches('p.phone-hint[data-phone-hint]')).toBe(true);
  });

  it('starts the sticky bar hidden, with phone hints hidden until the engine reveals them', () => {
    expect(doc.querySelector('#sticky-cta')!.getAttribute('data-visible')).toBe('false');
    const hints = [...doc.querySelectorAll('[data-phone-hint]')];
    expect(hints.map((h) => h.closest('[id]')!.id)).toEqual([
      'header',
      'hero',
      'how',
      'sticky-cta',
    ]);
    for (const hint of hints) expect(hint.hasAttribute('hidden')).toBe(true);
  });

  it('gives the dispatcher a desk line for the real number, hidden until the engine fills it', () => {
    const line = doc.querySelector('#scene-call > .scene__overlay > p.dispatcher-line')!;
    expect(line).not.toBeNull();
    expect(line.matches('[data-phone-line][hidden]')).toBe(true);
    expect(line.querySelector('[data-i18n="call.phone.label"]')).not.toBeNull();
    const number = line.querySelector('[data-phone-number]')!;
    expect(number.textContent).toBe('');
  });

  it('builds the static sections: three steps, coverage with a stage and price, five questions', () => {
    expect(doc.querySelectorAll('#how article.step')).toHaveLength(3);
    expect(doc.querySelector('#coverage [data-stage]')).not.toBeNull();
    expect(doc.querySelector('#coverage [data-i18n="coverage.inside"]')).not.toBeNull();
    expect(doc.querySelector('#coverage [data-i18n="coverage.outside"]')).not.toBeNull();
    expect(doc.querySelector('#coverage [data-i18n="coverage.price"]')).not.toBeNull();
    expect(doc.querySelectorAll('#faq details > summary')).toHaveLength(5);
    expect(doc.querySelector('footer#footer')).not.toBeNull();
  });

  it('ships no dead social pills: the list stays hidden while a link has no handle', () => {
    const list = doc.querySelector('#footer ul.footer__social')!;
    const links = [...list.querySelectorAll('a')];
    // The copy stays (footer.social.*) for the day the handles exist.
    expect(links.map((a) => a.getAttribute('data-i18n'))).toEqual([
      'footer.social.instagram',
      'footer.social.telegram',
    ]);
    if (links.some((a) => !a.getAttribute('href'))) expect(list.hasAttribute('hidden')).toBe(true);
  });

  it('only uses copy keys that exist in both dictionaries', () => {
    const keys = new Set<string>();
    for (const el of doc.querySelectorAll<HTMLElement>('[data-i18n]')) keys.add(el.dataset.i18n!);
    for (const el of doc.querySelectorAll<HTMLElement>('[data-i18n-attr]')) {
      for (const pair of el.dataset.i18nAttr!.split(',')) keys.add(pair.split(':')[1].trim());
    }
    expect(keys.size).toBeGreaterThan(50);
    for (const key of keys) {
      expect(uz, `uz.json is missing "${key}"`).toHaveProperty([key]);
      expect(ru, `ru.json is missing "${key}"`).toHaveProperty([key]);
    }
  });

  describe('search and social tags', () => {
    const content = (selector: string) => doc.head.querySelector(selector)?.getAttribute('content');

    it('links the favicon and the share image, a real 1200x630 PNG', () => {
      expect(doc.head.querySelector('link[rel="icon"]')!.getAttribute('href')).toBe('/favicon.svg');
      expect(content('meta[property="og:image"]')).toBe('%VITE_SITE_URL%/og.png');
      expect(content('meta[property="og:image:width"]')).toBe('1200');
      expect(content('meta[property="og:image:height"]')).toBe('630');
      expect(content('meta[name="twitter:image"]')).toBe(content('meta[property="og:image"]'));

      const png = readFileSync(resolve(process.cwd(), 'public/og.png'));
      expect(png.subarray(1, 4).toString('latin1')).toBe('PNG');
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
    });

    it('declares an Open Graph website card and a large Twitter card', () => {
      expect(content('meta[property="og:type"]')).toBe('website');
      expect(content('meta[name="twitter:card"]')).toBe('summary_large_image');
    });

    it('keeps the title and description in step with the language, and ships them in Uzbek for crawlers', () => {
      // Crawlers that do not run scripts (link previews) read the static values: they are the
      // Uzbek copy with the hook and price filled in, and the engine swaps them for the visitor.
      const pairs = [
        ['meta[property="og:title"]', 'meta.title'],
        ['meta[name="twitter:title"]', 'meta.title'],
        ['meta[property="og:description"]', 'meta.description'],
        ['meta[name="twitter:description"]', 'meta.description'],
        ['meta[name="description"]', 'meta.description'],
      ];
      for (const [selector, key] of pairs) {
        const tag = doc.head.querySelector<HTMLElement>(selector)!;
        expect(tag.dataset.i18n, `${selector} is translated`).toBe(key);
        expect(tag.getAttribute('content'), `${selector} static value`).toBe(t(key, 'uz'));
      }
      expect(doc.title).toBe(t('meta.title', 'uz'));
      expect(doc.head.querySelector('title')!.dataset.i18n).toBe('meta.title');
    });

    it('points search engines at each language, and at the Uzbek page by default', () => {
      const alt = (code: string) =>
        doc.head.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${code}"]`);
      expect(alt('uz')!.getAttribute('href')).toBe('%VITE_SITE_URL%/?lang=uz');
      expect(alt('ru')!.getAttribute('href')).toBe('%VITE_SITE_URL%/?lang=ru');
      expect(alt('x-default')!.getAttribute('href')).toBe('%VITE_SITE_URL%/');
      expect(content('meta[property="og:url"]')).toBe('%VITE_SITE_URL%/');
    });

    describe('the site origin, filled in at build time (VITE_SITE_URL)', () => {
      /** index.html as the build writes it, with this environment. */
      const build = (env: Record<string, string>) => {
        const plugin = siteUrl();
        (plugin.configResolved as (config: { env: Record<string, string> }) => void)({ env });
        const hook = plugin.transformIndexHtml as { handler: (html: string) => string };
        return new DOMParser().parseFromString(hook.handler(html), 'text/html');
      };
      const tags = (page: Document) => [
        page.head.querySelector('meta[property="og:image"]')!.getAttribute('content'),
        page.head.querySelector('meta[name="twitter:image"]')!.getAttribute('content'),
        page.head.querySelector('meta[property="og:url"]')!.getAttribute('content'),
        ...[...page.head.querySelectorAll('link[hreflang]')].map((l) => l.getAttribute('href')),
      ];

      it('makes the share image, og:url and the language links absolute once it is set', () => {
        // Link previews (Telegram, X, Facebook) need an absolute og:image.
        expect(tags(build({ VITE_SITE_URL: 'https://example.com' }))).toEqual([
          'https://example.com/og.png',
          'https://example.com/og.png',
          'https://example.com/',
          'https://example.com/?lang=uz',
          'https://example.com/?lang=ru',
          'https://example.com/',
        ]);
        // A trailing slash in the variable never makes "//og.png".
        expect(tags(build({ VITE_SITE_URL: 'https://example.com/' }))[0]).toBe(
          'https://example.com/og.png',
        );
      });

      it('falls back to relative tags, never the literal placeholder, when it is unset', () => {
        const page = build({});
        expect(tags(page)).toEqual(['/og.png', '/og.png', '/', '/?lang=uz', '/?lang=ru', '/']);
        expect(page.documentElement.outerHTML).not.toContain('%VITE_SITE_URL%');
      });
    });
  });
});
