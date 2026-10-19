// The van: a swappable SVG component plus the wheel-rotation math the scroll timeline uses.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vanSvg from '../src/van/van.svg?raw';
import uz from '../src/i18n/uz.json';
import ru from '../src/i18n/ru.json';
import { applyI18n } from '../src/i18n';
import { VAN, mountVan, wheelRotation } from '../src/van/van';

const PARTS = [
  'van-shadow',
  'van-body',
  'van-siren',
  'siren-light',
  'van-wheel-rear',
  'van-wheel-front',
];

/** Every id an element of `svg` points at: `url(#x)` in any attribute, and `href` / `xlink:href`. */
function referencesIn(svg: Element): string[] {
  const refs: string[] = [];
  for (const el of [svg, ...svg.querySelectorAll('*')]) {
    for (const attr of el.attributes) {
      for (const m of attr.value.matchAll(/url\(\s*['"]?#([^'")\s]+)/g)) refs.push(m[1]);
      if (attr.localName === 'href' && attr.value.startsWith('#')) refs.push(attr.value.slice(1));
    }
  }
  return refs;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('wheelRotation', () => {
  it('turns one full circle per circumference travelled', () => {
    expect(wheelRotation(2 * Math.PI * 26)).toBeCloseTo(360);
    expect(wheelRotation(0)).toBe(0);
  });

  it('uses the given radius and keeps the direction of travel', () => {
    expect(wheelRotation(Math.PI * 10, 10)).toBeCloseTo(180);
    expect(wheelRotation(-2 * Math.PI * VAN.wheelRadius)).toBeCloseTo(-360);
  });
});

describe('van.svg', () => {
  const doc = new DOMParser().parseFromString(vanSvg, 'image/svg+xml');

  it('matches the VAN contract: viewBox, part ids, wheel centres and radius', () => {
    expect(doc.documentElement.getAttribute('viewBox')).toBe(`0 0 ${VAN.width} ${VAN.height}`);
    for (const id of PARTS) expect(doc.getElementById(id), id).not.toBeNull();
    expect(doc.getElementById('siren-light')!.localName).toBe('rect');

    ['van-wheel-rear', 'van-wheel-front'].forEach((id, i) => {
      // The tyre is the wheel's largest circle: it sets the group's box, so its centre is the pivot.
      const circles = [...doc.getElementById(id)!.querySelectorAll('circle')];
      const r = (c: Element) => Number(c.getAttribute('r'));
      const tyre = circles.reduce((a, b) => (r(b) > r(a) ? b : a));
      expect(r(tyre)).toBe(VAN.wheelRadius);
      expect({ x: Number(tyre.getAttribute('cx')), y: Number(tyre.getAttribute('cy')) }).toEqual(
        VAN.wheelCenters[i],
      );
    });
  });

  it('paints only with design tokens: no raw colours, filters or raster images', () => {
    const paints = [...vanSvg.matchAll(/\b(?:fill|stroke|stop-color)\s*[:=]\s*"?([^;"]+)/g)].map(
      (m) => m[1].trim(),
    );
    expect(paints.length).toBeGreaterThan(0);
    for (const paint of paints) {
      expect(paint).toMatch(/^(none|currentColor|var\(--[\w-]+\)|url\(#[\w-]+\))$/);
    }
    expect(vanSvg).not.toMatch(/<(filter|image|foreignObject)\b|\bfilter\s*[:=]/);
  });
});

describe('mountVan', () => {
  it('appends the van with every id suffixed, so its parts are addressable per instance', () => {
    const host = document.createElement('div');
    document.body.append(host);

    const svg = mountVan(host, { id: 'hero' });

    expect(svg).toBeInstanceOf(SVGSVGElement);
    expect(svg.parentElement).toBe(host);
    expect(host.querySelector('#van-wheel-front-hero')).not.toBeNull();
    expect(host.querySelector('#siren-light-hero')).not.toBeNull();
    for (const id of PARTS) expect(svg.querySelector(`#${id}-hero`), id).not.toBeNull();
    for (const el of svg.querySelectorAll('[id]')) expect(el.id).toMatch(/-hero$/);
    expect(svg.classList.contains('van')).toBe(true);
    expect(svg.getAttribute('data-van')).toBe('hero');
  });

  it('lets two vans coexist: unique ids, and every internal reference stays inside its own van', () => {
    const hero = mountVan(document.body, { id: 'hero' });
    const road = mountVan(document.body, { id: 'road' });

    const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const svg of [hero, road]) {
      const refs = referencesIn(svg);
      expect(refs.length).toBeGreaterThan(0);
      for (const ref of refs) expect(svg.querySelector(`[id="${ref}"]`), ref).not.toBeNull();
    }
  });

  it('gives each van without an explicit id its own suffix', () => {
    const a = mountVan(document.body);
    const b = mountVan(document.body);
    expect(a.getAttribute('data-van')).not.toBe(b.getAttribute('data-van'));
    const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('rejects an id that would break url(#…) references', () => {
    expect(() => mountVan(document.body, { id: 'my van' })).toThrow(/id/);
    expect(document.body.childElementCount).toBe(0);
  });

  it('is an image labelled in the current language, and follows the language toggle', () => {
    const svg = mountVan(document.body, { id: 'hero' });

    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('data-i18n-attr')).toBe('aria-label:a11y.van');
    expect(svg.getAttribute('aria-label')).toBe(uz['a11y.van']);
    // The painted lettering is decoration: the label already names the van.
    for (const text of svg.querySelectorAll('text')) {
      expect(text.getAttribute('aria-hidden')).toBe('true');
    }

    applyI18n(document, 'ru');
    expect(svg.getAttribute('aria-label')).toBe(ru['a11y.van']);
    applyI18n(document, 'uz');
  });
});

describe('mountVan with swapped art', () => {
  // Final brand art will come from a design tool: xlink:href, quoted url()s and <style> blocks.
  const ART = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 480 240">
  <defs>
    <linearGradient id="paint"><stop offset="0" style="stop-color: var(--red)"/></linearGradient>
    <path id="shape" d="M0 0h10v10z"/>
    <clipPath id="clip"><use xlink:href="#shape"/></clipPath>
  </defs>
  <style>.cls-1 { fill: url(#paint); }</style>
  <g id="van-body" clip-path="url('#clip')" style="fill: url( #paint )">
    <use href="#shape"/>
    <use href="#not-in-this-art"/>
  </g>
</svg>`;

  afterEach(() => {
    vi.doUnmock('../src/van/van.svg?raw');
    vi.resetModules();
  });

  it('suffixes ids and rewrites xlink:href, quoted url() and <style> references to them', async () => {
    vi.resetModules();
    vi.doMock('../src/van/van.svg?raw', () => ({ default: ART }));
    const { mountVan: mount } = await import('../src/van/van');

    const svg = mount(document.body, { id: 'x' });

    const xlink = 'http://www.w3.org/1999/xlink';
    expect(svg.querySelector('clipPath use')!.getAttributeNS(xlink, 'href')).toBe('#shape-x');
    const body = svg.querySelector('#van-body-x')!;
    expect(body.getAttribute('clip-path')).toBe(`url('#clip-x')`);
    expect(body.getAttribute('style')).toBe('fill: url(#paint-x)');
    expect(body.querySelector('use')!.getAttribute('href')).toBe('#shape-x');
    // A reference to something outside the art is left alone.
    expect(body.querySelectorAll('use')[1].getAttribute('href')).toBe('#not-in-this-art');
    expect(svg.querySelector('style')!.textContent).toBe('.cls-1 { fill: url(#paint-x); }');
  });
});

describe('van.css', () => {
  it('pivots each wheel on its own centre, whatever the art (ids are suffixed per van)', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/van.css'), 'utf8').replace(
      /\/\*[\s\S]*?\*\//g,
      '',
    );
    const wheelRules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) =>
      m[1].includes('van-wheel-'),
    );
    expect(wheelRules.length).toBeGreaterThan(0);
    const body = wheelRules.map((m) => m[2]).join(';');
    expect(body).toMatch(/transform-box:\s*fill-box/);
    expect(body).toMatch(/transform-origin:\s*center/);
  });
});
