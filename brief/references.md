# Chocobulance landing — design & motion references

Collected and verified live on 2026-10-20 (screenshots in `brief/references/`).
Goal: a scroll-driven parallax landing page where the **Chocobulance van moves as you scroll and
its wheels turn**, info-only, mobile-first, Apple-HIG-clean.

## A. Mechanic references — "vehicle moves with scroll"

| # | Reference | What to borrow | Technique | Fit |
| --- | --- | --- | --- | --- |
| 1 | **Scout Motors** — https://www.scoutmotors.com/ | Real-brand version of our idea: pinned full-screen scenes, the SUV travels along the trail as you scroll, terrain and light shift behind it, copy fades in per scene. Calm, premium, no gimmicks. | Scroll-scrubbed image/video frames + pinned sections | ★★★★★ mood + structure |
| 2 | **GSAP "car scroll hero"** (open source) — demo https://manjeetshekhawat0609.github.io/car-scroll-animation/ · code https://github.com/Manjeetshekhawat0609/car-scroll-animation | Exactly our mechanic: hero stays pinned, car drives in from the left as you scroll, **wheels rotate**, road markings slide backwards, headline fades. Swap the car for our van. | GSAP 3 + ScrollTrigger `scrub`, inline SVG car, Next.js | ★★★★★ mechanic |
| 3 | **Cyclemon** (2013 classic, still live) — https://www.cyclemon.com/ | The other way round: the bike stays centered, each section is a new illustrated scene with parallax layers (day → night → city). Great for a "journey through Tashkent" story in 4–5 scenes. | Section-based parallax, layered illustration | ★★★★ story structure |
| 4 | **CSS car on a road (Trig.js)** — https://codepen.io/iDev-Games/full/mydzqQE · write-up https://dev.to/idevgames/css-car-scroll-animation-using-trigjs-28ab | Minimal: scroll position → CSS variable → car `translateX` along a road. Shows how little code the core effect needs; good model for a no-JS / reduced-motion fallback. | CSS custom properties driven by scroll | ★★★ fallback idea |
| 5 | **Codrops scroll-driven SVG map** — demo https://tympanus.net/Tutorials/ScrollMap/ · tutorial https://tympanus.net/codrops/2026/05/21/creating-scroll-driven-svg-map-animations-with-gsap/ | A route draws itself on a map and the "camera" follows the moving dot as you scroll. Perfect for the **"We serve Tashkent city only"** section: a van icon drives a route across a stylised Tashkent map, outside the ring stays grey. | GSAP ScrollTrigger + DrawSVG + MotionPath | ★★★★ coverage section |
| 6 | **Ford M-Sport Raptor T1+** (Ryze Agency) — https://www.msport-raptor.com/ | The ceiling: full 3D WebGL scroll-hijacked experience with a loader. Shows what "super cool" looks like at the top end, and why we should not go there for a 2-week campaign page (heavy, slow on phones, scroll hijack hurts accessibility). | WebGL/3D, scroll hijack | ★★ inspiration only |
| 7 | **Truck'N Roll** (Locomotive, Awwwards SOTD Jun 2026) — https://trucknroll.com/ | Not a scroll-vehicle site, but a strong style reference: huge confident type, dark background, video of the truck, generous spacing. Tone of "serious logistics", which makes the chocolate joke land harder. | Locomotive Scroll, Craft CMS | ★★★ typography/tone |

## B. Technique references (for the build)

- **GSAP ScrollTrigger** — https://gsap.com/docs/v3/Plugins/ScrollTrigger/ — pin, scrub, timeline-to-scroll mapping. Industry standard; free for commercial use since 2024.
- **Apple-style image sequence on scroll** — CSS-Tricks write-up https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/ and GSAP forum thread https://gsap.com/community/forums/topic/25188-airpods-image-sequence-animation-using-scrolltrigger/ — if we ever render the van in 3D and scrub frames. Heavier assets (WebP sequence), but photoreal.
- **CSS scroll-driven animations (no JS)** — MDN https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline/scroll · Chrome guide https://developer.chrome.com/articles/scroll-driven-animations · demo gallery https://scroll-driven-animations.style/ — wheel rotation = one `rotate` keyframe with `animation-timeline: scroll()`. Chrome/Edge/Firefox yes; Safari support must be checked at build time, so GSAP stays the primary path.
- **Lottie on scroll** — https://lottiefiles.com/search?q=ambulance&category=animations (ready-made ambulance/van animations) + lottie-interactivity scroll mode. Option if we want a hand-animated cartoon van quickly; scrubbing a Lottie by scroll is one line.
- **Framer "Truckify" component** — https://www.framer.com/marketplace/components/truckify/ — van drives in, picks up a package, drives off. Not scroll-based, but a nice micro-motion idea for the "How it works" steps.

## C. What I would take from these (to discuss)

1. **Structure like Scout + Cyclemon:** 4–5 pinned scenes = the story of one call. Empty tub → call 105 → van leaves the depot → van drives through Tashkent → handover at the door. Scroll progress drives the van across each scene.
2. **Mechanic like the GSAP car hero:** van is a layered asset (body, front wheel, rear wheel, shadow); wheels rotate proportional to distance travelled; background in 3 parallax layers (sky/skyline, buildings, road); road markings slide. GSAP ScrollTrigger scrub, Lenis for smooth scroll.
3. **Coverage section like the Codrops map:** van icon drives a loop on a stylised Tashkent map; districts inside the ring glow red, outside stays grey, with the "city only" note and the 99 000 UZS price card.
4. **Restraint from Apple HIG:** scenes are short, type is large and legible, one CTA ("Call 105") is always reachable (sticky bottom button on mobile), `prefers-reduced-motion` gives a static illustrated version, no scroll hijack.
5. **Asset we need:** a clean **side-view** of the Chocobulance van with separable wheels (SVG or PNG layers). The current AI renders are 3/4-view photos, so we either generate a side-view illustration or render one.

## D. Rejected / not useful

- Awwwards "automotive" and "car" collections (mostly dealers and showrooms, nothing scroll-driven).
- BMW Next Move (bmwf3.com) — a pitch microsite behind a "start engine" button, not relevant.
- CodePen search pages are behind a bot check; individual pens above were opened directly.
