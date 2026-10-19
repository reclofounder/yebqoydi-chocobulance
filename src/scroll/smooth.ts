import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const FINE_POINTER = '(pointer: fine)';

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

  return () => {
    gsap.ticker.remove(raf);
    gsap.ticker.lagSmoothing(500, 33);
    lenis.destroy();
  };
}
