// Static contract of index.html: the hooks the i18n engine, the campaign mode and the cars rely on.
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
    expect(html).toContain('<html lang="uz"');
    expect(html).toContain('data-lang="ru"');
    for (const id of ['header', 'main', 'top', 'how', 'price', 'area']) {
      expect(doc.getElementById(id), id).not.toBeNull();
    }
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

  it('preloads the Latin headline font for everyone and the Cyrillic one only for Russian', () => {
    const preload = (rel: string) =>
      [...doc.querySelectorAll<HTMLLinkElement>(`link[rel="${rel}"]`)].map((l) =>
        l.getAttribute('href')!.replace(/^.*\//, ''),
      );
    expect(preload('preload')).toEqual(['baloo-2-latin-800-normal.woff2']);
    expect(preload('x-preload-ru')).toEqual(['nunito-cyrillic-900-normal.woff2']);
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
      expect(run('/', null)).toEqual(['x-preload-ru']);
      expect(run('/?lang=uz', 'ru')).toEqual(['x-preload-ru']);
    });

    it('promotes them for ?lang=ru and for a stored Russian choice, as getLang() decides', () => {
      expect(run('/?lang=ru', null)).toEqual(['preload']);
      expect(run('/', 'ru')).toEqual(['preload']);
    });

    it('survives storage that throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('denied');
      });
      expect(run('/', null)).toEqual(['x-preload-ru']);
      vi.restoreAllMocks();
    });
  });

  it('never writes the number or the price as literal copy, and has no trace of the old 105', () => {
    // The number is {phone} and the price {price} in the JSON; only tel: links carry the number.
    const text = doc.body.textContent ?? '';
    expect(text).not.toMatch(/71[\s ]?209/);
    expect(text).not.toMatch(/99[\s ]?000/);
    expect(html).not.toMatch(/(?<![\d.])105(?![\d.])/);
  });

  it('tells the story in order: the arched question, three steps, then the facts', () => {
    const titles = [...doc.querySelectorAll<HTMLElement>('main h1, main h2')].map(
      (h) => h.querySelector('[data-i18n]')?.getAttribute('data-i18n') ?? h.dataset.i18n,
    );
    expect(titles).toEqual([
      'hero.title',
      'soothe.title',
      'call.before',
      'door.title',
      'how.title',
      'price.free',
      'area.title',
    ]);
    expect(doc.querySelector('#price [data-i18n="price.tub"]')).not.toBeNull();
    expect(
      [...doc.querySelectorAll('#how ol.steps > li.step > .step__text')].map((p) =>
        p.getAttribute('data-i18n'),
      ),
    ).toEqual(['how.1', 'how.2', 'how.3']);
    // Each card has its icon, hidden from screen readers (the words carry the step).
    const icons = doc.querySelectorAll('#how .step > svg.step__icon');
    expect(icons).toHaveLength(3);
    for (const icon of icons) expect(icon.getAttribute('aria-hidden')).toBe('true');
  });

  it('sets the hero on an arc: real words for readers, a hidden drawing of them on a path', () => {
    const h1 = doc.querySelector('#top > h1#hero-title')!;
    expect(doc.querySelectorAll('h1')).toHaveLength(1);
    expect(h1.querySelector(':scope > .visually-hidden[data-i18n="hero.title"]')).not.toBeNull();
    const svg = h1.querySelector(':scope > svg.hero__arc')!;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    const path = svg.querySelector('path#hero-arc')!;
    const textPath = svg.querySelector('text > textPath')!;
    expect(textPath.getAttribute('href')).toBe('#hero-arc');
    expect(textPath.getAttribute('startOffset')).toBe('50%');
    expect(textPath.getAttribute('text-anchor')).toBe('middle');
    expect(textPath.getAttribute('data-i18n')).toBe('hero.title');
    // A gentle arc: the middle lifts by less than a sixth of the width.
    const [x0, y0, cx, cy, x1, y1] = path
      .getAttribute('d')!
      .match(/-?\d+(\.\d+)?/g)!
      .map(Number);
    expect(y0).toBe(y1);
    expect(cx).toBe((x0 + x1) / 2);
    expect((y0 - cy) / 2).toBeLessThan((x1 - x0) / 6);
  });

  it('dials the hotline from the header button and from the number in the call line', () => {
    const calls = [...doc.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]')];
    expect(calls).toHaveLength(2);
    for (const a of calls) expect(a.getAttribute('href')).toBe('tel:+998712099900');

    // applyMode() swaps the header button for a span that keeps only its class and data-cta.
    const call = doc.querySelector('#header a.call[data-cta]')!;
    expect(call.getAttribute('data-i18n-attr')).toBe('aria-label:a11y.call');
    expect(call.querySelector('.call__label[data-i18n="header.call"]')).not.toBeNull();

    const tel = doc.querySelector('#call-title > a.tel[data-tel]')!;
    expect(tel.getAttribute('data-i18n')).toBe('call.number');
  });

  it('has a header with the logo, the call button and both language buttons', () => {
    const inner = [...doc.querySelector('#header .header__inner')!.children];
    expect(inner.map((el) => el.className)).toEqual(['brand', 'call', 'lang']);
    const logo = doc.querySelector<HTMLImageElement>('a.brand[href="#top"] > img')!;
    expect(logo.getAttribute('src')).toBe('/brand/chococream-20-on-red.png');
    expect(logo.getAttribute('alt')).toBeTruthy();
    // Declared size, so the header never shifts when the image arrives.
    expect([logo.getAttribute('width'), logo.getAttribute('height')]).toEqual(['783', '179']);
    const langs = [...doc.querySelectorAll<HTMLElement>('#header .lang button[data-lang]')];
    expect(langs.map((b) => b.dataset.lang)).toEqual(['uz', 'ru']);
  });

  it('lays the lanes between the words, alternating, with the car parking at the door', () => {
    const lanes = [...doc.querySelectorAll<HTMLElement>('[data-lane]')];
    // Left, right, left (parks at the door), right: the car turns round every time.
    expect(lanes.map((l) => l.dataset.lane)).toEqual(['enter', 'ltr', 'arrive', 'ltr']);
    expect(lanes[2].closest('section')!.querySelector('#door-title')).not.toBeNull();
    for (const lane of lanes) {
      expect(lane.getAttribute('aria-hidden')).toBe('true');
      // The car faces the way it drives: the right-facing view only in left-to-right lanes. Two
      // views from the design, never one mirrored, or "Chococream" would read backwards.
      const facing = lane.dataset.lane === 'ltr' ? 'right' : 'left';
      const car = lane.querySelector(`[data-car].car--${facing}`)!;
      expect(car, lane.dataset.lane).not.toBeNull();
      const body = car.querySelector('img.car__body')!;
      expect(body.getAttribute('src')).toBe(`/car/${facing}.avif`);
      expect(body.getAttribute('srcset')).toBe(
        `/car/${facing}-720.avif 720w, /car/${facing}.avif 1440w`,
      );
      const wheels = [...car.querySelectorAll('img.car__wheel')];
      expect(wheels.map((w) => w.getAttribute('src'))).toEqual([
        `/car/${facing}-wheel-a.avif`,
        `/car/${facing}-wheel-b.avif`,
      ]);
      // Phones get the half-size rims, as they get the half-size body.
      for (const w of wheels)
        expect(w.getAttribute('srcset')).toMatch(/-720\.avif \d+w, .*\.avif \d+w$/);
      for (const img of car.querySelectorAll('img')) {
        expect(img.getAttribute('alt')).toBe('');
        expect(img.getAttribute('width')).toBeTruthy();
        expect(img.getAttribute('height')).toBeTruthy();
      }
    }
    // The first car is on the first screen: it is what the page paints last, so it goes first.
    expect(lanes[0].querySelector('.car__body')!.getAttribute('fetchpriority')).toBe('high');
  });

  it('ships the car art the lanes point at, and the generated positions of its rims', () => {
    for (const facing of ['left', 'right']) {
      for (const file of [
        `${facing}.avif`,
        `${facing}-720.avif`,
        `${facing}-wheel-a.avif`,
        `${facing}-wheel-b.avif`,
      ]) {
        // AVIF: an ISO-BMFF file whose first box is ftyp with the avif brand.
        const avif = readFileSync(resolve(process.cwd(), 'public/car', file));
        expect(avif.subarray(4, 12).toString('latin1'), file).toBe('ftypavif');
      }
    }
    const css = readFileSync(resolve(process.cwd(), 'src/styles/car.css'), 'utf8');
    expect(css).toMatch(/--car-ratio:\s*0\.\d+/);
    expect(css).toMatch(/--tyre-share:\s*0\.\d+/);
    for (const rule of [
      '.car--left .car__wheel--a',
      '.car--left .car__wheel--b',
      '.car--right .car__wheel--a',
      '.car--right .car__wheel--b',
    ]) {
      expect(css, rule).toContain(`${rule} {`);
    }
  });

  it('sets the two boys either side of the comfort line, decorative, lazy, and sized before they load', () => {
    const section = doc.querySelector('section.beat--boys')!;
    expect(section.querySelector('h2#soothe-title')).not.toBeNull();
    const boys = [...section.querySelectorAll<HTMLImageElement>('img.boy')];
    expect(boys.map((b) => b.getAttribute('src'))).toEqual([
      '/boys/curly.avif',
      '/boys/yellow.avif',
    ]);
    for (const boy of boys) {
      // The words carry the message; the photos only show it.
      expect(boy.getAttribute('alt')).toBe('');
      expect(boy.getAttribute('loading')).toBe('lazy');
      expect(boy.getAttribute('width')).toBeTruthy();
      expect(boy.getAttribute('height')).toBe('900');
      expect(boy.getAttribute('srcset')).toMatch(/-450\.avif \d+w, .*\.avif \d+w$/);
    }
    for (const file of ['curly', 'curly-450', 'yellow', 'yellow-450']) {
      const avif = readFileSync(resolve(process.cwd(), 'public/boys', `${file}.avif`));
      expect(avif.subarray(4, 12).toString('latin1'), file).toBe('ftypavif');
    }
  });

  it('ends with the copyright line only', () => {
    const footer = doc.querySelector('body > footer.footer')!;
    expect([...footer.children].map((el) => el.getAttribute('data-i18n'))).toEqual(['footer.copy']);
  });

  it('only uses copy keys that exist in both dictionaries', () => {
    const keys = new Set<string>();
    for (const el of doc.querySelectorAll<HTMLElement>('[data-i18n]')) keys.add(el.dataset.i18n!);
    for (const el of doc.querySelectorAll<HTMLElement>('[data-i18n-attr]')) {
      for (const pair of el.dataset.i18nAttr!.split(',')) keys.add(pair.split(':')[1].trim());
    }
    expect(keys.size).toBeGreaterThan(15);
    for (const key of keys) {
      expect(uz, `uz.json is missing "${key}"`).toHaveProperty([key]);
      expect(ru, `ru.json is missing "${key}"`).toHaveProperty([key]);
    }
  });

  describe('search and social tags', () => {
    const content = (selector: string) => doc.head.querySelector(selector)?.getAttribute('content');

    it('links the favicon and the share image, a real 1200x630 PNG', () => {
      // The icons are the logo's "20 yoshda" (no trace of the old 105): .ico for tabs, PNGs for phones.
      const icons = [
        ...doc.head.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]'),
      ];
      expect(icons.map((l) => l.getAttribute('href'))).toEqual([
        '/favicon.ico',
        '/icon-192.png',
        '/apple-touch-icon.png',
      ]);
      const ico = readFileSync(resolve(process.cwd(), 'public/favicon.ico'));
      expect([...ico.subarray(0, 4)]).toEqual([0, 0, 1, 0]); // ICONDIR, type 1 = icon
      expect(ico.readUInt16LE(4)).toBe(3); // 16, 32 and 48 px
      for (const [file, size] of [
        ['icon-192.png', 192],
        ['apple-touch-icon.png', 180],
      ] as const) {
        const png = readFileSync(resolve(process.cwd(), 'public', file));
        expect([png.readUInt32BE(16), png.readUInt32BE(20)], file).toEqual([size, size]);
      }
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
      // Uzbek copy with the number and price filled in, and the engine swaps them for the visitor.
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
