// The car's path through each lane, and how the lanes are wired to the scroll.
const created = vi.hoisted(() => [] as Array<Record<string, unknown>>);
vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    create: (vars: Record<string, unknown>) => {
      created.push(vars);
      return vars;
    },
  },
}));

import { WHEEL_SHARE, carAt, initCars, isLaneKind, laneRange, wheelTurn } from '../src/scroll/car';

const VIEW = 1440;
const CAR = 560;
const OFF = (VIEW + CAR) / 2; // just past an edge

afterEach(() => {
  created.length = 0;
  document.body.innerHTML = '';
});

describe('laneRange', () => {
  it('drives right to left and left to right from just past one edge to just past the other', () => {
    expect(laneRange('rtl', VIEW, CAR)).toEqual([OFF, -OFF]);
    expect(laneRange('ltr', VIEW, CAR)).toEqual([-OFF, OFF]);
  });

  it('pulls up at the door and parks in the middle of the lane', () => {
    expect(laneRange('arrive', VIEW, CAR)).toEqual([OFF, 0]);
  });

  it('opens the page with the car a little over half in at the right, and drives off left', () => {
    const [from, to] = laneRange('enter', VIEW, CAR);
    // The car's left edge, measured from the lane's left edge.
    const left = VIEW / 2 - CAR / 2 + from;
    expect((VIEW - left) / CAR).toBeCloseTo(0.55);
    expect(to).toBe(-OFF);
  });

  it('starts every crossing lane fully off screen, so a car never pops in', () => {
    for (const kind of ['ltr', 'rtl', 'arrive'] as const) {
      const [from] = laneRange(kind, VIEW, CAR);
      expect(Math.abs(from) - CAR / 2).toBeGreaterThanOrEqual(VIEW / 2);
    }
  });
});

describe('wheelTurn', () => {
  it('turns a wheel once per circumference rolled, clockwise when rolling right', () => {
    const circumference = Math.PI * CAR * WHEEL_SHARE;
    expect(wheelTurn(circumference, CAR)).toBeCloseTo(360);
    expect(wheelTurn(-circumference / 2, CAR)).toBeCloseTo(-180);
  });

  it('does not divide by zero for a car not laid out yet', () => {
    expect(wheelTurn(100, 0)).toBe(0);
  });
});

describe('carAt', () => {
  it('follows the scroll linearly across a crossing lane', () => {
    expect(carAt('ltr', 0, VIEW, CAR).x).toBe(-OFF);
    expect(carAt('ltr', 0.5, VIEW, CAR).x).toBeCloseTo(0);
    expect(carAt('ltr', 1, VIEW, CAR).x).toBe(OFF);
  });

  it('brakes into the parking spot instead of stopping dead', () => {
    const half = carAt('arrive', 0.5, VIEW, CAR).x;
    // Eased out: past the linear midpoint already at half the scroll, and exactly parked at the end.
    expect(half).toBeLessThan(OFF / 2);
    expect(carAt('arrive', 1, VIEW, CAR).x).toBe(0);
  });

  it('spins the wheels with the distance travelled, backwards when driving left', () => {
    const { x, turn } = carAt('rtl', 0.25, VIEW, CAR);
    expect(turn).toBeCloseTo(wheelTurn(x - OFF, CAR));
    expect(turn).toBeLessThan(0);
    expect(carAt('ltr', 0.25, VIEW, CAR).turn).toBeGreaterThan(0);
  });
});

describe('initCars', () => {
  const lane = (kind: string) => `
    <div class="lane" data-lane="${kind}">
      <div class="car" data-car>
        <img class="car__body" alt="" /><img class="car__wheel" alt="" /><img class="car__wheel" alt="" />
      </div>
    </div>`;

  it('makes one scrubbed trigger per lane; crossings run in the middle of the screen, one car at a time', () => {
    document.body.innerHTML = ['enter', 'ltr', 'arrive', 'rtl', 'nonsense'].map(lane).join('');
    const triggers = initCars(document);

    expect(triggers).toHaveLength(4);
    expect(created.map((v) => [v.start, v.end])).toEqual([
      // The first car is on screen at load and gone by the time its lane is halfway up.
      [0, 'bottom 50%'],
      ['top 65%', 'bottom 35%'],
      // The car at the door parks once its lane is in the middle of the screen.
      ['top bottom', 'center center'],
      ['top 65%', 'bottom 35%'],
    ]);
    expect(created.map((v) => v.trigger)).toEqual(
      [...document.querySelectorAll('[data-lane]')].slice(0, 4),
    );
  });

  it('writes only transforms: the car moves, the wheels turn', () => {
    document.body.innerHTML = lane('ltr');
    const [vars] = (initCars(document), created);
    const car = document.querySelector<HTMLElement>('[data-car]')!;
    Object.defineProperty(car, 'offsetWidth', { value: CAR });
    Object.defineProperty(car.parentElement!, 'clientWidth', { value: VIEW });

    (vars.onRefreshInit as () => void)();
    (vars.onUpdate as (self: { progress: number }) => void)({ progress: 0.75 });

    const { x, turn } = carAt('ltr', 0.75, VIEW, CAR);
    expect(car.style.transform).toBe(`translate3d(${x.toFixed(1)}px, 0, 0)`);
    for (const wheel of document.querySelectorAll<HTMLElement>('.car__wheel')) {
      expect(wheel.style.transform).toBe(`rotate(${turn.toFixed(1)}deg)`);
    }
    // Nothing that would make the browser lay the page out again.
    expect(car.getAttribute('style')).not.toMatch(/left|top|width|margin/);
  });

  it('skips a lane without a car, and knows its lane kinds', () => {
    document.body.innerHTML = '<div data-lane="ltr"></div>';
    expect(initCars(document)).toHaveLength(0);
    expect(['enter', 'ltr', 'rtl', 'arrive'].every(isLaneKind)).toBe(true);
    expect(isLaneKind('up')).toBe(false);
  });
});
