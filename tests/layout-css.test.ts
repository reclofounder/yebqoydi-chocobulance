// Source-level guards for cascade details that jsdom cannot compute (it has no :hover).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(process.cwd(), 'src/styles/layout.css'), 'utf8');

/** Every innermost `selectors { body }` block in source order (media wrappers are skipped). */
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m, order) => ({
  order,
  selectors: m[1]
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(',')
    .map((s) => s.trim()),
  body: m[2],
}));
const rulesFor = (selector: string) => rules.filter((r) => r.selectors.includes(selector));

describe('layout.css cascade', () => {
  it('keeps the disabled pill grey on hover (same specificity as .cta:hover, so it must come later)', () => {
    const hover = rulesFor('.cta:hover');
    const disabledHover = rulesFor('.cta--disabled:hover');
    expect(hover.length).toBeGreaterThan(0);
    expect(disabledHover.length).toBeGreaterThan(0);
    const last = disabledHover[disabledHover.length - 1];
    expect(last.order).toBeGreaterThan(Math.max(...hover.map((r) => r.order)));
    expect(last.body).toMatch(/background:\s*var\(--grey-out\)/);
    expect(last.body).toMatch(/color:\s*var\(--choco-soft\)/);
  });

  it('never wraps the price between its digit groups', () => {
    const price = rulesFor('.price-card__price');
    expect(price.some((r) => /white-space:\s*nowrap/.test(r.body))).toBe(true);
  });
});
