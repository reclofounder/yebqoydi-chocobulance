import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { VAN, wheelRotation } from '../van/van';
import { HEADER_OFFSET, REDUCED_MOTION, initReduced, setFlag } from './reduced';
import { initSmoothScroll } from './smooth';

gsap.registerPlugin(ScrollTrigger);

/*
 * The story, scene by scene. Each scene is pinned while one scrubbed timeline plays over its pin;
 * positions in a timeline are fractions of that pin (0 = pinned, 1 = released). Scrubbed motion is
 * linear with the scroll; only the pops and reveals have an ease. Everything animates transform or
 * opacity, plus a few custom properties that CSS turns into transforms (wheels, door, hearts) and
 * the road's two sky stops. SVG parts with a `fill-box` pivot are turned through those custom
 * properties, never GSAP's SVG transforms, which assume a view-box origin.
 */

/* ---------- Tuning: the numbers the story's feel depends on ---------- */

/** The layout's breakpoint (layout.css, scenes.css): phones and tablets below, desktop from it. */
export const NARROW = '(max-width: 899.98px)';
export const WIDE = '(min-width: 900px)';

/** How long each scene stays pinned, in % of the screen height, on desktop. */
const DISTANCE = { hero: 150, kitchen: 200, call: 150, road: 300, door: 150 } as const;
/** Phones and tablets: shorter screens and thumb scrolling, so every pin is shorter. */
const NARROW_SCALE = 0.75;
/** Seconds the playhead takes to catch up with the scroll: smooths a flick without lagging. */
const SCRUB = 0.8;

/** Road: the van's left edge travels from 20 % before the card to 110 % (gone off its right). */
const VAN_FROM = -0.2;
const VAN_TO = 1.1;
/**
 * Road layers' travel in stage widths: the further, the slower. The sky stays put. Each layer is
 * two stage widths wide, so -1 is the most any of them can travel before its edge shows.
 */
const PARALLAX = { far: -0.15, mid: -0.4, near: -0.9 } as const;

/** How the current screen pins its scenes. */
interface Pace {
  /** Multiplier on DISTANCE: 1 on desktop, NARROW_SCALE below the breakpoint. */
  scale: number;
  /**
   * Native scrolling runs off the main thread and reaches a pin a frame before the pin does, so
   * there ScrollTrigger pins slightly early (1). Under Lenis the scroll and the pins move in the
   * same frame, and anticipating misfires on a long jump (an anchor link, End): 0.
   */
  anticipatePin: number;
}

/** Pins: px kept between a scene's title and the header above it. */
const TITLE_GAP = 8;
/** Pins: px of stage the sticky bar may cover so that a scene's title can stay in view. */
const STAGE_SLACK = 24;

/* ---------- Pin geometry ---------- */

export interface PinMetrics {
  /** The scene's height. */
  height: number;
  /** Its title's top, from the scene's top. */
  titleTop: number;
  /** The screen's height. */
  viewport: number;
  /** The fixed header's height (it overlays the top of the screen). */
  header: number;
  /** The fixed sticky bar's height when it is shown under this scene, else 0. */
  reserved: number;
}

/**
 * How far above the top of the screen a scene sits while it is pinned, in px. A scene that fits
 * pins at its top. Otherwise:
 * - `stage` first (the story scenes): it rises until its stage clears the sticky bar, since the
 *   animation plays there. If that would cost the stage only a sliver, the title keeps its place
 *   under the header instead. In a scene far taller than the screen (short phones, the kitchen
 *   with its card), the stage wins; its copy was read as it scrolled in.
 * - `title` first (the hero: headline and call button): it rises only as far as its title allows.
 */
export function pinShift(
  { height, titleTop, viewport, header, reserved }: PinMetrics,
  first: 'stage' | 'title' = 'stage',
): number {
  const needed = Math.max(0, height + reserved - viewport);
  const titleRoom = Math.max(0, titleTop - header - TITLE_GAP);
  const keepTitle = first === 'title' || needed - titleRoom <= STAGE_SLACK;
  return keepTitle ? Math.min(needed, titleRoom) : needed;
}

/** Reads a scene's pin metrics. Called by ScrollTrigger on each refresh, never per frame. */
function measure(section: HTMLElement, underStickyBar: boolean): PinMetrics {
  const title = section.querySelector('h1, h2');
  const sticky = document.getElementById('sticky-cta');
  const barShown = underStickyBar && sticky !== null && getComputedStyle(sticky).display !== 'none';
  return {
    height: section.offsetHeight,
    titleTop: title ? title.getBoundingClientRect().top - section.getBoundingClientRect().top : 0,
    viewport: window.innerHeight,
    header: document.getElementById('header')?.offsetHeight ?? 0,
    reserved: barShown ? sticky.offsetHeight : 0,
  };
}

/* ---------- Road geometry ---------- */

/**
 * Degrees each road wheel turns over the whole drive. A wheel rolls over the road, so the distance
 * is the van's own travel plus the near layer (the road) sliding back under it, and the wheels are
 * drawn at the van's rendered scale (`VAN.wheelRadius` is in the drawing's units).
 */
export function wheelTurn(stageWidth: number, vanWidth: number): number {
  const rolled = (VAN_TO - VAN_FROM - PARALLAX.near) * stageWidth;
  return wheelRotation(rolled, VAN.wheelRadius * (vanWidth / VAN.width));
}

/* ---------- Scenes ---------- */

/**
 * A scene pinned for `distance` (at this pace) with one scrubbed timeline over the pin. The hero
 * pins before the sticky bar shows and keeps its headline in view; the story scenes keep their
 * stage in view, above the bar.
 */
function pinScene(
  section: HTMLElement,
  distance: number,
  pace: Pace,
  role: 'hero' | 'scene',
): gsap.core.Timeline {
  const shift = () =>
    role === 'hero'
      ? pinShift(measure(section, false), 'title')
      : pinShift(measure(section, true), 'stage');
  return gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      pin: true,
      scrub: SCRUB,
      anticipatePin: pace.anticipatePin,
      start: () => `top top-=${shift()}`,
      end: `+=${distance * pace.scale}%`,
      invalidateOnRefresh: true,
    },
  });
}

/** Ends a scene's timeline at exactly 1, so its positions are fractions of the pin. */
function hold(tl: gsap.core.Timeline): gsap.core.Timeline {
  return tl.set({}, {}, 1);
}

function pinHero(pace: Pace): gsap.core.Timeline | undefined {
  const hero = document.getElementById('hero');
  if (!hero) return undefined;
  const tl = pinScene(hero, DISTANCE.hero, pace, 'hero');
  // The hint has done its job as soon as the visitor scrolls.
  tl.to(hero.querySelector('.hero__scroll'), { opacity: 0, duration: 0.15 }, 0);
  // The numeral drifts up a touch against the parked van: depth, not a show.
  tl.to(hero.querySelector('.hero__numeral'), { y: -24, duration: 1 }, 0);
  return hold(tl);
}

function pinKitchen(pace: Pace): void {
  const scene = document.getElementById('scene-kitchen');
  if (!scene) return;
  const tl = pinScene(scene, DISTANCE.kitchen, pace, 'scene');
  const dad = scene.querySelector('#dad-peek');
  // Caught: Dad sidles off behind the door casing over the first 60 % (140 drawing units; the
  // casing covers him about half way) and fades, so no sliver of him lingers at its edge. The
  // empty tub then holds the frame.
  tl.to(dad, { x: 140, duration: 0.6 }, 0);
  tl.to(dad, { opacity: 0, duration: 0.25 }, 0.35);
  hold(tl);
}

function pinCall(pace: Pace): void {
  const scene = document.getElementById('scene-call');
  if (!scene) return;
  const tl = pinScene(scene, DISTANCE.call, pace, 'scene');
  // 1, 0, 5: a key lights at 20, 40 and 60 % (they are drawn lit; hidden until then)...
  ['#digit-1', '#digit-0', '#digit-5'].forEach((id, i) => {
    tl.fromTo(
      scene.querySelector(id),
      { opacity: 0 },
      { opacity: 1, duration: 0.05, ease: 'power2.out' },
      0.2 + 0.2 * i,
    );
  });
  // ...the call runs down the line to the dispatcher by 80 %. Only the offset moves (the dasharray
  // carries the dashes), in path units (pathLength="1"), so no rounding to whole pixels...
  tl.fromTo(
    scene.querySelector('#call-line'),
    { strokeDashoffset: 1 },
    { strokeDashoffset: 0, duration: 0.15, autoRound: false },
    0.65,
  );
  // ...and she answers, the bubble popping from its tail.
  tl.fromTo(
    scene.querySelector('#bubble'),
    { scale: 0 },
    { scale: 1, duration: 0.1, ease: 'back.out(1.4)' },
    0.85,
  );
  hold(tl);
}

function pinRoad(pace: Pace): void {
  const scene = document.getElementById('scene-road');
  const stage = scene?.querySelector<HTMLElement>('.scene__stage');
  const van = scene?.querySelector('[data-van="road"]');
  if (!scene || !stage || !van) return;
  const tl = pinScene(scene, DISTANCE.road, pace, 'scene');
  // Sizes are read when ScrollTrigger refreshes (function values + invalidateOnRefresh).
  const width = () => stage.offsetWidth;

  // The whole drive is linear over the whole pin, so the wheels can be one tween too: their angle
  // stays exactly proportional to the road rolled under them.
  tl.fromTo(van, { x: () => VAN_FROM * width() }, { x: () => VAN_TO * width(), duration: 1 }, 0);
  tl.fromTo(
    van,
    { '--wheel-rot': '0deg' },
    {
      '--wheel-rot': () => `${wheelTurn(width(), van.getBoundingClientRect().width)}deg`,
      duration: 1,
    },
    0,
  );
  // The city slides by, slower the further away it is (xPercent: of the layer's own width).
  for (const [layer, travel] of Object.entries(PARALLAX)) {
    tl.fromTo(
      scene.querySelector(`.layer-${layer}`),
      { xPercent: 0 },
      { xPercent: travel * 50, duration: 1 },
      0,
    );
  }
  // The morning brightens from dawn to day: the section's gradient and road-sky.svg both paint
  // with these two stops. A straight orange-to-blue blend turns grey halfway, so the sky passes
  // through sunrise at 40 %: pale overhead, still warm at the horizon.
  const token = (name: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const sky = (top: string, bottom: string) => ({
    '--road-sky-top': token(top),
    '--road-sky-bottom': token(bottom),
  });
  tl.fromTo(
    scene,
    sky('--sky-dawn-top', '--sky-dawn-bottom'),
    { ...sky('--cream', '--sky-dawn-bottom'), duration: 0.4 },
    0,
  );
  tl.to(scene, { ...sky('--sky-day-top', '--sky-day-bottom'), duration: 0.6 }, 0.4);
  hold(tl);
}

function pinDoor(pace: Pace): void {
  const scene = document.getElementById('scene-door');
  if (!scene) return;
  const tl = pinScene(scene, DISTANCE.door, pace, 'scene');
  // The door (drawn closed) swings open on its hinge over the first 40 %: the medic stands there
  // with a full tub...
  tl.fromTo(
    scene.querySelector('#door-leaf'),
    { '--door-open': '0deg' },
    { '--door-open': '-100deg', duration: 0.4 },
    0,
  );
  // ...at 60 % the kid's eyes turn into hearts...
  tl.fromTo(
    [scene.querySelector('#heart-l'), scene.querySelector('#heart-r')],
    { '--pop': 0 },
    { '--pop': 1, duration: 0.1, ease: 'back.out(1.4)' },
    0.6,
  );
  // ...at 75 % Dad gives a thumbs-up from the next room...
  tl.fromTo(
    scene.querySelector('#dad-thumb'),
    { opacity: 0 },
    { opacity: 1, duration: 0.08, ease: 'power2.out' },
    0.75,
  );
  // ...and at 85 % the price tag settles onto the wall (GSAP folds its CSS rotate tilt into the
  // transform it animates, so the tilt stays).
  tl.fromTo(
    scene.querySelector('#price-badge'),
    { y: 24, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.1, ease: 'power2.out' },
    0.85,
  );
  hold(tl);
}

/** The header frosts past 40 px; the sticky call bar shows once the hero's pin is over. */
function headerAndSticky(hero: gsap.core.Timeline | undefined): void {
  const header = document.getElementById('header');
  const sticky = document.getElementById('sticky-cta');
  ScrollTrigger.create({
    start: HEADER_OFFSET,
    end: 'max',
    onToggle: (self) => setFlag(header, 'scrolled', self.isActive),
  });
  // Created after the hero, so on each refresh it reads the hero's fresh end.
  ScrollTrigger.create({
    start: () => hero?.scrollTrigger?.end ?? 0,
    end: 'max',
    onToggle: (self) => setFlag(sticky, 'visible', self.isActive),
  });
}

/**
 * Builds the pinned story for the current screen and rebuilds it when the screen crosses the
 * breakpoint. If reduced motion is switched on mid-visit, GSAP undoes all of it (pins, inline
 * styles) and the still frames take over; switched off, the story comes back.
 */
export function initTimeline(): void {
  gsap.matchMedia().add({ narrow: NARROW, wide: WIDE, reduce: REDUCED_MOTION }, (context) => {
    const { narrow = false, reduce = false } = context.conditions ?? {};
    if (reduce) return initReduced();

    const stopSmoothScroll = initSmoothScroll();
    const pace: Pace = {
      scale: narrow ? NARROW_SCALE : 1,
      anticipatePin: stopSmoothScroll ? 0 : 1,
    };
    const sirens = ['siren-light-hero', 'siren-light-road']
      .map((id) => document.getElementById(id))
      .filter((el) => el !== null);
    for (const siren of sirens) siren.classList.add('siren--on');

    const hero = pinHero(pace);
    pinKitchen(pace);
    pinCall(pace);
    pinRoad(pace);
    pinDoor(pace);
    headerAndSticky(hero);

    return () => {
      for (const siren of sirens) siren.classList.remove('siren--on');
      stopSmoothScroll?.();
    };
  });
}
