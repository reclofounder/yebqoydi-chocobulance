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

/** The car's offset and its wheels' turn at `progress` (0-1) through its lane. */
export function carAt(
  kind: LaneKind,
  progress: number,
  view: number,
  car: number,
  share: number = WHEEL_SHARE,
): { x: number; turn: number } {
  const [from, to] = laneRange(kind, view, car);
  // Pulling up at the door: it brakes (eases out) instead of stopping dead.
  const p = kind === 'arrive' ? 1 - (1 - progress) ** 2 : progress;
  const x = from + (to - from) * p;
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
        // The first lane is on screen at load: it runs from the very top of the page.
        start: kind === 'enter' ? 0 : 'top bottom',
        // The car at the door parks once the lane is in the middle of the screen.
        end: kind === 'arrive' ? 'center center' : 'bottom top',
        onRefreshInit: measure,
        onRefresh: (self) => draw(self.progress),
        onUpdate: (self) => draw(self.progress),
      }),
    );
  }

  return triggers;
}
