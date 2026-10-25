// Source-level guards for cascade details that jsdom cannot compute (it has no layout).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(process.cwd(), 'src/styles/layout.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

/** The bodies of every rule whose selector list includes `selector`, joined. */
const rule = (selector: string) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((m) => m[1].split(',').some((s) => s.trim() === selector))
    .map((m) => m[2])
    .join(';');

describe('layout.css', () => {
  it('never wraps the number inside its pill', () => {
    expect(rule('.tel')).toMatch(/white-space:\s*nowrap/);
    expect(rule('.call')).toMatch(/white-space:\s*nowrap/);
  });

  it('keeps the lanes a full screen apart, so only one car is ever on screen', () => {
    expect(rule('.beat')).toMatch(/min-height:\s*100svh/);
    expect(rule('.block')).toMatch(/min-height:\s*100svh/);
  });

  it('clips each lane, so a car off the edge never makes the page scroll sideways', () => {
    expect(rule('.lane')).toMatch(/overflow:\s*clip/);
  });

  it('stretches the lane at the door: centred like the words, it would shrink to nothing', () => {
    expect(rule('.beat--arrive > .lane')).toMatch(/justify-self:\s*stretch/);
  });

  it('moves the car only with transform (car.ts) and parks it in the middle of its lane', () => {
    const car = rule('.car');
    expect(car).toMatch(/left:\s*50%/);
    expect(car).toMatch(/will-change:\s*transform/);
  });
});
