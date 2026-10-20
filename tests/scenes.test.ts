// The illustrated story: each pinned scene's art mounted into the real page, with the part ids
// the scroll timeline animates and the HTML overlays that carry the scenes' copy.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mountScenes } from '../src/scenes/mount';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const html = read('index.html');
const ART = ['hero-bg', 'kitchen', 'call', 'road-sky', 'road-far', 'road-mid', 'road-near', 'door'];
const sources = Object.fromEntries(ART.map((name) => [name, read(`src/scenes/${name}.svg`)]));

/** Custom properties the art may paint with: the design tokens, plus the road's sky stops. */
const TOKENS = new Set([
  ...[...read('src/styles/tokens.css').matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]),
  '--road-sky-top',
  '--road-sky-bottom',
]);

/** Animated parts, by the scene that owns them (the vans' ids carry their mount suffix). */
const PARTS: Record<string, string[]> = {
  hero: ['siren-light-hero', 'van-wheel-front-hero'],
  kitchen: ['dad-peek', 'tub-lid'],
  call: ['digit-1', 'digit-0', 'digit-5', 'call-line', 'bubble'],
  road: ['road-lines', 'siren-light-road', 'van-wheel-front-road', 'van-wheel-rear-road'],
  door: ['door-leaf', 'tub-full', 'heart-l', 'heart-r', 'dad-thumb', 'price-badge'],
};

const stage = (scene: string) =>
  document.querySelector<HTMLElement>(`[data-scene="${scene}"] > .scene__stage`)!;

/** What a stage holds, in paint order: the van as `van:<id>`, art by its layer or `art`. */
function contents(scene: string): string[] {
  return [...stage(scene).children].map((el) => {
    if (el.matches('.van')) return `van:${el.getAttribute('data-van')}`;
    return (
      [...el.classList].find((c) => c.startsWith('layer-')) ??
      (el.matches('.scene__art') ? 'art' : el.localName)
    );
  });
}

beforeEach(() => {
  // The real page body, as the browser parses it (the module script is inert under innerHTML).
  document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML;
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('mountScenes on the real page', () => {
  it('fills every pinned stage back to front: the art first, the van on top', () => {
    mountScenes(document);

    expect(contents('hero')).toEqual(['art', 'van:hero']);
    expect(contents('kitchen')).toEqual(['art']);
    expect(contents('call')).toEqual(['art']);
    expect(contents('road')).toEqual([
      'layer-sky',
      'layer-far',
      'layer-mid',
      'layer-near',
      'van:road',
    ]);
    expect(contents('door')).toEqual(['art']);
  });

  it('exposes every animated part exactly once, inside the scene that animates it', () => {
    mountScenes(document);

    for (const [scene, ids] of Object.entries(PARTS)) {
      for (const id of ids) {
        expect(document.querySelectorAll(`[id="${id}"]`), id).toHaveLength(1);
        expect(
          document.getElementById(id)!.closest('[data-scene]')!.getAttribute('data-scene'),
          id,
        ).toBe(scene);
      }
    }
    expect(document.querySelector('.layer-near #road-lines')).not.toBeNull();
    // Hinged and popping parts are groups, so the timeline moves them as one piece.
    for (const id of [
      'dad-peek',
      'tub-lid',
      'door-leaf',
      'tub-full',
      'heart-l',
      'heart-r',
      'dad-thumb',
    ]) {
      expect(document.getElementById(id)!.localName, id).toBe('g');
    }
  });

  it('never repeats an id anywhere on the page', () => {
    mountScenes(document);

    const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
    const repeated = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(repeated).toEqual([]);
  });

  it('keeps the bubble and the price badge as translatable HTML laid over their stage', () => {
    mountScenes(document);

    const overlays = [...document.querySelectorAll<HTMLElement>('.scene__overlay')];
    expect(overlays.map((o) => o.closest('[data-scene]')!.getAttribute('data-scene'))).toEqual([
      'call',
      'door',
    ]);
    for (const overlay of overlays) {
      expect(overlay.previousElementSibling!.matches('.scene__stage')).toBe(true);
      // Real copy, read by screen readers: never hidden (aria-hidden="false" would be a no-op).
      expect(overlay.hasAttribute('aria-hidden')).toBe(false);
    }

    const bubble = document.getElementById('bubble')!;
    expect(bubble).toBeInstanceOf(HTMLElement);
    expect(bubble.parentElement!.matches('#scene-call > .scene__overlay')).toBe(true);
    expect(bubble.getAttribute('data-i18n')).toBe('call.bubble');

    const badge = document.getElementById('price-badge')!;
    expect(badge).toBeInstanceOf(HTMLElement);
    expect(badge.parentElement!.matches('#scene-door > .scene__overlay')).toBe(true);
    expect(badge.querySelector('[data-i18n="door.price"]')).not.toBeNull();
    expect(badge.querySelector('[data-i18n="door.price.note"]')).not.toBeNull();
  });

  it('marks the scene art decorative: no text but the dial-pad digits, which are hidden too', () => {
    mountScenes(document);

    const art = [...document.querySelectorAll('.scene__stage > svg:not(.van)')];
    expect(art).toHaveLength(8);
    for (const svg of art) {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.getAttribute('focusable')).toBe('false');
    }

    const texts = [...document.querySelectorAll('.scene__stage > svg:not(.van) text')];
    expect(texts.length).toBeGreaterThanOrEqual(12);
    for (const text of texts) {
      expect(text.closest('[data-scene]')!.getAttribute('data-scene')).toBe('call');
      expect(text.getAttribute('aria-hidden')).toBe('true');
      expect(text.textContent).toMatch(/^[0-9*#]$/);
    }
  });

  it('draws the call line with a unit path length, so its dash offset runs from 1 to 0', () => {
    mountScenes(document);

    const line = document.getElementById('call-line')!;
    expect(line.localName).toBe('path');
    expect(line.getAttribute('pathLength')).toBe('1');
  });

  it('makes the road layers behind the sky twice as wide, pinned bottom-left, for parallax', () => {
    mountScenes(document);

    for (const layer of ['layer-far', 'layer-mid', 'layer-near']) {
      const svg = stage('road').querySelector(`.${layer}`)!;
      expect(svg.getAttribute('viewBox'), layer).toBe('0 0 1600 450');
      expect(svg.getAttribute('preserveAspectRatio'), layer).toBe('xMinYMax slice');
    }
  });

  it('can run again: one of everything, and the vans that are already there stay', () => {
    mountScenes(document);
    const vans = [...document.querySelectorAll('[data-van]')];
    const before = Object.keys(PARTS).map(contents);
    const nodes = Object.keys(PARTS).map((scene) => stage(scene).childNodes.length);

    mountScenes(document);

    expect(document.querySelectorAll('[data-van="hero"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-van="road"]')).toHaveLength(1);
    expect([...document.querySelectorAll('[data-van]')]).toEqual(vans);
    expect(Object.keys(PARTS).map(contents)).toEqual(before);
    expect(Object.keys(PARTS).map((scene) => stage(scene).childNodes.length)).toEqual(nodes);
    expect(document.querySelectorAll('#coverage [data-stage] > svg')).toHaveLength(1);
  });
});

describe('scene art sources', () => {
  it.each(ART)(
    '%s paints with design tokens only: no raw colours, filters or raster images',
    (name) => {
      const svg = sources[name];
      const paints = [...svg.matchAll(/\b(?:fill|stroke|stop-color)\s*[:=]\s*"?([^;"]+)/g)].map(
        (m) => m[1].trim(),
      );
      expect(paints.length).toBeGreaterThan(0);
      for (const paint of paints) {
        expect(paint).toMatch(/^(none|url\(#[\w-]+\)|var\(--[\w-]+(,\s*var\(--[\w-]+\))?\))$/);
        for (const [, prop] of paint.matchAll(/var\((--[\w-]+)/g))
          expect(TOKENS, `${name}: ${prop}`).toContain(prop);
      }
      expect(svg).not.toMatch(
        /<(filter|image|foreignObject|script)\b|\bfilter\s*[:=]|rgba?\(|hsla?\(/,
      );
    },
  );

  it.each(ART)(
    '%s is well-formed XML (it is parsed as an SVG document, not only as HTML)',
    (name) => {
      const doc = new DOMParser().parseFromString(sources[name], 'image/svg+xml');
      expect(doc.querySelector('parsererror')).toBeNull();
      expect(doc.documentElement.localName).toBe('svg');
    },
  );

  it('keeps each drawing under 20 KB and all of them under 100 KB (they ship inside the JS)', () => {
    const sizes = ART.map((name) => Buffer.byteLength(sources[name]));
    for (const [i, size] of sizes.entries()) expect(size, ART[i]).toBeLessThan(20_000);
    expect(sizes.reduce((a, b) => a + b)).toBeLessThan(100_000);
  });
});

describe('scenes.css', () => {
  const css = read('src/styles/scenes.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const body = (selector: string) =>
    [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter((m) => m[1].split(',').some((s) => s.trim() === selector))
      .map((m) => m[2])
      .join(';');

  it('gives the stages a stable shape: 4:5 on phones, 4:3 on tablets, 16:9 from 900 px', () => {
    expect(body('.scene__stage')).toMatch(/aspect-ratio:\s*4\s*\/\s*5/);
    expect(css).toMatch(
      /@media \(min-width: 600px\) and \(max-width: 899\.98px\)[^}]*\.scene__stage[^{]*\{[^}]*aspect-ratio:\s*4\s*\/\s*3/,
    );
    expect(css).toMatch(
      /@media \(min-width: 900px\)[^}]*\.scene__stage[^{]*\{[^}]*aspect-ratio:\s*16\s*\/\s*9/,
    );
    // The hero is a wide street strip at every size, so its van stays in the first screen.
    expect(body('#hero .scene__stage')).toMatch(/aspect-ratio:\s*16\s*\/\s*9/);
  });

  it('sizes the price tag to its unbroken price, so the price never spills out on a narrow phone', () => {
    // jsdom has no layout: guard the rule pair that keeps "99 000 soʻm" inside the red tag.
    expect(body('.price-badge__price')).toMatch(/white-space:\s*nowrap/);
    expect(body('.price-badge')).toMatch(/width:\s*min-content/);
    expect(body('.price-badge')).not.toMatch(/max-width:\s*\d+%/);
  });

  it('sets the hero note and phone hint on a cream chip on desktop, where the street runs under them', () => {
    // On short laptop screens (1280x720, 1366x650, 1440x790) they landed on the road, which is
    // their own colour (--choco-soft, about 1:1). Phones keep the copy above the street.
    expect(css).toMatch(
      /@media \(min-width: 900px\)\s*\{\s*#hero \.note,\s*#hero \.phone-hint\s*\{/,
    );
    for (const selector of ['#hero .note', '#hero .phone-hint']) {
      expect(body(selector)).toMatch(
        /background:\s*color-mix\(in srgb, var\(--cream\) 92%, transparent\)/,
      );
      expect(body(selector)).toMatch(/width:\s*fit-content/);
      expect(body(selector)).toMatch(/border-radius:\s*var\(--r-m\)/);
    }
  });

  it('turns the door on its own box, from the hinge side', () => {
    expect(body('#door-leaf')).toMatch(/transform-box:\s*fill-box/);
    expect(body('#door-leaf')).toMatch(/transform-origin:\s*left center/);
  });
});
