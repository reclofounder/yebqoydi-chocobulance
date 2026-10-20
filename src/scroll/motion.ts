import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { REDUCED_MOTION, initReduced, setFlag } from './reduced';
import { initTimeline } from './timeline';

export function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION).matches;
}

/**
 * While the call under the steps is on screen, the phone bar and the desktop header pill step
 * aside (`data-inline-cta` on both), so there is never a second red call button up. Watched by
 * position on the page, not by the story, so it holds with pins and still frames alike. The header
 * is excluded from the viewport: a call hidden under it is not on screen.
 */
function watchInlineCta(): void {
  const cta = document.querySelector('#how [data-cta]');
  const header = document.getElementById('header');
  const sticky = document.getElementById('sticky-cta');
  if (!cta || typeof IntersectionObserver === 'undefined') return;

  const observer = new IntersectionObserver(
    (entries) => {
      const onScreen = entries[entries.length - 1].isIntersecting;
      setFlag(header, 'inlineCta', onScreen);
      setFlag(sticky, 'inlineCta', onScreen);
    },
    { rootMargin: `-${header?.offsetHeight ?? 0}px 0px 0px 0px` },
  );
  observer.observe(cta);
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
