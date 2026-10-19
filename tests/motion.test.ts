// The scroll story: which branch boots (pinned scenes or still frames), the five pinned scenes and
// their scroll distances, where a scene taller than the screen pins, how far the road wheels turn,
// the header and the sticky bar, smooth scrolling, and the CSS the motion leans on. GSAP,
// ScrollTrigger and Lenis are fakes: these tests cover the choices this code makes, not the libraries.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mountScenes } from '../src/scenes/mount';
import { VAN, wheelRotation } from '../src/van/van';
import { initScroll, prefersReducedMotion } from '../src/scroll/motion';
import { initReduced } from '../src/scroll/reduced';
import { pinShift, wheelTurn } from '../src/scroll/timeline';

const fake = vi.hoisted(() => {
  /** The media queries that currently match. */
  const media = new Set<string>();

  type Context = { conditions: Record<string, boolean> };
  type Cleanup = (() => void) | void;
  /** Each gsap.matchMedia().add(), re-runnable after `media` changes (as GSAP does on a change). */
  const contexts: Array<{ rerun: () => void }> = [];

  /** A chainable stand-in for a GSAP timeline; `scrollTrigger.end` is the pin's last scroll px. */
  const timeline = () => {
    const tl: Record<string, unknown> = { scrollTrigger: { end: 0 } };
    for (const method of ['to', 'from', 'fromTo', 'set', 'add', 'call']) {
      tl[method] = vi.fn(() => tl);
    }
    return tl;
  };

  const gsap = {
    registerPlugin: vi.fn(),
    timeline: vi.fn(timeline),
    set: vi.fn(),
    to: vi.fn(),
    fromTo: vi.fn(),
    ticker: { add: vi.fn(), remove: vi.fn(), lagSmoothing: vi.fn() },
    // GSAP's contract: run `fn` while any condition matches, with every condition's state; on a
    // media change, undo the previous run (its returned cleanup) and run again.
    matchMedia: vi.fn(() => {
      const mm = {
        add(conditions: Record<string, string>, fn: (context: Context) => Cleanup) {
          let cleanup: Cleanup;
          const rerun = () => {
            cleanup?.();
            cleanup = undefined;
            const state = Object.fromEntries(
              Object.entries(conditions).map(([name, query]) => [name, media.has(query)]),
            );
            if (Object.values(state).some(Boolean)) cleanup = fn({ conditions: state });
          };
          rerun();
          contexts.push({ rerun });
          return mm;
        },
        revert: vi.fn(),
      };
      return mm;
    }),
  };

  const ScrollTrigger = { create: vi.fn(), refresh: vi.fn(), update: vi.fn() };
  const lenis = { on: vi.fn(), raf: vi.fn(), destroy: vi.fn() };
  const Lenis = vi.fn(function () {
    return lenis;
  });

  return { media, contexts, gsap, ScrollTrigger, Lenis, lenis };
});

vi.mock('gsap', () => ({ gsap: fake.gsap, default: fake.gsap }));
vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: fake.ScrollTrigger,
  default: fake.ScrollTrigger,
}));
vi.mock('lenis', () => ({ default: fake.Lenis }));

const REDUCE = '(prefers-reduced-motion: reduce)';
// The motion's breakpoint is the layout's (layout.css / scenes.css switch at 900 px).
const NARROW = '(max-width: 899.98px)';
const WIDE = '(min-width: 900px)';
const FINE = '(pointer: fine)';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const html = read('index.html');

const root = document.documentElement;
const byId = (id: string) => document.getElementById(id)!;
const isReduced = () => root.classList.contains('reduced');
const sirenOn = (id: string) => byId(`siren-light-${id}`).classList.contains('siren--on');

type Pin = {
  trigger: HTMLElement;
  pin: boolean;
  scrub: number;
  end: string;
  anticipatePin: number;
};
/** The scroll-trigger settings of every pinned timeline, in creation order. */
const pins = (): Pin[] =>
  fake.gsap.timeline.mock.calls
    .map((args) => (args as unknown as [{ scrollTrigger?: Pin }?])[0]?.scrollTrigger)
    .filter((st): st is Pin => Boolean(st?.pin));

type Trigger = { start: unknown; onToggle: (self: { isActive: boolean }) => void };
const triggers = () => fake.ScrollTrigger.create.mock.calls.map((args) => args[0] as Trigger);

function setScrollY(y: number): void {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  window.dispatchEvent(new Event('scroll'));
}

beforeEach(() => {
  vi.clearAllMocks();
  fake.media.clear();
  fake.contexts.length = 0;
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: fake.media.has(query),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
  // The real page, with its art mounted: every id the timeline looks up exists.
  document.body.innerHTML = new DOMParser().parseFromString(html, 'text/html').body.innerHTML;
  mountScenes(document);
});

afterEach(() => {
  vi.unstubAllGlobals();
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  root.classList.remove('reduced');
  document.body.innerHTML = '';
});

describe('prefersReducedMotion', () => {
  it('follows the reduced-motion media query', () => {
    expect(prefersReducedMotion()).toBe(false);
    fake.media.add(REDUCE);
    expect(prefersReducedMotion()).toBe(true);
  });
});

describe('initScroll with reduced motion', () => {
  it('shows the story as still frames: no pins, no scrubbing, no smoothing, no siren', () => {
    fake.media.add(REDUCE).add(WIDE).add(FINE);

    initScroll();

    expect(isReduced()).toBe(true);
    expect(fake.gsap.matchMedia).not.toHaveBeenCalled();
    expect(fake.gsap.timeline).not.toHaveBeenCalled();
    expect(fake.ScrollTrigger.create).not.toHaveBeenCalled();
    expect(fake.Lenis).not.toHaveBeenCalled();
    expect(sirenOn('hero')).toBe(false);
    expect(sirenOn('road')).toBe(false);
  });
});

describe('initScroll with motion', () => {
  const SCENES = ['hero', 'scene-kitchen', 'scene-call', 'scene-road', 'scene-door'];

  it('pins the five story scenes in order, scrubbed, for the planned distances on desktop', () => {
    fake.media.add(WIDE);

    initScroll();

    expect(pins().map((st) => st.trigger.id)).toEqual(SCENES);
    expect(pins().map((st) => st.end)).toEqual(['+=150%', '+=200%', '+=150%', '+=300%', '+=150%']);
    expect(pins().map((st) => st.scrub)).toEqual([0.8, 0.8, 0.8, 0.8, 0.8]);
    expect(isReduced()).toBe(false);
  });

  it('shortens every pin to three quarters on phones and tablets', () => {
    fake.media.add(NARROW);

    initScroll();

    expect(pins().map((st) => st.trigger.id)).toEqual(SCENES);
    expect(pins().map((st) => st.end)).toEqual([
      '+=112.5%',
      '+=150%',
      '+=112.5%',
      '+=225%',
      '+=112.5%',
    ]);
  });

  it('draws the call line in path units, without rounding the offset to whole pixels', () => {
    fake.media.add(NARROW);
    initScroll();

    // pathLength="1": the offset runs 1 -> 0, so GSAP's px auto-rounding would snap it.
    type Chain = { fromTo: { mock: { calls: [Element, object, { autoRound?: boolean }][] } } };
    const call = fake.gsap.timeline.mock.results[2].value as Chain;
    const line = call.fromTo.mock.calls.find(([target]) => target.id === 'call-line')!;
    expect(line[1]).toEqual({ strokeDashoffset: 1 });
    expect(line[2]).toMatchObject({ strokeDashoffset: 0, autoRound: false });
  });

  it('pulses both sirens while the story runs', () => {
    fake.media.add(NARROW);

    initScroll();

    expect(sirenOn('hero')).toBe(true);
    expect(sirenOn('road')).toBe(true);
  });

  it('frosts the header past 40 px and shows the sticky bar once the hero lets go', () => {
    fake.media.add(NARROW);
    initScroll();
    const header = byId('header');
    const sticky = byId('sticky-cta');

    const frost = triggers().find((t) => t.start === 40)!;
    frost.onToggle({ isActive: true });
    expect(header.dataset.scrolled).toBe('true');
    frost.onToggle({ isActive: false });
    expect(header.dataset.scrolled).toBe('false');

    // The bar's trigger starts where the hero's pin ends, whatever that is after a refresh.
    const hero = fake.gsap.timeline.mock.results[0].value as { scrollTrigger: { end: number } };
    hero.scrollTrigger.end = 1234;
    const bar = triggers().find((t) => typeof t.start === 'function')!;
    expect((bar.start as () => number)()).toBe(1234);
    bar.onToggle({ isActive: true });
    expect(sticky.dataset.visible).toBe('true');
    bar.onToggle({ isActive: false });
    expect(sticky.dataset.visible).toBe('false');
  });

  it('smooths mouse and trackpad scrolling with Lenis, on the GSAP ticker', () => {
    fake.media.add(WIDE).add(FINE);

    initScroll();

    expect(fake.Lenis).toHaveBeenCalledTimes(1);
    expect(fake.lenis.on).toHaveBeenCalledWith('scroll', fake.ScrollTrigger.update);
    expect(fake.gsap.ticker.add).toHaveBeenCalledTimes(1);
    expect(fake.gsap.ticker.lagSmoothing).toHaveBeenCalledWith(0);
  });

  it('leaves touch scrolling native, and pins a touch early there', () => {
    fake.media.add(NARROW);

    initScroll();

    expect(fake.Lenis).not.toHaveBeenCalled();
    expect(pins().map((st) => st.anticipatePin)).toEqual([1, 1, 1, 1, 1]);
  });

  it('pins on time under Lenis, which moves the scroll and the pins in the same frame', () => {
    fake.media.add(WIDE).add(FINE);

    initScroll();

    expect(pins().map((st) => st.anticipatePin)).toEqual([0, 0, 0, 0, 0]);
  });

  it('drops to the still frames when reduced motion is switched on mid-visit, and back', () => {
    fake.media.add(WIDE).add(FINE);
    initScroll();
    expect(pins()).toHaveLength(5);

    fake.media.add(REDUCE);
    fake.contexts.forEach((context) => context.rerun());

    expect(isReduced()).toBe(true);
    expect(pins()).toHaveLength(5); // nothing new pinned
    expect(sirenOn('hero')).toBe(false);
    expect(fake.lenis.destroy).toHaveBeenCalledTimes(1);

    fake.media.delete(REDUCE);
    fake.contexts.forEach((context) => context.rerun());

    expect(isReduced()).toBe(false);
    expect(pins()).toHaveLength(10);
    expect(sirenOn('hero')).toBe(true);
  });
});

describe('initReduced', () => {
  it('frosts the header past 40 px and shows the sticky bar once the hero call button is gone', () => {
    const stop = initReduced();
    const header = byId('header');
    const sticky = byId('sticky-cta');
    let ctaBottom = 480;
    vi.spyOn(
      document.querySelector('#hero [data-cta]')!,
      'getBoundingClientRect',
    ).mockImplementation(() => ({ bottom: ctaBottom }) as DOMRect);

    setScrollY(40);
    expect(header.dataset.scrolled).toBe('false');
    expect(sticky.dataset.visible).toBe('false');

    setScrollY(41);
    expect(header.dataset.scrolled).toBe('true');

    ctaBottom = -1;
    setScrollY(600);
    expect(sticky.dataset.visible).toBe('true');

    ctaBottom = 12;
    setScrollY(500);
    expect(sticky.dataset.visible).toBe('false');

    stop();
  });

  it('undoes itself: the class goes and the page scroll is no longer watched', () => {
    const stop = initReduced();
    expect(isReduced()).toBe(true);

    stop();
    setScrollY(400);

    expect(isReduced()).toBe(false);
    expect(byId('header').dataset.scrolled).toBe('false');
  });
});

describe('pinShift: where a scene pins, in px above the top of the screen', () => {
  // A 390x844 phone: 64 px header, title 125 px into the scene, 72 px sticky bar.
  const phone = { viewport: 844, header: 64, titleTop: 125, reserved: 72 };

  it('pins a scene that fits at its top', () => {
    expect(pinShift({ ...phone, height: 700 })).toBe(0);
    expect(pinShift({ ...phone, height: 800, reserved: 0, viewport: 800 })).toBe(0);
  });

  it('raises a full-screen scene so its stage clears the sticky bar, if its title stays clear of the header', () => {
    expect(pinShift({ ...phone, height: 844, reserved: 40 })).toBe(40);
  });

  it('keeps the title clear of the header when the stage would lose only a sliver to the bar', () => {
    // 72 px needed, 53 px allowed (title 8 px under the header): 19 px of stage under the bar.
    expect(pinShift({ ...phone, height: 844 })).toBe(53);
  });

  it('lets the stage win in a scene far taller than the screen (the title was read on the way in)', () => {
    // The kitchen at 390x844 (its card makes it 980 px), and a call scene on a 375x667 phone.
    expect(pinShift({ ...phone, height: 980 })).toBe(208);
    expect(pinShift({ ...phone, viewport: 667, height: 782 })).toBe(187);
  });

  it('keeps the hero headline in view: the hero rises only as far as its title allows', () => {
    // The hero on a 375x667 phone (828 px; no sticky bar yet): headline and call button first.
    const hero = { ...phone, viewport: 667, height: 828, reserved: 0 };
    expect(pinShift(hero, 'title')).toBe(53);
    expect(pinShift({ ...hero, viewport: 828 }, 'title')).toBe(0);
  });
});

describe('wheelTurn', () => {
  it('turns the road wheels by the distance the van rolls along the road, at their drawn size', () => {
    // The van crosses 130 % of the stage while the road (near layer) slides 90 % the other way.
    expect(wheelTurn(1000, VAN.width)).toBeCloseTo(wheelRotation(2200, VAN.wheelRadius));
    // A van drawn at half size has half-size wheels: twice the turns for the same road.
    expect(wheelTurn(1000, VAN.width / 2)).toBeCloseTo(2 * wheelRotation(2200, VAN.wheelRadius));
  });
});

describe('the CSS the motion leans on', () => {
  const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
  const vanCss = strip(read('src/styles/van.css'));
  const scenesCss = strip(read('src/styles/scenes.css'));
  const rules = (css: string) =>
    [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1].trim(), body: m[2] }));
  const body = (css: string, selector: string) =>
    rules(css)
      .filter((r) => r.selector.split(',').some((s) => s.trim() === selector))
      .map((r) => r.body)
      .join(';');
  const reducedMedia = (css: string) =>
    css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));

  it('turns the wheels from a custom property, about their own centres', () => {
    const wheels = body(vanCss, ".van [id^='van-wheel-']");
    expect(wheels).toMatch(/transform:\s*rotate\(var\(--wheel-rot,\s*0deg\)\)/);
    expect(wheels).toMatch(/transform-box:\s*fill-box/);
  });

  it('pulses the siren and idles the parked van, and stops both under reduced motion', () => {
    expect(body(vanCss, '.siren--on')).toMatch(/animation:/);
    expect(vanCss).toMatch(/\[data-van='hero'\][^{]*\{[^}]*animation:/);
    expect(vanCss).toContain('@media (prefers-reduced-motion: reduce)');
    const reduced = reducedMedia(vanCss);
    expect(reduced).toMatch(/\.siren--on[^{]*\{[^}]*animation:\s*none/);
    expect(reduced).toMatch(/\[data-van='hero'\][^{]*\{[^}]*animation:\s*none/);
  });

  it('opens the door on a custom property, and holds it open in the still frame', () => {
    expect(body(scenesCss, '#door-leaf')).toMatch(
      /transform:\s*perspective\(900px\)\s*rotateY\(var\(--door-open,\s*0deg\)\)/,
    );
    expect(body(scenesCss, '.reduced #door-leaf')).toMatch(/--door-open:\s*-100deg/);
  });

  it('pops the hearts on a custom property', () => {
    expect(body(scenesCss, '#heart-l')).toMatch(/transform:\s*scale\(var\(--pop,\s*1\)\)/);
    expect(body(scenesCss, '#heart-r')).toMatch(/transform:\s*scale\(var\(--pop,\s*1\)\)/);
  });

  it('parks the road van in view and hides the scroll hint in the still frame', () => {
    expect(scenesCss).toMatch(/\.reduced #scene-road \.van\s*\{[^}]*left:/);
    expect(body(scenesCss, '.reduced .hero__scroll')).toMatch(/display:\s*none/);
  });

  it('makes the travelling road layers two stages wide, past the svg max-width cap', () => {
    // base.css caps every svg at max-width: 100%; capped, a layer's edge shows once it moves.
    for (const layer of ['far', 'mid', 'near']) {
      const rule = body(scenesCss, `.scene__stage > .layer-${layer}`);
      expect(rule).toMatch(/width:\s*200%/);
      expect(rule).toMatch(/max-width:\s*none/);
    }
  });

  it('promotes only the moving road layers and the road van', () => {
    const all = ['base', 'layout', 'scenes', 'van'].flatMap((name) =>
      rules(strip(read(`src/styles/${name}.css`))),
    );
    const promoted = all.filter((r) => /will-change/.test(r.body));
    const selectors = promoted.flatMap((r) => r.selector.split(',').map((s) => s.trim()));
    expect(selectors.sort()).toEqual(
      [
        ':root:not(.reduced) #scene-road .layer-far',
        ':root:not(.reduced) #scene-road .layer-mid',
        ':root:not(.reduced) #scene-road .layer-near',
        ':root:not(.reduced) #scene-road .van',
      ].sort(),
    );
  });
});
