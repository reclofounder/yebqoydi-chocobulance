// The service area map: the city's outline and mask, and that the map loads only when it is near.
import type { FeatureCollection, MultiPolygon, Position } from 'geojson';
import tashkent from '../src/map/tashkent.json';
import { cityBounds, initAreaMap, outsideMask } from '../src/map/area-map';

const city = tashkent as FeatureCollection<MultiPolygon>;

/** Signed area > 0: counter-clockwise. */
const area = (ring: Position[]) =>
  ring.slice(0, -1).reduce((sum, p, i) => sum + p[0] * ring[i + 1][1] - ring[i + 1][0] * p[1], 0) /
  2;

describe('the city', () => {
  it('is Tashkent city from OpenStreetMap, closed rings, credited', () => {
    const [feature] = city.features;
    expect(feature.properties!.source).toMatch(/OpenStreetMap relation 2216724/);
    for (const polygon of feature.geometry.coordinates) {
      const ring = polygon[0];
      expect(ring[0]).toEqual(ring[ring.length - 1]);
    }
  });

  it('fits the map to Tashkent (around 41.3 N, 69.3 E)', () => {
    const [[w, s], [e, n]] = cityBounds(city);
    expect(w).toBeGreaterThan(69);
    expect(e).toBeLessThan(69.7);
    expect(s).toBeGreaterThan(41.1);
    expect(n).toBeLessThan(41.5);
  });

  it('dims the outside with a world polygon that has the city cut out', () => {
    const mask = outsideMask(city);
    const [world, ...holes] = mask.coordinates;
    expect(area(world)).toBeGreaterThan(0); // outer ring counter-clockwise
    expect(holes).toHaveLength(city.features[0].geometry.coordinates.length);
    for (const hole of holes) expect(area(hole)).toBeLessThan(0); // holes clockwise
  });
});

describe('initAreaMap', () => {
  let observed: Element[] = [];
  let callback: IntersectionObserverCallback;
  const disconnect = vi.fn();

  beforeEach(() => {
    observed = [];
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IntersectionObserverCallback) {
          callback = cb;
        }
        observe(el: Element) {
          observed.push(el);
        }
        disconnect = disconnect;
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('does nothing on a page without the map', () => {
    initAreaMap(document);
    expect(observed).toHaveLength(0);
  });

  it('waits until the map is near the screen, then starts it once', () => {
    document.body.innerHTML = '<div data-area-map></div>';
    const el = document.querySelector<HTMLElement>('[data-area-map]')!;
    initAreaMap(document);

    expect(observed).toEqual([el]);
    expect(el.dataset.state).toBeUndefined();

    callback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(el.dataset.state).toBeUndefined();

    callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(disconnect).toHaveBeenCalled();
    expect(el.dataset.state).toBe('loading');
  });
});
