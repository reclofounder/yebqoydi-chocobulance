import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initCars } from './car';
import { initSmoothScroll } from './smooth';

gsap.registerPlugin(ScrollTrigger);

export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** Scroll distance (px) past which the header turns into its frosted bar. */
export const HEADER_OFFSET = 40;

export function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION).matches;
}

/** Keeps the header's `data-scrolled` (its frosted bar, layout.css) in step with the page scroll. */
function watchHeader(): void {
  const header = document.getElementById('header');
  if (!header) return;
  const update = () => {
    const value = String(window.scrollY > HEADER_OFFSET);
    if (header.dataset.scrolled !== value) header.dataset.scrolled = value;
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/**
 * Words rise into place as they come on screen: `data-shown` on each `[data-reveal]`, once.
 * `motion` on <html> is what hides them until then (layout.css), so without this script, or
 * without IntersectionObserver, they are simply there.
 */
function revealWords(): void {
  if (typeof IntersectionObserver === 'undefined') return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.shown = '';
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  for (const el of document.querySelectorAll('[data-reveal]')) observer.observe(el);
  document.documentElement.classList.add('motion');
}

/**
 * Starts the page's motion: the header bar always; the smooth wheel scrolling, the words rising
 * and the driving car unless the visitor asked for reduced motion (then the CSS parks the car at
 * the door and hides the other lanes). Run it once the fonts are in, since they set the heights
 * the lanes are measured against.
 */
export function initScroll(): void {
  watchHeader();
  if (prefersReducedMotion()) return;
  initSmoothScroll();
  revealWords();
  initCars();
}

/** Re-measures the lanes, e.g. after a language switch changed the copy's length. */
export function refreshScroll(): void {
  ScrollTrigger.refresh();
}
