import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * How the car crosses a lane (index.html, `data-lane`):
 * - `enter`: already half in from the right on the first screen, drives off to the left;
 * - `ltr` / `rtl`: in from one edge, out at the other, as the lane scrolls through the screen;
 * - `arrive`: in from the right, slowing down, and parks in the middle (it has reached the door).
 */
export type LaneKind = 'enter' | 'ltr' | 'rtl' | 'arrive';

export function isLaneKind(value: unknown): value is LaneKind {
  return value === 'enter' || value === 'ltr' || value === 'rtl' || value === 'arrive';
}

/**
 * The tyre's diameter as a share of the car's width: how far the car rolls per turn of its wheels.
 * The real value comes from car.css (`--tyre-share`, written by tools/car/export.py from the
 * design); this is the fallback when the stylesheet is not there (tests).
 */
export const WHEEL_SHARE = 0.14;

/**
 * When each crossing runs, as ScrollTrigger positions ("lane edge, screen edge"). The first lane is
 * on screen at load, so it runs from the very top of the page and is done by the time its lane is
 * halfway up the screen; the car at the door parks once its lane is in the middle. The others drive
 * across while their lane is in the middle third of the screen: with the blocks between lanes just
 * over half a screen tall, one car has left before the next comes in (measured at 1440x900,
 * 1280x720 and 390x844).
 */
const START: Record<LaneKind, number | string> = {
  enter: 0,
  ltr: 'top 65%',
  rtl: 'top 65%',
  arrive: 'top bottom',
};
const END: Record<LaneKind, string> = {
  enter: 'bottom 50%',
  ltr: 'bottom 35%',
  rtl: 'bottom 35%',
  arrive: 'center center',
};

/** Share of the car already on screen at the right edge when the page opens (`enter`). */
const ENTER_SHOWN = 0.55;

/**
 * Where the car is at the start and at the end of its lane: px from the lane's middle (where CSS
 * parks it), for a screen `view` px wide and a car `car` px wide. ±(view + car) / 2 is just past
 * an edge.
 */
export function laneRange(kind: LaneKind, view: number, car: number): [number, number] {
  const off = (view + car) / 2;
  switch (kind) {
    case 'enter':
      return [view / 2 + car / 2 - ENTER_SHOWN * car, -off];
    case 'ltr':
      return [-off, off];
    case 'rtl':
      return [off, -off];
    case 'arrive':
      return [off, 0];
  }
}

/** Degrees a wheel turns while the car rolls `distance` px (positive = to the right, clockwise). */
export function wheelTurn(distance: number, car: number, share: number = WHEEL_SHARE): number {
  const radius = (car * share) / 2;
  return radius > 0 ? (distance / (2 * Math.PI * radius)) * 360 : 0;
}

/**
 * A crossing lingers in the middle: fast past the edges, slower where the whole car is in view, so
 * it is seen whole for longer (on a phone the car is most of the screen wide). Odd and monotonic,
 * from -1 to 1, with the middle's speed a third of the edges' average.
 */
export function linger(u: number): number {
  return 0.35 * u + 0.65 * u ** 3;
}

/** The car's offset and its wheels' turn at `progress` (0-1) through its lane. */
export function carAt(
  kind: LaneKind,
  progress: number,
  view: number,
  car: number,
  share: number = WHEEL_SHARE,
): { x: number; turn: number } {
  const [from, to] = laneRange(kind, view, car);
  let x: number;
  if (kind === 'ltr' || kind === 'rtl') {
    x = (from + to) / 2 + ((to - from) / 2) * linger(2 * progress - 1);
  } else {
    // Pulling up at the door: it brakes (eases out) instead of stopping dead. The first car simply
    // drives off.
    const p = kind === 'arrive' ? 1 - (1 - progress) ** 2 : progress;
    x = from + (to - from) * p;
  }
  return { x, turn: wheelTurn(x - from, car, share) };
}

/**
 * Starts the cars: one ScrollTrigger per lane, scrubbed by the scroll position. Only `transform`
 * is written, so the browser moves the car without laying out the page. Sizes are re-read on every
 * refresh (resize, language switch), since the car's width follows the screen's.
 * Returns the triggers (for tests and for a later kill).
 */
export function initCars(root: ParentNode = document): ScrollTrigger[] {
  const triggers: ScrollTrigger[] = [];

  for (const lane of root.querySelectorAll<HTMLElement>('[data-lane]')) {
    const kind = lane.dataset.lane;
    const car = lane.querySelector<HTMLElement>('[data-car]');
    if (!isLaneKind(kind) || !car) continue;
    const wheels = [...car.querySelectorAll<HTMLElement>('.car__wheel')];

    let view = 0;
    let width = 0;
    let share = WHEEL_SHARE;
    const measure = () => {
      view = lane.clientWidth;
      width = car.offsetWidth;
      share = parseFloat(getComputedStyle(car).getPropertyValue('--tyre-share')) || WHEEL_SHARE;
    };
    const draw = (progress: number) => {
      const { x, turn } = carAt(kind, progress, view, width, share);
      car.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
      for (const wheel of wheels) wheel.style.transform = `rotate(${turn.toFixed(1)}deg)`;
    };

    measure();
    triggers.push(
      ScrollTrigger.create({
        trigger: lane,
        start: START[kind],
        end: END[kind],
        onRefreshInit: measure,
        onRefresh: (self) => draw(self.progress),
        onUpdate: (self) => draw(self.progress),
      }),
    );
  }

  return triggers;
}
