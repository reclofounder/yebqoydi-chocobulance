import vanSvg from './van.svg?raw';
import { t } from '../i18n';

/**
 * Geometry of the drawn van, in viewBox units. The scroll timeline reads it, so swapping the art
 * means replacing van.svg (same part ids) and updating these numbers to match the new drawing.
 */
export const VAN = {
  width: 480,
  height: 240,
  wheelRadius: 26,
  wheelCenters: [
    { x: 118, y: 196 },
    { x: 362, y: 196 },
  ],
} as const;

/** Degrees a wheel of `radiusPx` turns while rolling `distancePx` (positive = clockwise). */
export function wheelRotation(distancePx: number, radiusPx: number = VAN.wheelRadius): number {
  return (distancePx / (2 * Math.PI * radiusPx)) * 360;
}

/** Instances mounted without an explicit id still get a unique suffix. */
let unnamed = 0;

const URL_REF = /url\(\s*(['"]?)#([^'")\s]+)\1\s*\)/g;

/**
 * Suffixes every id in `svg` with `-${key}` and repoints the art's own references to them
 * (`url(#…)` in attributes and <style> blocks, `href` / `xlink:href`), so two vans can share a page.
 */
function suffixIds(svg: SVGSVGElement, key: string): void {
  const renamed = new Map<string, string>();
  for (const el of [svg, ...svg.querySelectorAll('[id]')]) {
    if (!el.id) continue;
    renamed.set(el.id, `${el.id}-${key}`);
    el.id = `${el.id}-${key}`;
  }

  const repoint = (value: string) =>
    value.replace(URL_REF, (match, quote: string, id: string) => {
      const next = renamed.get(id);
      return next ? `url(${quote}#${next}${quote})` : match;
    });

  for (const el of [svg, ...svg.querySelectorAll('*')]) {
    for (const attr of el.attributes) {
      if (attr.localName === 'href' && attr.value.startsWith('#')) {
        const next = renamed.get(attr.value.slice(1));
        if (next) attr.value = `#${next}`;
      } else if (attr.value.includes('url(')) {
        attr.value = repoint(attr.value);
      }
    }
  }
  for (const style of svg.querySelectorAll('style')) {
    style.textContent = repoint(style.textContent ?? '');
  }
}

/**
 * Appends a fresh van to `target` and returns its <svg>. Part ids get the suffix `-${id}`
 * (`#van-wheel-front-road`, `#siren-light-hero`); the root carries `.van` and `data-van="${id}"`.
 */
export function mountVan(target: Element, opts: { id?: string } = {}): SVGSVGElement {
  const key = opts.id ?? String(++unnamed);
  if (!/^[\w-]+$/.test(key)) {
    throw new Error(`mountVan: id "${key}" must be letters, digits, "_" or "-"`);
  }

  const parsed = new DOMParser().parseFromString(vanSvg, 'image/svg+xml');
  const root = parsed.documentElement;
  if (!(root instanceof SVGSVGElement) || parsed.querySelector('parsererror')) {
    throw new Error('mountVan: van.svg is not a well-formed <svg> document');
  }
  const svg = target.ownerDocument.importNode(root, true);

  suffixIds(svg, key);
  svg.classList.add('van');
  svg.setAttribute('data-van', key);
  // An image with a translated name; applyI18n keeps the label in step with the language toggle.
  svg.removeAttribute('aria-hidden');
  svg.setAttribute('role', 'img');
  svg.setAttribute('data-i18n-attr', 'aria-label:a11y.van');
  svg.setAttribute('aria-label', t('a11y.van'));

  target.append(svg);
  return svg;
}
