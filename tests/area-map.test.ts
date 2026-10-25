// The service area map: the area's outline and mask, and that the map loads only when it is near.
import type { FeatureCollection, MultiPolygon, Position } from 'geojson';
import serviceArea from '../src/map/service-area.json';
import { areaBounds, initAreaMap, outsideMask } from '../src/map/area-map';

const area = serviceArea as FeatureCollection<MultiPolygon>;

/** Signed area > 0: counter-clockwise. */
const signedArea = (ring: Position[]) =>
  ring.slice(0, -1).reduce((sum, p, i) => sum + p[0] * ring[i + 1][1] - ring[i + 1][0] * p[1], 0) /
  2;

describe('the service area', () => {
  it('is the area the client drew over the map, a closed ring, with the map data credited', () => {
    const [feature] = area.features;
    expect(feature.properties!.source).toMatch(/Drawn by the client/);
    expect(feature.properties!.source).toMatch(/OpenStreetMap contributors/);
    for (const polygon of feature.geometry.coordinates) {
      const ring = polygon[0];
      expect(ring[0]).toEqual(ring[ring.length - 1]);
    }
  });

  it('fits the map to Tashkent (around 41.3 N, 69.3 E)', () => {
    const [[w, s], [e, n]] = areaBounds(area);
    expect(w).toBeGreaterThan(69);
    expect(e).toBeLessThan(69.7);
    expect(s).toBeGreaterThan(41.1);
    expect(n).toBeLessThan(41.5);
  });

  it('dims the outside with a world polygon that has the area cut out', () => {
    const mask = outsideMask(area);
    const [world, ...holes] = mask.coordinates;
    expect(signedArea(world)).toBeGreaterThan(0); // outer ring counter-clockwise
    expect(holes).toHaveLength(area.features[0].geometry.coordinates.length);
    for (const hole of holes) expect(signedArea(hole)).toBeLessThan(0); // holes clockwise
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
