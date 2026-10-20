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
import { beat, pinShift, wheelTurn } from '../src/scroll/timeline';

const fake = vi.hoisted(() => {
  /** The media queries that currently match. */
  const media = new Set<string>();

  type Context = { conditions: Record<string, boolean> };
  type Cleanup = (() => void) | void;
  /** Each gsap.matchMedia().add(), re-runnable after `media` changes (as GSAP does on a change). */
  const contexts: Array<{ rerun: () => void }> = [];

  /** A stand-in for a paused GSAP tween: the gags are played and reversed in time. */
  const tween = () => {
    const t: Record<string, unknown> = {};
    for (const method of ['play', 'reverse', 'timeScale']) t[method] = vi.fn(() => t);
    return t;
  };

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
    fromTo: vi.fn(tween),
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
const siren = (id: string, state: 'on' | 'alert') =>
  byId(`siren-light-${id}`).classList.contains(`siren--${state}`);
const sirenOn = (id: string) => siren(id, 'on');

type Pin = {
  trigger: HTMLElement;
  pin: boolean;
  scrub: number | boolean;
  end: string;
  anticipatePin: number;
  onUpdate: (self: { progress: number }) => void;
};
/** The scroll-trigger settings of every pinned timeline, in creation order. */
const pins = (): Pin[] =>
  fake.gsap.timeline.mock.calls
    .map((args) => (args as unknown as [{ scrollTrigger?: Pin }?])[0]?.scrollTrigger)
    .filter((st): st is Pin => Boolean(st?.pin));

/** What a ScrollTrigger callback is handed: where the page is, and where the trigger starts. */
type Self = { scroll: () => number; start: number; progress: number; isActive: boolean };
/** At the page bottom a trigger ending at 'max' has progress 1 and is no longer "active". */
const at = (scroll: number, start: number): Self => ({
  scroll: () => scroll,
  start,
  progress: scroll > start ? 1 : 0,
  isActive: false,
});
type Trigger = {
  trigger?: Element;
  pinnedContainer?: Element;
  start: unknown;
  onUpdate: (self: Self) => void;
  onRefresh: (self: Self) => void;
};
const triggers = () => fake.ScrollTrigger.create.mock.calls.map((args) => args[0] as Trigger);

type FakeTween = Record<'play' | 'reverse' | 'timeScale', ReturnType<typeof vi.fn>>;
/** The paused tween of the gag whose target is (or starts with) the element with this id. */
function gag(id: string): FakeTween {
  const i = fake.gsap.fromTo.mock.calls.findIndex((args) => {
    const target = (args as unknown[])[0];
    return (Array.isArray(target) ? target[0] : (target as Element | null))?.id === id;
  });
  expect(i, `no gag tween for #${id}`).toBeGreaterThanOrEqual(0);
  return fake.gsap.fromTo.mock.results[i].value as FakeTween;
}
const played = (...ids: string[]) => ids.map((id) => gag(id).play.mock.calls.length);

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
    expect(pins().map((st) => st.end)).toEqual(['+=60%', '+=120%', '+=150%', '+=300%', '+=150%']);
    // Native scrolling: a light catch-up smooths the scrubbed motion.
    expect(pins().map((st) => st.scrub)).toEqual([0.4, 0.4, 0.4, 0.4, 0.4]);
    expect(isReduced()).toBe(false);
  });

  it('shortens every pin to three quarters on phones and tablets', () => {
    fake.media.add(NARROW);

    initScroll();

    expect(pins().map((st) => st.trigger.id)).toEqual(SCENES);
    expect(pins().map((st) => st.end)).toEqual([
      '+=45%',
      '+=90%',
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

  it('pulses both sirens while the story runs: a slow breath parked, a blink once it moves', () => {
    fake.media.add(NARROW);

    initScroll();

    expect(sirenOn('hero')).toBe(true);
    expect(siren('hero', 'alert')).toBe(false);
    expect(sirenOn('road')).toBe(true);
    expect(siren('road', 'alert')).toBe(true);

    // The hero's one beat: the first few px of its pin switch its siren to the road blink.
    const hero = pins()[0];
    hero.onUpdate({ progress: 0.06 });
    expect(siren('hero', 'alert')).toBe(true);
    hero.onUpdate({ progress: 0 });
    expect(siren('hero', 'alert')).toBe(false);
  });

  it('retimes the siren by playback rate, so the light keeps its phase when the blink starts', () => {
    fake.media.add(NARROW);
    const rates = (id: string) => {
      const animation = { updatePlaybackRate: vi.fn() };
      Object.defineProperty(byId(id), 'getAnimations', { value: () => [animation] });
      return animation.updatePlaybackRate;
    };
    const hero = rates('siren-light-hero');
    const road = rates('siren-light-road');

    initScroll();

    // The road van is on alert from the start: 1 s -> 0.6 s a half-cycle is 1 / 0.6 times faster.
    expect(road).toHaveBeenLastCalledWith(1 / 0.6);
    expect(hero).not.toHaveBeenCalled();

    const beat = pins()[0];
    beat.onUpdate({ progress: 0.06 });
    expect(hero).toHaveBeenCalledTimes(1);
    expect(hero).toHaveBeenLastCalledWith(1 / 0.6);

    // Only a change retimes it: scroll frames inside the same state touch nothing.
    beat.onUpdate({ progress: 0.5 });
    beat.onUpdate({ progress: 0.9 });
    expect(hero).toHaveBeenCalledTimes(1);

    beat.onUpdate({ progress: 0 });
    expect(hero).toHaveBeenCalledTimes(2);
    expect(hero).toHaveBeenLastCalledWith(1);
  });

  it('plays the call gags in time at 6, 16, 26 and 54 % of its pin, and takes them back faster', () => {
    fake.media.add(NARROW);
    initScroll();
    const call = pins()[2];

    call.onUpdate({ progress: 0.05 });
    expect(played('digit-1', 'digit-0', 'digit-5', 'bubble')).toEqual([0, 0, 0, 0]);
    call.onUpdate({ progress: 0.07 });
    expect(played('digit-1', 'digit-0', 'digit-5', 'bubble')).toEqual([1, 0, 0, 0]);
    call.onUpdate({ progress: 0.27 });
    expect(played('digit-1', 'digit-0', 'digit-5', 'bubble')).toEqual([1, 1, 1, 0]);
    call.onUpdate({ progress: 0.55 });
    call.onUpdate({ progress: 0.9 });
    expect(played('digit-1', 'digit-0', 'digit-5', 'bubble')).toEqual([1, 1, 1, 1]);

    call.onUpdate({ progress: 0.5 });
    expect(gag('bubble').reverse).toHaveBeenCalledTimes(1);
    expect(gag('bubble').timeScale).toHaveBeenLastCalledWith(1.6);
    expect(gag('digit-5').reverse).not.toHaveBeenCalled();
  });

  it('plays the door gags at 36, 46 and 56 % of its pin', () => {
    fake.media.add(WIDE);
    initScroll();
    const door = pins()[4];

    door.onUpdate({ progress: 0.35 });
    expect(played('heart-l', 'dad-thumb', 'price-badge')).toEqual([0, 0, 0]);
    door.onUpdate({ progress: 0.37 });
    expect(played('heart-l', 'dad-thumb', 'price-badge')).toEqual([1, 0, 0]);
    door.onUpdate({ progress: 0.47 });
    expect(played('heart-l', 'dad-thumb', 'price-badge')).toEqual([1, 1, 0]);
    door.onUpdate({ progress: 0.57 });
    expect(played('heart-l', 'dad-thumb', 'price-badge')).toEqual([1, 1, 1]);
  });

  it('never grows a gag from nothing: pops start at half size or more', () => {
    fake.media.add(WIDE);
    initScroll();

    const from = (id: string) => {
      const call = fake.gsap.fromTo.mock.calls.find((args) => {
        const target = (args as unknown[])[0];
        return (Array.isArray(target) ? target[0] : (target as Element))?.id === id;
      })!;
      return (call as unknown[])[1] as Record<string, number>;
    };
    expect(from('bubble')).toEqual({ scale: 0.6, opacity: 0 });
    expect(from('heart-l')).toEqual({ '--pop': 0.5, '--pop-o': 0 });
    // The key's pivot is set on both ends, or GSAP's smooth-origin leaves it 1-1.5 px off at rest.
    expect(from('digit-1')).toMatchObject({ opacity: 0, scale: 0.88, transformOrigin: '50% 50%' });
    expect(from('price-badge')).toEqual({ y: 16, opacity: 0 });
  });

  it('keeps the header frosted and the call bar up to the very bottom of the page', () => {
    fake.media.add(NARROW);
    initScroll();
    const header = byId('header');
    const sticky = byId('sticky-cta');
    const frost = triggers().find((t) => t.start === 40)!;
    const bar = triggers().find((t) => t.trigger === document.querySelector('#hero [data-cta]'))!;

    // At the very bottom a trigger ending at 'max' has progress 1 and is no longer "active", and a
    // jump from there back to the top changes no active state either: the flags follow every state
    // change (onUpdate), keyed to the scroll position, not to isActive.
    frost.onUpdate(at(13000, 40));
    bar.onUpdate(at(13000, 900));
    expect([header.dataset.scrolled, sticky.dataset.visible]).toEqual(['true', 'true']);

    frost.onUpdate(at(10, 40));
    bar.onUpdate(at(10, 900));
    expect([header.dataset.scrolled, sticky.dataset.visible]).toEqual(['false', 'false']);
  });

  it('shows the header call pill with the call bar, once the hero call has gone, not with the frost', () => {
    fake.media.add(WIDE);
    initScroll();
    const header = byId('header');
    const frost = triggers().find((t) => t.start === 40)!;
    const bar = triggers().find((t) => t.trigger === document.querySelector('#hero [data-cta]'))!;

    // Frosted (past 40 px) but the hero call is still in view: the pill stays away, so there is
    // never a second red button beside the hero's.
    frost.onUpdate(at(300, 40));
    bar.onUpdate(at(300, 900));
    expect([header.dataset.scrolled, header.dataset.ctaVisible]).toEqual(['true', 'false']);

    // The hero call has gone under the header: the pill takes over (and the bar, on phones).
    bar.onUpdate(at(1200, 900));
    expect([header.dataset.scrolled, header.dataset.ctaVisible]).toEqual(['true', 'true']);

    // Back above it, and wherever the page opens (refresh).
    bar.onUpdate(at(10, 900));
    expect(header.dataset.ctaVisible).toBe('false');
    bar.onRefresh(at(9000, 900));
    expect(header.dataset.ctaVisible).toBe('true');
  });

  it('sets the header and the call bar on load, wherever the page opens', () => {
    fake.media.add(NARROW);
    initScroll();
    const frost = triggers().find((t) => t.start === 40)!;
    const bar = triggers().find((t) => t.trigger === document.querySelector('#hero [data-cta]'))!;

    frost.onRefresh(at(9000, 40));
    bar.onRefresh(at(9000, 900));

    expect(byId('header').dataset.scrolled).toBe('true');
    expect(byId('sticky-cta').dataset.visible).toBe('true');
  });

  it('shows the call bar once the hero call button has gone under the header, not before', () => {
    fake.media.add(NARROW);
    initScroll();

    const bar = triggers().find((t) => t.trigger === document.querySelector('#hero [data-cta]'))!;

    expect(bar.pinnedContainer).toBe(byId('hero'));
    expect((bar.start as () => string)()).toMatch(/^bottom top\+=\d+$/);
  });

  it('smooths mouse and trackpad scrolling with Lenis, on the GSAP ticker, and only once', () => {
    fake.media.add(WIDE).add(FINE);

    initScroll();

    // Lenis already eases the wheel: the scenes follow the smoothed scroll directly.
    expect(pins().map((st) => st.scrub)).toEqual([true, true, true, true, true]);
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

describe('the call under the steps', () => {
  /** An IntersectionObserver that records what it watches and lets a test report what it sees. */
  const watchers: Array<{ target: Element; see: (onScreen: boolean) => void }> = [];

  beforeEach(() => {
    watchers.length = 0;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private callback: IntersectionObserverCallback) {}
        observe(target: Element) {
          watchers.push({
            target,
            see: (onScreen) =>
              this.callback(
                [{ isIntersecting: onScreen, target } as IntersectionObserverEntry],
                this as unknown as IntersectionObserver,
              ),
          });
        }
        disconnect() {}
      },
    );
  });

  const flags = () => [byId('header').dataset.inlineCta, byId('sticky-cta').dataset.inlineCta];

  it.each([
    ['with the pinned story', [NARROW]],
    ['as still frames', [NARROW, REDUCE]],
  ])(
    'steps the phone bar and the header pill aside while it is on screen, %s',
    (_name, queries) => {
      for (const query of queries) fake.media.add(query);

      initScroll();

      expect(watchers.map((w) => w.target)).toEqual([document.querySelector('#how [data-cta]')]);
      expect(watchers[0].target.matches('.how__cta')).toBe(true);

      watchers[0].see(true);
      expect(flags()).toEqual(['true', 'true']);

      watchers[0].see(false);
      expect(flags()).toEqual(['false', 'false']);
    },
  );

  it('finds the call even after the state engine swapped its link for an inert pill', () => {
    const how = document.querySelector('#how [data-cta]')!;
    const pill = document.createElement('span');
    pill.className = how.className;
    pill.setAttribute('data-cta', '');
    how.replaceWith(pill);
    fake.media.add(NARROW);

    initScroll();

    expect(watchers.map((w) => w.target)).toEqual([pill]);
  });

  it('leaves the bar alone where the browser cannot observe', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    fake.media.add(NARROW);

    expect(() => initScroll()).not.toThrow();
    expect(flags()).toEqual([undefined, undefined]);
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

    // Frosted, hero call still in view: neither the bar nor the header pill.
    expect(header.dataset.ctaVisible).toBe('false');

    ctaBottom = -1;
    setScrollY(600);
    expect(sticky.dataset.visible).toBe('true');
    expect(header.dataset.ctaVisible).toBe('true');

    ctaBottom = 12;
    setScrollY(500);
    expect(sticky.dataset.visible).toBe('false');
    expect(header.dataset.ctaVisible).toBe('false');

    // The call is gone once it sits under the header, as in the pinned story, not only off screen.
    Object.defineProperty(header, 'offsetHeight', { value: 64, configurable: true });
    ctaBottom = 64;
    setScrollY(520);
    expect([sticky.dataset.visible, header.dataset.ctaVisible]).toEqual(['true', 'true']);
    ctaBottom = 65;
    setScrollY(510);
    expect([sticky.dataset.visible, header.dataset.ctaVisible]).toEqual(['false', 'false']);

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

  describe("with the copy's bands: the header's edge never cuts through a line", () => {
    // The call scene at 375x667 (782 px tall), as measured in Chrome: eyebrow chip and its text,
    // two title lines, three body lines. Without bands its shift is 187, which puts the header's
    // lower edge (187 + 64 = 251) through the middle of the last body line.
    const call = { ...phone, viewport: 667, height: 782 };
    const bands = [
      { top: 80, bottom: 109 }, // eyebrow chip
      { top: 84, bottom: 105 }, // its text
      { top: 124.2, bottom: 159.8 }, // title
      { top: 159.8, bottom: 195.3 },
      { top: 211.3, bottom: 236.9 }, // body
      { top: 236.9, bottom: 262.5 },
      { top: 262.5, bottom: 288 },
    ];

    it('moves to the nearer edge of the line it would cut', () => {
      expect(pinShift(call)).toBe(187);
      // The line's bottom (262.5) is 11.5 px below the edge: hide the line under the header.
      expect(pinShift({ ...call, bands })).toBe(262.5 - 64);
      // Its top (236.9) is 6.1 px above an edge at 243: show the line instead.
      expect(pinShift({ ...call, viewport: 667 + 8, bands })).toBeCloseTo(236.9 - 64, 5);
    });

    it('leaves a shift alone when its edge falls between two lines, or there are no bands', () => {
      const between = { ...call, viewport: 782 + 72 - (236.9 - 64) }; // edge exactly at 236.9
      expect(pinShift({ ...between, bands })).toBeCloseTo(236.9 - 64, 5);
      expect(pinShift({ ...call, bands: [] })).toBe(187);
    });

    it('treats a chip and the text inside it as one', () => {
      // Edge at 96, inside the chip (80-109) and its text (84-105): hide (109) is 13 px away,
      // show (80) 16 px.
      const hero = { ...phone, viewport: 800, height: 832, reserved: 0, titleTop: 300 };
      expect(pinShift({ ...hero, bands }, 'title')).toBe(109 - 64);
    });

    it('never pins below the top of the scene', () => {
      // A scene that fits, whose header edge (64) is 4 px under the top of a band: showing that
      // band would take the scene below the top of the screen.
      const fits = { ...phone, height: 700, reserved: 0, viewport: 844 };
      expect(pinShift({ ...fits, bands: [{ top: 60, bottom: 200 }] })).toBe(0);
    });

    it('keeps the hero rise short of its title, above every band of it', () => {
      const hero = { ...phone, viewport: 667, height: 828, reserved: 0 };
      expect(pinShift({ ...hero, bands }, 'title')).toBe(53);
    });
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

describe('beat', () => {
  it('plays once when the pin passes its point, and reverses 1.6x faster below it', () => {
    const tween = { play: vi.fn(), reverse: vi.fn(), timeScale: vi.fn() };
    tween.play.mockReturnValue(tween);
    tween.reverse.mockReturnValue(tween);
    tween.timeScale.mockReturnValue(tween);
    const run = beat(tween as unknown as Parameters<typeof beat>[0], 0.5);

    run(0.2);
    run(0.4);
    expect(tween.play).not.toHaveBeenCalled();

    run(0.5);
    run(0.8);
    expect(tween.play).toHaveBeenCalledTimes(1);
    expect(tween.timeScale).toHaveBeenLastCalledWith(1);

    run(0.3);
    run(0.1);
    expect(tween.reverse).toHaveBeenCalledTimes(1);
    expect(tween.timeScale).toHaveBeenLastCalledWith(1.6);
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
    // The blink is a faster playback rate (timeline.ts), not a new duration: a duration switch on
    // a running animation makes the light jump.
    expect(vanCss).not.toMatch(/animation-duration/);
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

  it('pops the hearts on custom properties, resting full size and opaque', () => {
    for (const heart of ['#heart-l', '#heart-r']) {
      expect(body(scenesCss, heart)).toMatch(/transform:\s*scale\(var\(--pop,\s*1\)\)/);
      expect(body(scenesCss, heart)).toMatch(/opacity:\s*var\(--pop-o,\s*1\)/);
    }
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

  it('fits the kitchen on phones, so its title stays in view while Dad slides away', () => {
    const phones = scenesCss.slice(scenesCss.indexOf('#scene-kitchen .body'));
    // The paragraph stays for screen readers (display: none would drop it): clipped to a pixel.
    expect(scenesCss).toMatch(
      /@media \(max-width: 899\.98px\)\s*\{\s*#scene-kitchen \.body\s*\{[^}]*position:\s*absolute/,
    );
    expect(body(scenesCss, '#scene-kitchen .body')).not.toMatch(/display:\s*none/);
    expect(body(scenesCss, '#scene-kitchen .body')).toMatch(/clip-path:\s*inset\(50%\)/);
    expect(phones).toMatch(/#scene-kitchen \.card\s*\{[^}]*padding:\s*var\(--s2\)/);
  });

  it('chains the scene backgrounds, so each hand-off is one continuous sheet', () => {
    expect(body(scenesCss, "[data-scene='kitchen']")).toMatch(
      /linear-gradient\(180deg,\s*var\(--sky-dawn-bottom\)[^,]*,\s*var\(--cream\)\)/,
    );
    expect(body(scenesCss, "[data-scene='road']")).toMatch(
      /linear-gradient\(\s*180deg,\s*var\(--cream\),\s*var\(--road-sky-top\)/,
    );
    expect(body(scenesCss, "[data-scene='door']")).toMatch(
      /linear-gradient\(180deg,\s*var\(--sky-day-bottom\)[^,]*,\s*var\(--cream\)\)/,
    );
  });

  it('gives the story art 7/12 of the desktop container (the copy 5/12)', () => {
    expect(scenesCss).toMatch(
      /\[data-scene\]:not\(\[data-scene='hero'\]\)\s*\{\s*grid-template-columns:[^}]*5 \/ 12[^}]*7 \/ 12/,
    );
  });

  it('shows the header call pill only once the hero call has gone, and not beside the one under the steps', () => {
    const layoutCss = strip(read('src/styles/layout.css'));
    // Hidden unless the hero call has scrolled away, whether or not the header is frosted ...
    expect(layoutCss).toMatch(
      /\.header:not\(\[data-cta-visible='true'\]\) \.cta--compact,\s*\.header\[data-inline-cta='true'\] \.cta--compact\s*\{[^}]*visibility:\s*hidden/,
    );
    expect(layoutCss).not.toMatch(/data-scrolled='false'\] \.cta--compact/);
    expect(body(layoutCss, '.cta--compact')).toMatch(/display:\s*none/);
    // ... and the phone bar steps aside for the call under the steps.
    expect(layoutCss).toMatch(
      /\.sticky-cta\[data-visible='false'\],\s*\.sticky-cta\[data-inline-cta='true'\]\s*\{[^}]*visibility:\s*hidden/,
    );
  });

  it('clips the pinned scenes with clip-path, not overflow, which Chrome counts as a layout shift', () => {
    const layoutCss = strip(read('src/styles/layout.css'));
    // Pinning an overflow-clipped section reports a shift of ~1.0 each time (CLS of 5-8 over a
    // scroll-through); clip-path paints the same and is not counted. <main> keeps any spill from widening the page.
    const scene = body(layoutCss, '.scene');
    expect(scene).toMatch(/clip-path:\s*inset\(0\)/);
    expect(scene).not.toMatch(/overflow/);
    expect(body(layoutCss, 'main')).toMatch(/overflow-x:\s*clip/);
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
