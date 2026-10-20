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

/**
 * The chrome's state flags, as `data-*` attributes the styles key on:
 * - header `scrolled`: the frosted bar;
 * - header `ctaVisible` and sticky bar `visible`: the hero's own call has scrolled away, so the
 *   desktop header pill and the phone bar take over;
 * - header and sticky bar `inlineCta`: the call under the steps is on screen, so both step aside.
 */
export type Flag = 'scrolled' | 'visible' | 'ctaVisible' | 'inlineCta';

/** Sets `data-<name>` to "true" or "false", touching the DOM only when the value changes. */
export function setFlag(el: HTMLElement | null, name: Flag, on: boolean): void {
  const value = String(on);
  if (el && el.dataset[name] !== value) el.dataset[name] = value;
}

/**
 * Adds `reduced` to <html> and keeps the header (frost and call pill) and the sticky call bar in
 * step with the page scroll. Returns the undo (used when reduced motion is switched off mid-visit).
 */
export function initReduced(): () => void {
  const root = document.documentElement;
  const header = document.getElementById('header');
  const sticky = document.getElementById('sticky-cta');
  // Nothing is pinned here, so the bar takes over once the hero's own call button has gone under
  // the header, as in the pinned story (the hero itself, should the button be missing).
  const heroCall = document.querySelector('#hero [data-cta]') ?? document.getElementById('hero');

  const update = () => {
    const callGone =
      heroCall !== null && heroCall.getBoundingClientRect().bottom <= (header?.offsetHeight ?? 0);
    setFlag(header, 'scrolled', window.scrollY > HEADER_OFFSET);
    setFlag(header, 'ctaVisible', callGone);
    setFlag(sticky, 'visible', callGone);
  };

  root.classList.add('reduced');
  update();
  window.addEventListener('scroll', update, { passive: true });

  return () => {
    window.removeEventListener('scroll', update);
    root.classList.remove('reduced');
  };
}
