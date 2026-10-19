// Static contract of index.html: the hooks the i18n engine, the scenes and the scroll timeline rely on.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import uz from '../src/i18n/uz.json';
import ru from '../src/i18n/ru.json';

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
    expect(ctas).toHaveLength(2);
    for (const cta of ctas) {
      expect(cta.localName).toBe('a');
      expect(cta.childElementCount).toBe(0);
      expect(cta.hasAttribute('id')).toBe(false);
      expect(cta.hasAttribute('aria-label')).toBe(false);
      expect(cta.getAttribute('href')).toBe('tel:105');
    }
    expect(doc.querySelector('#sticky-cta a.cta[data-cta][data-i18n="sticky.cta"]')).not.toBeNull();
  });

  it('starts the sticky bar hidden, with phone hints hidden until the engine reveals them', () => {
    expect(doc.querySelector('#sticky-cta')!.getAttribute('data-visible')).toBe('false');
    const hints = [...doc.querySelectorAll('[data-phone-hint]')];
    expect(hints).toHaveLength(2);
    for (const hint of hints) expect(hint.hasAttribute('hidden')).toBe(true);
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
});
