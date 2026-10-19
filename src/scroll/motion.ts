import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { REDUCED_MOTION, initReduced } from './reduced';
import { initTimeline } from './timeline';

export function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION).matches;
}

/**
 * Starts the scroll story: pinned, scrubbed scenes, or still frames under reduced motion. Run it
 * once the fonts are in, since they set the scenes' heights. A visitor who turns reduced motion on
 * mid-visit gets the still frames at once (timeline.ts); one who starts reduced keeps them until
 * the next page load.
 */
export function initScroll(): void {
  if (prefersReducedMotion()) initReduced();
  else initTimeline();
}

/** Re-measures the pinned scenes, e.g. after a language switch changed their copy's length. */
export function refreshScroll(): void {
  ScrollTrigger.refresh();
}
