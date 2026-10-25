// Accessibility basics: the structure that keyboards and assistive tech rely on. Markup is read from
// index.html with the real copy applied; styles are checked at source level (jsdom has no focus ring
// or touch to compute).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import uz from '../src/i18n/uz.json';
import ru from '../src/i18n/ru.json';
import { applyI18n, type Lang } from '../src/i18n';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const html = read('index.html');
const parsed = new DOMParser().parseFromString(html, 'text/html');

/** The page with its copy in `lang`, as a visitor gets it. */
function render(lang: Lang): void {
  document.head.innerHTML = parsed.head.innerHTML;
  document.body.innerHTML = parsed.body.innerHTML;
  applyI18n(document, lang);
}

afterEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
});

describe('keyboard and landmarks', () => {
  it('starts with a skip link to the main content, which can take focus', () => {
    const first = parsed.body.firstElementChild!;
    expect(first.matches('a.skip-link[href="#main"][data-i18n="a11y.skip"]')).toBe(true);
    const main = parsed.getElementById('main')!;
    expect(main.localName).toBe('main');
    // Without a tabindex, Safari follows the link but leaves keyboard focus at the top.
    expect(main.getAttribute('tabindex')).toBe('-1');
    expect(uz).toHaveProperty(['a11y.skip']);
    expect(ru).toHaveProperty(['a11y.skip']);
  });

  it('tabs through the skip link, the header, then the number in the call line, and nothing else', () => {
    const tabbable = [...parsed.body.querySelectorAll<HTMLElement>('a[href], button, summary')];
    expect(tabbable.map((el) => el.className || el.localName)).toEqual([
      'skip-link',
      'brand',
      'call',
      'lang__btn',
      'lang__btn',
      'tel',
      // Phones only (CSS): the call fixed to the bottom of the screen, last in the order.
      'call-bar',
    ]);
  });

  it('never traps or steals focus: no positive tabindex, no autofocus, no modal', () => {
    for (const el of parsed.querySelectorAll('[tabindex]')) {
      expect(Number(el.getAttribute('tabindex')), el.outerHTML).toBeLessThanOrEqual(-1);
    }
    expect(parsed.querySelector('[autofocus], dialog, [aria-modal]')).toBeNull();
  });

  it('declares the page language and the browser chrome colour', () => {
    expect(parsed.documentElement.getAttribute('lang')).toBe('uz');
    // The browser chrome matches the page: brand red.
    const theme = parsed.querySelector('meta[name="theme-color"]')!;
    const red = /--red-600:\s*(#[0-9a-f]{6})/i.exec(read('src/styles/tokens.css'))![1];
    expect(theme.getAttribute('content')!.toLowerCase()).toBe(red.toLowerCase());
    expect(theme.getAttribute('content')!.toLowerCase()).toBe('#c71920');
  });

  it('keeps zoom available', () => {
    const viewport = parsed.querySelector('meta[name="viewport"]')!.getAttribute('content')!;
    expect(viewport).not.toMatch(/user-scalable\s*=\s*(no|0)|maximum-scale/);
  });
});

describe.each(['uz', 'ru'] as const)('names and labels (%s)', (lang) => {
  it('gives every button and link a name: its text, the alt of its image, or an aria-label', () => {
    render(lang);
    const controls = document.querySelectorAll<HTMLElement>('button, a[href]');
    expect(controls).toHaveLength(7);
    for (const el of controls) {
      const name =
        el.getAttribute('aria-label') ??
        (el.textContent?.trim() || el.querySelector('img')?.alt) ??
        '';
      expect(name.trim(), el.outerHTML).not.toBe('');
    }
    // On a phone the call button shows only the handset: the number is its name.
    expect(document.querySelector('.call')!.getAttribute('aria-label')).toMatch(/71\u00a0209/);
    expect(document.querySelector('.call-bar')!.getAttribute('aria-label')).toMatch(/71\u00a0209/);
  });

  it('reads one h1, the question itself, and not the drawing of it on the arc', () => {
    render(lang);
    const h1 = document.querySelector('h1')!;
    const spoken = h1.querySelector('.visually-hidden')!.textContent;
    expect(spoken).toBe(lang === 'uz' ? 'Yebqoʻydingizmi?' : 'Всё съели?');
    expect(h1.querySelector('textPath')!.textContent).toBe(spoken);
    expect(h1.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('labels the language group and hides the cars from assistive tech', () => {
    render(lang);
    expect(document.querySelector('.lang')!.getAttribute('aria-label')).toBeTruthy();
    for (const lane of document.querySelectorAll('[data-lane]')) {
      expect(lane.getAttribute('aria-hidden')).toBe('true');
    }
    for (const img of document.querySelectorAll('img')) expect(img.hasAttribute('alt')).toBe(true);
  });
});

describe('the styles for touch and keyboard', () => {
  const base = strip(read('src/styles/base.css'));
  const layout = strip(read('src/styles/layout.css'));
  const sources = ['tokens', 'base', 'layout'].map((n) => strip(read(`src/styles/${n}.css`)));
  const rule = (css: string, selector: string) =>
    [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter((m) => m[1].split(',').some((s) => s.trim() === selector))
      .map((m) => m[2])
      .join(';');

  it('clears the tap highlight once, on the root', () => {
    expect(rule(base, 'html')).toMatch(/-webkit-tap-highlight-color:\s*transparent/);
  });

  it('answers a tap at once: touch-action: manipulation on links and buttons', () => {
    const selectors = [...base.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter((m) => /touch-action:\s*manipulation/.test(m[2]))
      .flatMap((m) => m[1].split(',').map((s) => s.trim()));
    expect(selectors).toEqual(expect.arrayContaining(['a', 'button', 'summary']));
  });

  it('keeps controls from selecting their label on a long press', () => {
    expect(rule(base, 'button')).toMatch(/user-select:\s*none/);
    expect(rule(layout, '.call')).toMatch(/user-select:\s*none/);
    // The number in the call line is content too: visitors on a desktop copy it.
    expect(rule(layout, '.tel')).not.toMatch(/user-select/);
  });

  it('uses the small viewport unit and never 100vh', () => {
    for (const css of sources) expect(css).not.toMatch(/\b100vh\b/);
    expect(layout).toMatch(/min-height:\s*\d+svh/);
  });

  it('stops overscroll only while Lenis smooths the scroll', () => {
    expect(rule(base, 'html.lenis')).toMatch(/overscroll-behavior-y:\s*none/);
    for (const css of sources) {
      for (const m of css.matchAll(/([^{}]+)\{([^{}]*overscroll-behavior[^{}]*)\}/g)) {
        expect(m[1].trim(), 'overscroll-behavior outside html.lenis').toBe('html.lenis');
      }
    }
  });

  it('keeps a white focus ring, clear of the white pills it surrounds', () => {
    expect(rule(base, ':focus-visible')).toMatch(/outline:\s*3px solid var\(--white\)/);
    expect(rule(base, ':focus-visible')).toMatch(/outline-offset:\s*3px/);
    expect(rule(layout, '.tel:focus-visible')).toMatch(/outline-offset:\s*4px/);
  });

  it('parks the car at the door and drops the other lanes for reduced motion', () => {
    const reduced = /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?\})\s*\}/.exec(layout)!;
    expect(reduced[1]).toMatch(/\.lane:not\(\[data-lane='arrive'\]\)\s*\{\s*display:\s*none/);
    // The hero's entrance only plays when motion is welcome.
    expect(layout).toMatch(/@media \(prefers-reduced-motion: no-preference\)\s*\{\s*\.hero__arc/);
  });

  it('shows the skip link only while it has focus', () => {
    expect(rule(base, '.skip-link:not(:focus)')).toMatch(/clip(-path)?:/);
    expect(rule(base, '.skip-link')).toMatch(/position:\s*fixed/);
  });
});
