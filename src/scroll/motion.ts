import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { REDUCED_MOTION, initReduced, setFlag } from './reduced';
import { initTimeline } from './timeline';

export function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION).matches;
}

/** Undoes the running `watchInlineCta`, so starting the story again leaves one watch, not two. */
let stopInlineCta: (() => void) | undefined;

/**
 * While the call under the steps is wholly on screen, the phone bar and the desktop header pill
 * step aside (`data-inline-cta` on both), so there is never a second red call button up. Wholly:
 * the root is the viewport less the header at the top and the bar at the bottom, and the call must
 * be entirely inside it (threshold 1). A call with one px showing, or half hidden under the bar,
 * is nothing to tap, and the bar must stay up for that stretch. Watched by position on the page,
 * not by the story, so it holds with pins and still frames alike. The bar's height is 0 on
 * desktop, so the margins are measured again when the screen is resized (a tablet turned past the
 * 900 px breakpoint); the observer is only rebuilt if they changed.
 */
function watchInlineCta(): void {
  stopInlineCta?.();
  stopInlineCta = undefined;

  const cta = document.querySelector('#how [data-cta]');
  const header = document.getElementById('header');
  const sticky = document.getElementById('sticky-cta');
  if (!cta || typeof IntersectionObserver === 'undefined') return;

  let observer: IntersectionObserver | undefined;
  let margin = '';
  const observe = () => {
    const inset = (el: HTMLElement | null) => (el?.offsetHeight ? `-${el.offsetHeight}px` : '0px');
    const next = `${inset(header)} 0px ${inset(sticky)} 0px`;
    if (next === margin) return;
    margin = next;
    observer?.disconnect();
    observer = new IntersectionObserver(
      (entries) => {
        // Any overlap is "intersecting"; only the ratio says the call is clear of both.
        const wholly = entries[entries.length - 1].intersectionRatio >= 1;
        setFlag(header, 'inlineCta', wholly);
        setFlag(sticky, 'inlineCta', wholly);
      },
      { rootMargin: next, threshold: 1 },
    );
    observer.observe(cta);
  };

  observe();
  window.addEventListener('resize', observe);
  stopInlineCta = () => {
    window.removeEventListener('resize', observe);
    observer?.disconnect();
  };
}

/**
 * Starts the scroll story: pinned, scrubbed scenes, or still frames under reduced motion. Run it
 * once the fonts are in, since they set the scenes' heights. A visitor who turns reduced motion on
 * mid-visit gets the still frames at once (timeline.ts); one who starts reduced keeps them until
 * the next page load.
 */
export function initScroll(): void {
  watchInlineCta();
  if (prefersReducedMotion()) initReduced();
  else initTimeline();
}

/** Re-measures the pinned scenes, e.g. after a language switch changed their copy's length. */
export function refreshScroll(): void {
  ScrollTrigger.refresh();
}
