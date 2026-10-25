import type { FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { getLang, type Lang } from '../i18n';

/** OpenFreeMap: OpenStreetMap vector tiles, free, no key, commercial use allowed. A quiet, light style. */
export const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

/** Brand red (tokens.css --red-600) for the city's edge, and its fill and the dimmed outside. */
const RED = '#c71920';
const OUTSIDE = '#2e140d';

/** How far from the screen the map starts loading (its code and tiles are only fetched near it). */
const PRELOAD_MARGIN = '600px 0px';

type City = FeatureCollection<MultiPolygon>;

/** The city's bounds as [[west, south], [east, north]]. */
export function cityBounds(city: City): [[number, number], [number, number]] {
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  for (const feature of city.features) {
    for (const polygon of feature.geometry.coordinates) {
      for (const [x, y] of polygon[0]) {
        w = Math.min(w, x);
        e = Math.max(e, x);
        s = Math.min(s, y);
        n = Math.max(n, y);
      }
    }
  }
  return [
    [w, s],
    [e, n],
  ];
}

/**
 * Everything but the city: a polygon covering the world with the city's outlines cut out of it, so
 * the outside can be dimmed and the city stays clear. Outer ring counter-clockwise, holes clockwise.
 */
export function outsideMask(city: City): Polygon {
  const world: Position[] = [
    [-180, -85],
    [180, -85],
    [180, 85],
    [-180, 85],
    [-180, -85],
  ];
  const holes: Position[][] = [];
  for (const feature of city.features) {
    for (const polygon of feature.geometry.coordinates) holes.push(clockwise(polygon[0]));
  }
  return { type: 'Polygon', coordinates: [world, ...holes] };
}

/** Signed area > 0 means counter-clockwise (shoelace, x east, y north). */
function signedArea(ring: Position[]): number {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return sum / 2;
}

function clockwise(ring: Position[]): Position[] {
  return signedArea(ring) > 0 ? [...ring].reverse() : ring;
}

/** MapLibre's hints for cooperative gestures, in the page's language. */
const GESTURE_HINTS: Record<Lang, Record<string, string>> = {
  uz: {
    'CooperativeGesturesHandler.WindowsHelpText':
      'Xaritani kattalashtirish uchun Ctrl tugmasini bosib aylantiring',
    'CooperativeGesturesHandler.MacHelpText':
      'Xaritani kattalashtirish uchun ⌘ tugmasini bosib aylantiring',
    'CooperativeGesturesHandler.MobileHelpText': 'Xaritani ikki barmoq bilan suring',
  },
  ru: {
    'CooperativeGesturesHandler.WindowsHelpText': 'Чтобы изменить масштаб, прокручивайте с Ctrl',
    'CooperativeGesturesHandler.MacHelpText': 'Чтобы изменить масштаб, прокручивайте с ⌘',
    'CooperativeGesturesHandler.MobileHelpText': 'Перемещайте карту двумя пальцами',
  },
};

/** Builds the map in `container`: OpenStreetMap, the city outlined in red, the outside dimmed. */
async function build(container: HTMLElement): Promise<MapLibreMap> {
  // The map's code, its stylesheet and the city's outline all come with it, not with the page.
  const [{ default: maplibregl }, { default: data }] = await Promise.all([
    import('maplibre-gl'),
    import('./tashkent.json'),
    import('maplibre-gl/dist/maplibre-gl.css'),
  ]);
  const city = data as City;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const map = new maplibregl.Map({
    container,
    style: STYLE_URL,
    bounds: cityBounds(city),
    fitBoundsOptions: { padding: 24 },
    // The page scrolls past the map: one finger (or a plain wheel) scrolls the page, two fingers
    // (or Ctrl/⌘ + wheel) move the map, and a hint says so.
    cooperativeGestures: true,
    locale: GESTURE_HINTS[getLang()],
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    attributionControl: { compact: true },
    fadeDuration: reduced ? 0 : 300,
  });
  map.touchZoomRotate.disableRotation();
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

  map.on('load', () => {
    map.addSource('tashkent', { type: 'geojson', data: city });
    map.addSource('outside', {
      type: 'geojson',
      data: { type: 'Feature', properties: {}, geometry: outsideMask(city) },
    });
    map.addLayer({
      id: 'outside',
      type: 'fill',
      source: 'outside',
      paint: { 'fill-color': OUTSIDE, 'fill-opacity': 0.28 },
    });
    map.addLayer({
      id: 'tashkent-fill',
      type: 'fill',
      source: 'tashkent',
      paint: { 'fill-color': RED, 'fill-opacity': 0.08 },
    });
    map.addLayer({
      id: 'tashkent-line',
      type: 'line',
      source: 'tashkent',
      layout: { 'line-join': 'round' },
      paint: { 'line-color': RED, 'line-width': 3 },
    });
    container.dataset.state = 'ready';
  });
  return map;
}

/**
 * The service area map: built once its section comes near the screen, so the map's code (about
 * 250 kB) and tiles never slow the first screen. If it cannot be built (no WebGL, offline), the
 * card is hidden (`data-state="failed"`): the heading above it already says where the service runs.
 */
export function initAreaMap(root: ParentNode = document): void {
  const container = root.querySelector<HTMLElement>('[data-area-map]');
  if (!container) return;

  const start = () => {
    container.dataset.state = 'loading';
    build(container).catch(() => {
      container.dataset.state = 'failed';
    });
  };

  if (typeof IntersectionObserver === 'undefined') {
    start();
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      start();
    },
    { rootMargin: PRELOAD_MARGIN },
  );
  observer.observe(container);
}
