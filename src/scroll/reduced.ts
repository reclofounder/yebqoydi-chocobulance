/**
 * Reduced motion: the story as still frames. No pins, no scrubbing, no smoothing, no siren pulse
 * or idle bob. Each scene shows its drawn final state (Dad caught peeking, the digits lit, the
 * line drawn, the bubble out, the hearts and the thumbs-up, the price tag on the wall), and CSS
 * keyed on `.reduced` adds the rest: the door held open, the road van parked mid-drive in view,
 * the scroll hint gone (scenes.css).
 */

export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/** Scroll distance (px) past which the header turns into its frosted bar, in both branches. */
export const HEADER_OFFSET = 40;

/** Sets `data-<name>` to "true" or "false", touching the DOM only when the value changes. */
export function setFlag(el: HTMLElement | null, name: 'scrolled' | 'visible', on: boolean): void {
  const value = String(on);
  if (el && el.dataset[name] !== value) el.dataset[name] = value;
}

/**
 * Adds `reduced` to <html> and keeps the header and the sticky call bar in step with the page
 * scroll. Returns the undo (used when reduced motion is switched off mid-visit).
 */
export function initReduced(): () => void {
  const root = document.documentElement;
  const header = document.getElementById('header');
  const sticky = document.getElementById('sticky-cta');
  // Nothing is pinned here, so the bar takes over once the hero's own call button has scrolled
  // out of view (the hero itself, should the button be missing).
  const heroCall = document.querySelector('#hero [data-cta]') ?? document.getElementById('hero');

  const update = () => {
    setFlag(header, 'scrolled', window.scrollY > HEADER_OFFSET);
    setFlag(sticky, 'visible', heroCall !== null && heroCall.getBoundingClientRect().bottom <= 0);
  };

  root.classList.add('reduced');
  update();
  window.addEventListener('scroll', update, { passive: true });

  return () => {
    window.removeEventListener('scroll', update);
    root.classList.remove('reduced');
  };
}
