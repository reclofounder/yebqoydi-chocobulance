import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { VAN, wheelRotation } from '../van/van';
import { HEADER_OFFSET, REDUCED_MOTION, initReduced, setFlag } from './reduced';
import { initSmoothScroll } from './smooth';

gsap.registerPlugin(ScrollTrigger);

/*
 * The story, scene by scene. Each scene is pinned while one scrubbed timeline plays over its pin;
 * positions in a timeline are fractions of that pin (0 = pinned, 1 = released). Continuous motion
 * (the van, the city, the sky, the door's swing, Dad's slide) is scrubbed, linear with the scroll.
 * The gags (keys lighting, the bubble, the hearts, the thumbs-up, the price tag) are state
 * changes: they play in time once the pin passes their beat, and run back faster above it.
 * Everything animates transform or opacity, plus custom properties that CSS turns into transforms
 * (wheels, door, hearts) and the road's two sky stops. SVG parts with a `fill-box` pivot are turned
 * through those custom properties, never GSAP's SVG transforms, which assume a view-box origin.
 */

/* ---------- Tuning: the numbers the story's feel depends on ---------- */

/** The layout's breakpoint (layout.css, scenes.css): phones and tablets below, desktop from it. */
export const NARROW = '(max-width: 899.98px)';
export const WIDE = '(min-width: 900px)';

/** How long each scene stays pinned, in % of the screen height, on desktop. */
const DISTANCE = { hero: 60, kitchen: 120, call: 150, road: 300, door: 150 } as const;
/** Phones and tablets: shorter screens and thumb scrolling, so every pin is shorter. */
const NARROW_SCALE = 0.75;
/**
 * Seconds the scrubbed playhead takes to catch up with native (touch) scrolling. Under Lenis the
 * scroll is already eased, so the scenes follow it directly (`scrub: true`): smoothed once.
 */
const SCRUB_TOUCH = 0.4;
/** Gags run back this much faster than they played: the page answers the way back briskly. */
const REVERSE_SPEED = 1.6;

/** Hero: the first few px of its pin switch the parked van's siren to the road blink. */
const HERO_ALERT_AT = 0.05;
/** The blink's rate: van.css breathes a half-cycle in 1 s, the road blink takes 0.6 s. */
const ALERT_RATE = 1 / 0.6;
/** Kitchen: Dad sidles off over the first 75 % of the pin (fading over its second half). */
const DAD_EXIT = 0.75;
/** Call: the keys 1, 0, 5 light at these beats; the line runs 0.32-0.48; she answers at 0.54. */
const DIGITS_AT = [0.06, 0.16, 0.26] as const;
const LINE = { from: 0.32, to: 0.48 } as const;
const BUBBLE_AT = 0.54;
/** Door: it swings open over 0-0.30; hearts, thumbs-up and price tag follow; the rest holds. */
const DOOR_OPEN = 0.3;
const HEARTS_AT = 0.36;
const THUMB_AT = 0.46;
const BADGE_AT = 0.56;

/** Road: the van's left edge travels from 20 % before the card to 110 % (gone off its right). */
const VAN_FROM = -0.2;
const VAN_TO = 1.1;
/**
 * Road layers' travel in stage widths: the further, the slower. The sky stays put. Each layer is
 * two stage widths wide, so -1 is the most any of them can travel before its edge shows.
 */
const PARALLAX = { far: -0.15, mid: -0.4, near: -0.9 } as const;
/**
 * Road sky stops (token names) along the drive. A straight orange-to-blue blend goes grey halfway,
 * so the top turns blue early through two pale but coloured stops, while the bottom stays warm
 * until the second half: mid-drive reads as a clear morning, blue above and warm at the horizon.
 */
const SKY_TOP: ReadonlyArray<readonly [number, string]> = [
  [0, '--sky-dawn-top'],
  [0.25, '--sky-sunrise-top'],
  [0.45, '--sky-morning-top'],
  [1, '--sky-day-top'],
];
const SKY_BOTTOM: ReadonlyArray<readonly [number, string]> = [
  [0.55, '--sky-dawn-bottom'],
  [1, '--sky-day-bottom'],
];

/** How the current screen pins its scenes. */
interface Pace {
  /** Multiplier on DISTANCE: 1 on desktop, NARROW_SCALE below the breakpoint. */
  scale: number;
  /** `true` under Lenis (already eased), SCRUB_TOUCH for native scrolling. */
  scrub: number | true;
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

/** A band of a scene's copy (a line of text, the eyebrow chip, a card), in px from the scene's top. */
export interface Band {
  top: number;
  bottom: number;
}

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
  /** The copy's bands, so the header's edge can be kept off the middle of a line (see pinShift). */
  bands?: readonly Band[];
}

/** px: an edge this close to a band's own edge cuts nothing worth moving for. */
const EDGE_TOLERANCE = 0.5;

/**
 * The header covers the top `header` px of the screen, so while a scene is pinned `shift` px up
 * its copy is cut at `shift + header` from the scene's top. A line half under the frosted bar
 * looks unfinished, so when that edge would cross bands of the copy it moves to the nearer edge of
 * them: the crossed lines go wholly under the header, or come wholly out from under it. Costs
 * under half a line (about 13 px of body): a sliver of stage under the sticky bar, or of cream
 * above it.
 */
function clearOfBands(shift: number, header: number, bands: readonly Band[]): number {
  const edge = shift + header;
  const crossed = bands.filter(
    (b) => b.top < edge - EDGE_TOLERANCE && b.bottom > edge + EDGE_TOLERANCE,
  );
  if (crossed.length === 0) return shift;
  const hide = Math.max(...crossed.map((b) => b.bottom));
  const show = Math.min(...crossed.map((b) => b.top));
  return Math.max(0, (hide - edge < edge - show ? hide : show) - header);
}

/**
 * How far above the top of the screen a scene sits while it is pinned, in px. A scene that fits
 * pins at its top. Otherwise:
 * - `stage` first (call, road, door): it rises until its stage clears the sticky bar, since the
 *   animation plays there. If that would cost the stage only a sliver, the title keeps its place
 *   under the header instead. In a scene far taller than the screen (short phones), the stage
 *   wins; its copy was read as it scrolled in.
 * - `title` first (the hero, and the kitchen, whose joke needs its line): it rises only as far as
 *   its title allows.
 * Either way the rise then settles where the header's edge falls between two lines of the copy.
 */
export function pinShift(
  { height, titleTop, viewport, header, reserved, bands = [] }: PinMetrics,
  first: 'stage' | 'title' = 'stage',
): number {
  const needed = Math.max(0, height + reserved - viewport);
  const titleRoom = Math.max(0, titleTop - header - TITLE_GAP);
  const keepTitle = first === 'title' || needed - titleRoom <= STAGE_SLACK;
  return clearOfBands(keepTitle ? Math.min(needed, titleRoom) : needed, header, bands);
}

/**
 * The bands of a scene's copy: each line of text (a line-height tall, so one line's band ends
 * where the next begins), and the boxes the text sits in (the eyebrow chip, the kitchen card).
 */
function copyBands(section: HTMLElement): Band[] {
  const copy = section.querySelector('.scene__copy');
  if (!copy) return [];
  const origin = section.getBoundingClientRect().top;
  const bands: Band[] = [];
  const add = (top: number, bottom: number) => {
    if (bottom > top) bands.push({ top: top - origin, bottom: bottom - origin });
  };

  const range = document.createRange();
  const text = document.createTreeWalker(copy, NodeFilter.SHOW_TEXT);
  for (let node = text.nextNode(); node; node = text.nextNode()) {
    if (!node.textContent?.trim() || !node.parentElement) continue;
    const lineHeight = parseFloat(getComputedStyle(node.parentElement).lineHeight);
    range.selectNodeContents(node);
    for (const line of range.getClientRects()) {
      const height = Number.isFinite(lineHeight) ? lineHeight : line.height;
      const middle = (line.top + line.bottom) / 2;
      add(middle - height / 2, middle + height / 2);
    }
  }
  for (const box of copy.querySelectorAll('.eyebrow, .card')) {
    const { top, bottom } = box.getBoundingClientRect();
    add(top, bottom);
  }
  return bands;
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
    header: headerHeight(),
    reserved: barShown ? sticky.offsetHeight : 0,
    bands: copyBands(section),
  };
}

function headerHeight(): number {
  return document.getElementById('header')?.offsetHeight ?? 0;
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

/* ---------- Beats ---------- */

/** Reacts to the scroll position within a pin (0..1). */
type Beat = (progress: number) => void;

/**
 * A gag played in time: `tween` (paused) plays once the pin passes `at`, and runs back
 * REVERSE_SPEED times faster when the visitor scrolls back above it. Interruptible both ways.
 */
export function beat(tween: gsap.core.Tween, at: number): Beat {
  let on = false;
  return (progress) => {
    if (progress >= at === on) return;
    on = !on;
    if (on) tween.timeScale(1).play();
    else tween.timeScale(REVERSE_SPEED).reverse();
  };
}

/** A paused tween for a gag; `fromTo` renders its hidden start state at once. */
function gagTween(
  target: gsap.TweenTarget,
  from: gsap.TweenVars,
  to: gsap.TweenVars,
): gsap.core.Tween {
  return gsap.fromTo(target, from, { ...to, paused: true });
}

/* ---------- Scenes ---------- */

/**
 * Switches a siren between its parked breath and the road blink. Changing `animation-duration` on
 * the running CSS animation would put the light in another phase (a jump), so the switch is the
 * animation's playback rate, which keeps its place. The class only records the state (van.css
 * does not style it), so a scroll frame inside the same state touches nothing.
 */
function setAlert(siren: Element | null, on: boolean): void {
  if (!siren || siren.classList.contains('siren--alert') === on) return;
  siren.classList.toggle('siren--alert', on);
  for (const animation of siren.getAnimations?.() ?? []) {
    animation.updatePlaybackRate(on ? ALERT_RATE : 1);
  }
}

interface PinOptions {
  /** What must stay in view while pinned (see pinShift). */
  first: 'title' | 'stage';
  /** Whether the sticky bar is up under this scene (all but the hero). */
  underStickyBar: boolean;
  /** Gags and switches keyed to the pin's scroll position. */
  beats?: readonly Beat[];
}

/** A scene pinned for `distance` (at this pace) with one scrubbed timeline over the pin. */
function pinScene(
  section: HTMLElement,
  distance: number,
  pace: Pace,
  { first, underStickyBar, beats = [] }: PinOptions,
): gsap.core.Timeline {
  const run = (progress: number) => {
    for (const b of beats) b(progress);
  };
  return gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      pin: true,
      scrub: pace.scrub,
      anticipatePin: pace.anticipatePin,
      start: () => `top top-=${pinShift(measure(section, underStickyBar), first)}`,
      end: `+=${distance * pace.scale}%`,
      invalidateOnRefresh: true,
      onUpdate: (self) => run(self.progress),
      // A page opened (or re-measured) part-way down: settle the gags where the scroll is.
      onRefresh: (self) =>
        run(gsap.utils.clamp(0, 1, (self.scroll() - self.start) / (self.end - self.start || 1))),
    },
  });
}

/** Ends a scene's timeline at exactly 1, so its positions are fractions of the pin. */
function hold(tl: gsap.core.Timeline): gsap.core.Timeline {
  return tl.set({}, {}, 1);
}

function pinHero(pace: Pace): void {
  const hero = document.getElementById('hero');
  if (!hero) return;
  const siren = document.getElementById('siren-light-hero');
  // Its one beat: as soon as the visitor scrolls, the parked van's siren switches from a slow
  // breath to the road's blink. The numeral drifts and the hint fades as before.
  const alert: Beat = (progress) => setAlert(siren, progress >= HERO_ALERT_AT);
  const tl = pinScene(hero, DISTANCE.hero, pace, {
    first: 'title',
    underStickyBar: false,
    beats: [alert],
  });
  tl.to(hero.querySelector('.hero__scroll'), { opacity: 0, duration: 0.15 }, 0);
  tl.to(hero.querySelector('.hero__numeral'), { y: -24, duration: 1 }, 0);
  hold(tl);
}

function pinKitchen(pace: Pace): void {
  const scene = document.getElementById('scene-kitchen');
  if (!scene) return;
  // Title first: the joke ("Dad ate it") must be on screen while Dad slinks off.
  const tl = pinScene(scene, DISTANCE.kitchen, pace, { first: 'title', underStickyBar: true });
  const dad = scene.querySelector('#dad-peek');
  // Caught: Dad sidles off behind the door casing (140 drawing units; the casing covers him about
  // half way) and fades over the second half, so no sliver of him lingers. Then the tub holds.
  tl.to(dad, { x: 140, duration: DAD_EXIT }, 0);
  tl.to(dad, { opacity: 0, duration: DAD_EXIT * 0.4 }, DAD_EXIT * 0.6);
  hold(tl);
}

function pinCall(pace: Pace): void {
  const scene = document.getElementById('scene-call');
  if (!scene) return;
  // The keys are drawn lit; each lights again like a press: a quick fade from slightly small.
  const keys = ['#digit-1', '#digit-0', '#digit-5'].map((id, i) =>
    beat(
      gagTween(
        scene.querySelector(id),
        // The pivot on both ends: GSAP's smooth-origin otherwise blends from the SVG's own (0 0)
        // and leaves the key a pixel or so off where it rests.
        { opacity: 0, scale: 0.88, transformOrigin: '50% 50%' },
        { opacity: 1, scale: 1, transformOrigin: '50% 50%', duration: 0.12, ease: 'power2.out' },
      ),
      DIGITS_AT[i],
    ),
  );
  // She answers: the bubble pops from its tail (CSS transform-origin), from 60 %, never from 0.
  const answer = beat(
    gagTween(
      scene.querySelector('#bubble'),
      { scale: 0.6, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.32, ease: 'back.out(1.6)' },
    ),
    BUBBLE_AT,
  );
  const tl = pinScene(scene, DISTANCE.call, pace, {
    first: 'stage',
    underStickyBar: true,
    beats: [...keys, answer],
  });
  // The call runs down the line to the dispatcher, scrubbed. Only the offset moves (the dasharray
  // carries the dashes), in path units (pathLength="1"), so no rounding to whole pixels.
  tl.fromTo(
    scene.querySelector('#call-line'),
    { strokeDashoffset: 1 },
    { strokeDashoffset: 0, duration: LINE.to - LINE.from, autoRound: false },
    LINE.from,
  );
  hold(tl);
}

function pinRoad(pace: Pace): void {
  const scene = document.getElementById('scene-road');
  const stage = scene?.querySelector<HTMLElement>('.scene__stage');
  const van = scene?.querySelector('[data-van="road"]');
  if (!scene || !stage || !van) return;
  const tl = pinScene(scene, DISTANCE.road, pace, { first: 'stage', underStickyBar: true });
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
  // The morning brightens: the section's gradient and road-sky.svg both paint with these stops.
  const token = (name: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const legs = (prop: string, stops: ReadonlyArray<readonly [number, string]>) => {
    stops.slice(1).forEach(([to, toColor], i) => {
      const [from, fromColor] = stops[i];
      tl.fromTo(
        scene,
        { [prop]: token(fromColor) },
        // Only the first leg renders at once; later legs take over from where it ends.
        { [prop]: token(toColor), duration: to - from, immediateRender: i === 0 },
        from,
      );
    });
  };
  legs('--road-sky-top', SKY_TOP);
  legs('--road-sky-bottom', SKY_BOTTOM);
  hold(tl);
}

function pinDoor(pace: Pace): void {
  const scene = document.getElementById('scene-door');
  if (!scene) return;
  // The kid's eyes turn into hearts: from half size, with a lively overshoot.
  const hearts = beat(
    gagTween(
      [scene.querySelector('#heart-l'), scene.querySelector('#heart-r')],
      { '--pop': 0.5, '--pop-o': 0 },
      { '--pop': 1, '--pop-o': 1, duration: 0.28, ease: 'back.out(2)' },
    ),
    HEARTS_AT,
  );
  // Dad gives a thumbs-up from the next room.
  const thumb = beat(
    gagTween(
      scene.querySelector('#dad-thumb'),
      { opacity: 0 },
      { opacity: 1, duration: 0.2, ease: 'power2.out' },
    ),
    THUMB_AT,
  );
  // The price tag settles onto the wall (GSAP folds its CSS rotate tilt into the transform it
  // animates, so the tilt stays).
  const price = beat(
    gagTween(
      scene.querySelector('#price-badge'),
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.3, ease: 'expo.out' },
    ),
    BADGE_AT,
  );
  const tl = pinScene(scene, DISTANCE.door, pace, {
    first: 'stage',
    underStickyBar: true,
    beats: [hearts, thumb, price],
  });
  // The door (drawn closed) swings open on its hinge, scrubbed: the medic stands there with a
  // full tub.
  tl.fromTo(
    scene.querySelector('#door-leaf'),
    { '--door-open': '0deg' },
    { '--door-open': '-100deg', duration: DOOR_OPEN },
    0,
  );
  hold(tl);
}

/**
 * The header frosts past 40 px; the sticky call bar (phones) and the header's call pill (desktop)
 * show once the hero's call button has gone under the header, one trigger for both. All follow the
 * scroll position on every state change (onUpdate), not `isActive`: a trigger ending at 'max' is
 * no longer active at the very bottom of the page, and a jump from there back to the top (Home,
 * the brand link) changes no active state at all. All are also set on every refresh, wherever the
 * page opens. The pill is not tied to the frost, or it would sit beside the hero's own button.
 */
function headerAndSticky(): void {
  const header = document.getElementById('header');
  const sticky = document.getElementById('sticky-cta');
  const hero = document.getElementById('hero');
  const heroCall = hero?.querySelector('[data-cta]') ?? hero;
  const past = (self: ScrollTrigger) => self.scroll() > self.start;

  const frost = (self: ScrollTrigger) => setFlag(header, 'scrolled', past(self));
  ScrollTrigger.create({ start: HEADER_OFFSET, end: 'max', onUpdate: frost, onRefresh: frost });

  if (!heroCall) return;
  const call = (self: ScrollTrigger) => {
    setFlag(sticky, 'visible', past(self));
    setFlag(header, 'ctaVisible', past(self));
  };
  ScrollTrigger.create({
    trigger: heroCall,
    pinnedContainer: hero,
    start: () => `bottom top+=${headerHeight()}`,
    end: 'max',
    onUpdate: call,
    onRefresh: call,
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
      scrub: stopSmoothScroll ? true : SCRUB_TOUCH,
      anticipatePin: stopSmoothScroll ? 0 : 1,
    };
    const heroSiren = document.getElementById('siren-light-hero');
    const roadSiren = document.getElementById('siren-light-road');
    heroSiren?.classList.add('siren--on');
    // On the road the siren is always on alert.
    roadSiren?.classList.add('siren--on');
    setAlert(roadSiren, true);

    pinHero(pace);
    pinKitchen(pace);
    pinCall(pace);
    pinRoad(pace);
    pinDoor(pace);
    headerAndSticky();

    return () => {
      heroSiren?.classList.remove('siren--on', 'siren--alert');
      roadSiren?.classList.remove('siren--on', 'siren--alert');
      stopSmoothScroll?.();
    };
  });
}
