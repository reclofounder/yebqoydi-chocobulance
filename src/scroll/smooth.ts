import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const FINE_POINTER = '(pointer: fine)';

/** The element a link's fragment names on this page (`#how`); null for `#`, unknown or malformed. */
export function fragmentTarget(hash: string): HTMLElement | null {
  if (!hash.startsWith('#')) return null;
  try {
    const id = decodeURIComponent(hash.slice(1));
    return id ? document.getElementById(id) : null;
  } catch {
    return null; // a malformed escape, such as #%E0%A4%A
  }
}

/**
 * Smooth wheel and trackpad scrolling (Lenis), stepped by GSAP's ticker so the smoothed scroll and
 * the scrubbed scenes share one frame. Touch scrolling stays native: phones already scroll
 * smoothly, and taking over touch feels wrong. Kept apart so it can be dropped if it hurts.
 * Returns the undo, or nothing when the pointer is not fine.
 */
export function initSmoothScroll(): (() => void) | undefined {
  if (!window.matchMedia(FINE_POINTER).matches) return undefined;

  const lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  const raf = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  // Lenis already eases; GSAP's lag smoothing would make the two disagree after a long frame.
  gsap.ticker.lagSmoothing(0);

  // In-page links (the hero's "how it works", the brand, the skip link): Lenis jumps there with
  // the browser, at once. Left to the browser alone, a glide still in flight would carry the page
  // back to where the wheel was heading; a glide to the link would replay the story at speed. The
  // browser still follows the link (the hash, and where the next Tab starts). Both land on the
  // section's scroll-margin-top, clear of the header. New-tab and modified clicks are left alone.
  const onLink = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!(event.target instanceof Element)) return;
    const href = event.target.closest('a[href^="#"]')?.getAttribute('href');
    const target = href ? fragmentTarget(href) : null;
    if (target) lenis.scrollTo(target, { immediate: true });
  };
  document.addEventListener('click', onLink);

  return () => {
    document.removeEventListener('click', onLink);
    gsap.ticker.remove(raf);
    gsap.ticker.lagSmoothing(500, 33);
    lenis.destroy();
  };
}
