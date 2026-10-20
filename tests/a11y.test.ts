// Accessibility basics: the structure that keyboards and assistive tech rely on. Markup is read from
// index.html with the real copy and art applied; styles are checked at source level (jsdom has no
// focus ring or touch to compute).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import uz from '../src/i18n/uz.json';
import ru from '../src/i18n/ru.json';
import { applyI18n, type Lang } from '../src/i18n';
import { mountScenes } from '../src/scenes/mount';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const html = read('index.html');
const parsed = new DOMParser().parseFromString(html, 'text/html');

/** The page with its art mounted and its copy in `lang`, as a visitor gets it. */
function render(lang: Lang): void {
  document.head.innerHTML = parsed.head.innerHTML;
  document.body.innerHTML = parsed.body.innerHTML;
  mountScenes(document);
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

  it('tabs through the skip link, the header, then the hero call, in that order', () => {
    const tabbable = [...parsed.body.querySelectorAll<HTMLElement>('a[href], button, summary')];
    expect(tabbable.slice(0, 6).map((el) => el.className || el.localName)).toEqual([
      'skip-link',
      'brand',
      'cta cta--compact',
      'lang__btn',
      'lang__btn',
      'cta',
    ]);
    expect(tabbable[5].closest('#hero')).not.toBeNull();
    expect(parsed.querySelectorAll('#faq summary')).toHaveLength(5);
  });

  it('never traps or steals focus: no positive tabindex, no autofocus, no modal', () => {
    for (const el of parsed.querySelectorAll('[tabindex]')) {
      expect(Number(el.getAttribute('tabindex')), el.outerHTML).toBeLessThanOrEqual(-1);
    }
    expect(parsed.querySelector('[autofocus], dialog, [aria-modal]')).toBeNull();
  });

  it('declares the page language and the browser chrome colour', () => {
    expect(parsed.documentElement.getAttribute('lang')).toBe('uz');
    const theme = parsed.querySelector('meta[name="theme-color"]')!;
    const cream = /--cream:\s*(#[0-9a-f]{6})/i.exec(read('src/styles/tokens.css'))![1];
    expect(theme.getAttribute('content')!.toLowerCase()).toBe(cream.toLowerCase());
    expect(theme.getAttribute('content')!.toLowerCase()).toBe('#fff6ec');
  });

  it('keeps zoom available', () => {
    const viewport = parsed.querySelector('meta[name="viewport"]')!.getAttribute('content')!;
    expect(viewport).not.toMatch(/user-scalable\s*=\s*(no|0)|maximum-scale/);
  });
});

describe.each(['uz', 'ru'] as const)('names and labels (%s)', (lang) => {
  it('gives every button, link and question some text or an aria-label', () => {
    render(lang);
    const controls = document.querySelectorAll<HTMLElement>('button, a[href], summary');
    expect(controls.length).toBeGreaterThanOrEqual(14);
    for (const el of controls) {
      const name = el.getAttribute('aria-label') ?? el.textContent ?? '';
      expect(name.trim(), el.outerHTML).not.toBe('');
    }
    expect(document.querySelectorAll('details > summary')).toHaveLength(5);
  });

  it('labels the language group and gives every svg[role=img] a name', () => {
    render(lang);
    expect(document.querySelector('.lang')!.getAttribute('aria-label')).toBeTruthy();
    const images = document.querySelectorAll('svg[role="img"]');
    expect(images).toHaveLength(2); // the hero van and the road van
    for (const svg of images) expect(svg.getAttribute('aria-label')!.trim()).not.toBe('');
  });

  it('hides every other drawing from assistive tech', () => {
    render(lang);
    const decorative = [...document.querySelectorAll('svg:not([role="img"])')];
    expect(decorative.length).toBeGreaterThanOrEqual(8);
    for (const svg of decorative) {
      expect(svg.getAttribute('aria-hidden'), svg.getAttribute('class') ?? 'svg').toBe('true');
    }
    for (const img of document.querySelectorAll('img')) expect(img.hasAttribute('alt')).toBe(true);
  });
});

describe('the styles for touch and keyboard', () => {
  const base = strip(read('src/styles/base.css'));
  const layout = strip(read('src/styles/layout.css'));
  const sources = ['base', 'layout', 'scenes', 'van'].map((n) =>
    strip(read(`src/styles/${n}.css`)),
  );
  const rule = (css: string, selector: string) =>
    [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter((m) => m[1].split(',').some((s) => s.trim() === selector))
      .map((m) => m[2])
      .join(';');

  it('clears the tap highlight once, on the root', () => {
    expect(rule(base, 'html')).toMatch(/-webkit-tap-highlight-color:\s*transparent/);
  });

  it('answers a tap at once: touch-action: manipulation on links, buttons and questions', () => {
    const selectors = [...base.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter((m) => /touch-action:\s*manipulation/.test(m[2]))
      .flatMap((m) => m[1].split(',').map((s) => s.trim()));
    expect(selectors).toEqual(expect.arrayContaining(['a', 'button', 'summary']));
  });

  it('keeps controls from selecting their label on a long press', () => {
    expect(rule(base, 'button')).toMatch(/user-select:\s*none/);
    expect(rule(layout, '.cta')).toMatch(/user-select:\s*none/);
    // The questions are content: visitors copy them.
    expect(rule(layout, '.faq__item summary')).not.toMatch(/user-select/);
  });

  it('uses the small viewport unit and never 100vh', () => {
    for (const css of sources) expect(css).not.toMatch(/\b100vh\b/);
    expect(layout).toMatch(/min-height:\s*100svh/);
  });

  it('stops overscroll only while Lenis smooths the scroll', () => {
    expect(rule(base, 'html.lenis')).toMatch(/overscroll-behavior-y:\s*none/);
    for (const css of sources) {
      for (const m of css.matchAll(/([^{}]+)\{([^{}]*overscroll-behavior[^{}]*)\}/g)) {
        expect(m[1].trim(), 'overscroll-behavior outside html.lenis').toBe('html.lenis');
      }
    }
  });

  it('keeps the focus ring on the call buttons, the questions and the header', () => {
    expect(rule(base, ':focus-visible')).toMatch(/outline:\s*3px solid/);
    expect(rule(layout, '.cta:focus-visible')).toMatch(/outline-color/);
    expect(rule(layout, '.faq__item summary:focus-visible')).toMatch(/outline/);
    expect(rule(layout, '.header :focus-visible')).toMatch(/outline-color:\s*var\(--choco\)/);
  });

  it('shows the skip link only while it has focus', () => {
    expect(rule(base, '.skip-link:not(:focus)')).toMatch(/clip(-path)?:/);
    expect(rule(base, '.skip-link')).toMatch(/position:\s*fixed/);
  });
});
