# Task 6 report: Scroll timeline, parallax, wheels, humour beats, reduced motion

**Status:** DONE_WITH_CONCERNS
**Commit:** `bc4946f feat: scroll-driven story timeline with parallax and wheel rotation` (on `main`, not pushed). Not committed: `CLAUDE.md` (controller's edit) and `.claude/launch.json`.

## What I implemented

### Modules (`src/scroll/`)

| File | Role |
| --- | --- |
| `motion.ts` | `prefersReducedMotion()`, `initScroll()` (still frames or the timeline), `refreshScroll()` (`ScrollTrigger.refresh()`). |
| `timeline.ts` | Tuning constants at the top. `initTimeline()` builds everything inside one `gsap.matchMedia()` context with three conditions: `narrow` `(max-width: 899.98px)`, `wide` `(min-width: 900px)`, `reduce`. Contains `pinHero`, `pinKitchen`, `pinCall`, `pinRoad`, `pinDoor`, `headerAndSticky`, plus two pure helpers exported for tests: `pinShift()` (where a scene pins) and `wheelTurn()` (road wheel degrees). Registers ScrollTrigger once, at module level. |
| `reduced.ts` | `REDUCED_MOTION`, `HEADER_OFFSET` (40), `setFlag()` (writes `data-*` only on change), `initReduced()`. It adds `.reduced` to `<html>` and runs a passive scroll listener for the header and the sticky bar. It returns its undo. |
| `smooth.ts` | `initSmoothScroll()`: Lenis, only when `(pointer: fine)`. It is synced with `lenis.on('scroll', ScrollTrigger.update)`, `gsap.ticker.add(t => lenis.raf(t * 1000))` and `lagSmoothing(0)`, and imports `lenis/dist/lenis.css`. It returns its undo. Task 7 can drop it by deleting one call. |

### Boot (`src/main.ts`)

- `initScroll` runs last, through `(document.fonts?.ready ?? Promise.resolve()).then(initScroll)`.
- `document.addEventListener('langchange', refreshScroll)` re-measures the pins after a language switch.

### How things are animated

Every pinned scene is one scrubbed timeline: `pin: true`, `scrub: 0.8`, `invalidateOnRefresh: true`. Positions are fractions of the pin, because each timeline ends at exactly 1.

- **SVG parts with `fill-box` pivots** (wheels, door leaf, hearts) turn through CSS custom properties that GSAP tweens:
  - `.van [id^='van-wheel-'] { transform: rotate(var(--wheel-rot, 0deg)) }`, with `--wheel-rot` on the van root;
  - `#door-leaf { transform: perspective(900px) rotateY(var(--door-open, 0deg)) }`;
  - `#heart-l, #heart-r { transform: scale(var(--pop, 1)) }`.

  GSAP never writes an SVG transform on them, so they never orbit off their pivots.
- **Writes are context-tracked.** I write no inline style by hand: every write is a GSAP tween or set inside the `matchMedia` context. When reduced motion switches on mid-visit, GSAP reverts all of it (pins, inline styles), then `initReduced()` takes over. I checked this in the browser, both ways (see Visual verification).
- **Sirens:** `.siren--on` goes on `#siren-light-hero` and `#siren-light-road` while the story runs, and comes off in the context cleanup.
- **Idle bob:** pure CSS on `[data-van='hero']`.

## Beat timing per scene

Each pin length is in px of scroll at 390×844 (×0.75) and 1280×800. A fraction × that length gives where a beat lands.

| Scene | Pin length (390 / 1280) | Beats |
| --- | --- | --- |
| **Hero** | 950 / 1200 | 0–0.15: scroll hint fades out. 0–1: `.hero__numeral` drifts y 0 → −24 px. CSS loops: siren pulse and van idle. |
| **Kitchen** | 1266 / 1600 | 0–0.6: Dad slides x 0 → +140 (drawing units). The door casing covers him at about 0.3 (≈ 380 / 480 px). 0.35–0.6: opacity → 0, so no sliver lingers at the casing edge. 0.6–1: hold on the empty tub. The card stays in view on phones. |
| **Call** | 950 / 1200 | Digits light in order: 1 at 0.20, 0 at 0.40, 5 at 0.60. Each fades in over 0.05 with `power2.out`; they are set to 0 at init. 0.65–0.80: `#call-line` dashoffset 1 → 0, drawn from the phone to the headset. 0.85–0.95: `#bubble` scale 0 → 1, `back.out(1.4)`, growing from its tail. Hold to 1. |
| **Road** | 1899 / 2400 | Everything is linear over 0–1. **Van:** left edge from −20 % to 110 % of the stage width; it leaves the card at about 0.92. **Wheels:** 0 → 5289° on phones (≈ 14.7 turns) and 0 → 6845° on desktop (≈ 19 turns). **Layers:** far −0.15, mid −0.4, near −0.9 stage widths; the sky layer is static. **Sky:** dawn → "sunrise" at 0.4 (top `--cream`, bottom `--sky-dawn-bottom`) → day at 1. |
| **Door** | 950 / 1200 | 0–0.4: door opens 0 → −100°. 0.6–0.7: hearts pop (`--pop` 0 → 1, `back.out(1.4)`). 0.75–0.83: Dad's thumbs-up fades in. 0.85–0.95: price tag y +24 → 0 with opacity 0 → 1. Hold to 1. |

**Pin windows** (scroll px, from the browser):

| Size | Hero | Kitchen | Call | Road | Door |
| --- | --- | --- | --- | --- | --- |
| 1280×800 | 0–1200 | 2000–3600 | 4400–5600 | 6400–8800 | 9600–10800 |
| 390×844 | 0–950 | 2002–3268 | 4093–5043 | 5887–7786 | 8630–9580 |

## Pin strategy for tall scenes

ScrollTrigger calls `start: () => 'top top-=' + pinShift(measure(section))` on each refresh.

`measure` reads, per refresh and never per frame:
- the scene's height;
- its title's offset;
- `innerHeight`;
- the header's height;
- the sticky bar's height, when the bar is displayed (phones and tablets) and the scene comes after the hero.

`pinShift` then decides how far above the top of the screen the scene sits while pinned:
- A scene that fits pins at its top.
- **Story scenes (stage first):** the scene rises until its stage's bottom clears the sticky bar, since the animation plays there.
  - If that would cost the stage at most 24 px, the title keeps its place 8 px under the header instead.
  - If the scene is far taller than the screen, the stage wins. Its copy was fully visible on the way in, when the scene's top was at the top of the screen.
- **Hero (title first):** it rises only as far as its headline allows. Headline, call button and numeral matter more than the parked van there.

Measured in headless Chrome. "Title" is the h1/h2 box during the pin; the header is 64 px and the sticky bar 72 px:

| Size | Scene | Shift | Title during pin | Stage during pin | Sticky bar top |
| --- | --- | --- | --- | --- | --- |
| 1280×800 | all | 0 | in view | 220–580 | (hidden ≥ 900) |
| 390×844 | hero | 0 | 125–301 | 625–844 | (not shown yet) |
| 390×844 | kitchen (980 tall) | 208 | off-screen above; card and stage in view | 285–**772** | 772 |
| 390×844 | call / road / door | 53 | **72–144** | 304–791 (19 px under the bar) | 772 |
| 375×667 | hero (828 tall) | 53 | **72–246**, call button and "105" in view | 565–776 | — |
| 375×667 | kitchen | 365 | off-screen | 127–596 | 595 |
| 375×667 | call / road / door | 187 | off-screen | 126–595 | 595 |

On entry (scene top at the screen's top), every title sits at 125 px and every copy block ends by 492 px, so the copy is fully readable before each pin.

The sticky bar never covers a title. During pins, titles are either at 72–144 px or above the screen. The bar only crosses a title while a scene scrolls in from below, which no layout can avoid.

The road van's wheels clear the bar at 390×844. Their bottoms are about 2 px above its top edge (`390x844-road-van-closeup-p30.jpg`).

## Reduced-motion static frame

`initScroll()` checks `prefersReducedMotion()` first. If it is true, only `initReduced()` runs: no `matchMedia`, no timelines, no ScrollTriggers, no Lenis, no siren class.

CSS keyed on `.reduced` (`scenes.css`) sets the still frame:
- `#door-leaf` held open: `--door-open: -100deg`, i.e. `perspective(900px) rotateY(-100deg)`. The medic, the full tub, the hearts and the thumbs-up all show.
- Road van: its **centre** sits at 70 % of the card, with wheels unrotated:
  - phones: `left: calc(70% - 44% / 2)` → 48–92 % of the card;
  - desktop: `left: calc(70% - 34% / 2)` → 53–87 %.
- `.hero__scroll` hidden.
- `will-change` is scoped to `:root:not(.reduced)`.

Every other part rests in its drawn final state:
- **Dad stays visible, peeking from the kitchen door.** I picked this as the funnier frame: the caught culprit is the joke, and a hidden Dad leaves only the chocolate drops.
- The digits are lit, the line is drawn, the bubble is out, and the price tag is in place.

The siren pulse and the idle bob carry `animation: none` under `@media (prefers-reduced-motion: reduce)`.

The header and sticky bar run on a passive scroll listener:
- the header frosts at `scrollY > 40`;
- the sticky bar shows once the hero's call button has scrolled above the screen.

Verified: `reduced` class on, 0 pin spacers, 0 sirens, hero van animation `none`, hint `display:none`, door matrix = rotateY(−100°), digits opacity 1, dashoffset 0, bubble untransformed, badge rotate −4deg. The header and bar flags are true at y = 3000.

## Performance observations

**How I measured.** Headless Chrome (CDP), road scene only. I scrolled programmatically through the road pin over 4 s (one `scrollTo` per rAF) and recorded rAF intervals, long-animation-frame entries and `Performance.getMetrics` deltas.

| Run | Frames | avg / p95 / max (ms) | Frames > 20 ms | Long animation frames | Main thread per frame |
| --- | --- | --- | --- | --- | --- |
| 390×844, DPR 3, CPU 4× | 241 | 16.7 / 16.7 / 16.8 | 0 | 0 | ≈ 4.9 ms (style 2.35, script 0.56, layout 0.10) |
| 390×844, DPR 3, CPU 1× | 241 | 16.7 / 16.7 / 16.8 | 0 | 0 | ≈ 3.0 ms |
| 1280×800, DPR 2, CPU 4× | 241 | 16.7 / 16.8 / 16.8 | 0 | 0 | ≈ 5.7 ms |

- **Style recalc is the main cost.** It comes from the two sky custom properties on `#scene-road`, which every descendant inherits, plus `--wheel-rot` on the van.
- **Layout is ~1 per frame (cheap).** ScrollTrigger reads the scroll position.
- **Only transform and opacity move**, plus the four custom properties. No filters.
- **`will-change: transform`** is on the three moving layers and the road van only.
- **Caveat:** in headless mode the CPU throttle looked only partly effective (script time grew about 1.8×, not 4×), and GPU raster is not representative. Task 7 should confirm on a real mid-range Android or in DevTools with the Performance panel.
- **Bundle:** JS 73.6 → 210.6 kB (gzip 20.0 → 71.5 kB) for GSAP core, ScrollTrigger and Lenis; CSS 21.1 → 22.4 kB.

## Tests and TDD evidence

### `tests/motion.test.ts` (new, 26 tests)

GSAP, ScrollTrigger and Lenis are fakes. The `gsap.matchMedia` fake follows GSAP's contract: it runs while any condition matches, and on a re-run it calls the previous cleanup. `window.matchMedia` is stubbed from a set of matching queries, on the real `index.html` body with the scenes mounted.

| Area | What is covered |
| --- | --- |
| `prefersReducedMotion` | follows the media query |
| Reduced motion | `initScroll` adds `reduced`; no `matchMedia`, timelines, triggers or Lenis; no siren |
| Motion: pins | five pinned timelines in story order (`#hero` … `#scene-door`) with scrub 0.8. Desktop ends: `+=150%`, `+=200%`, `+=150%`, `+=300%`, `+=150%`. Narrow ends: `+=112.5%`, `+=150%`, `+=112.5%`, `+=225%`, `+=112.5%` |
| Motion: wiring | sirens on; the call line tween uses `autoRound: false`; the header trigger (start 40) and the sticky trigger (start = the hero's fresh end) toggle the data attributes |
| Lenis | used with a fine pointer, hooked into ScrollTrigger and the ticker, lag smoothing 0; never on touch; `anticipatePin` is 1 on touch and 0 under Lenis |
| Mid-visit switch | reduced on: `reduced` class, nothing new pinned, sirens off, Lenis destroyed. Reduced off: back to five more pins and sirens on |
| `initReduced` | header at > 40 px; sticky bar when the hero's call button rect bottom ≤ 0; undo removes the class and the listener |
| `pinShift` | five cases: fits; clears the bar; keeps the title; stage wins (kitchen, 375×667); hero title-first |
| `wheelTurn` | distance rolled along the road (2.2 stage widths) at the rendered wheel size |
| CSS guards | wheel `rotate(var(--wheel-rot, 0deg))` with fill-box; siren and idle keyframes, both off under reduced motion; door on `--door-open` and held at −100deg under `.reduced`; hearts on `--pop`; reduced van `left` and hidden hint; road layers `width: 200%` with `max-width: none`; `will-change` only on the three layers and the road van, across all four stylesheets |

### `tests/main.test.ts` (extended)

The scroll module is mocked:
- `initScroll` is not called before `document.fonts.ready` and is called once after it;
- each language click calls `refreshScroll`.

### RED → GREEN

1. `npx vitest run tests/motion.test.ts tests/main.test.ts`:
   - `Failed to resolve import "../src/scroll/motion"`;
   - `main.test: expected "vi.fn()" to be called 1 times, but got 0 times`.
2. After the implementation: 23/23, then the full suite 106/106. `tsc` flagged `TS2451 Cannot redeclare 'scroll'` (main.test is a script, which clashed with the global `scroll`); I renamed it to `story`.
3. Browser finding, road layers capped at one stage width:
   - RED: `expected '\n  width: 200%;\n' to match /max-width:\s*none/`;
   - fix → GREEN.
4. Browser finding, `anticipatePin` misfiring with Lenis-driven jumps. Re-running the new test against the old line gave `× pins on time under Lenis…`; with the fix → GREEN.
5. Hero title-first pin: RED `expected 161 to be 53` → GREEN.
6. Browser finding, call line snapping 1 → 0: RED `expected { Object (strokeDashoffset, duration) } to match object { strokeDashoffset: +0, …(1) }`. Added `autoRound: false` → GREEN.

### Final checks

| Command | Result |
| --- | --- |
| `npx vitest run` | 10 files, **110 tests passed**, no stderr or warnings |
| `npx tsc --noEmit` | clean |
| `npx prettier --check index.html vite.config.ts src tests` | clean |
| `npm run build` | OK |

## Visual verification

I built with `npm run build`, served with `vite preview --port 4174`, and checked in the Browser pane.

For saved shots and timing-sensitive checks I drove headless Chrome over CDP with a small script in the session scratchpad (not in the repo). Phones were emulated as touch devices (no Lenis); desktop ran with Lenis.

Shots are in `.superpowers/sdd/2026-10-20-chocobulance-landing/task-6-shots/`. `verify-results.json` holds all measurements.

**1280×800 and 390×844:**

| Scene | Shots | What they show |
| --- | --- | --- |
| hero | `hero-p0`, `hero-p60` | |
| kitchen | `kitchen-p8` | Dad half behind the casing |
| kitchen | `kitchen-p16` | Dad nearly gone |
| kitchen | `kitchen-p80` | hold |
| call | `call-p50` | 1 and 0 lit |
| call | `call-p72` | line half drawn |
| call | `call-p97` | all three digits lit, line drawn, bubble out |
| road | `road-p15`, `road-p50`, `road-p85` | layers offset, sky moving through sunrise to day |
| road | `road-van-closeup-p30` | wheels rotated about their axles |
| door | `door-p20` | door half open |
| door | `door-p65` | hearts popping |
| door | `door-p97` | price tag in place |

Also captured:
- **375×667:** `hero-p50` (title-first), `kitchen-p50`, `call-p97`, `road-p50`, `door-p97`.
- **Reduced motion** at 390×844 and 1280×800: `reduced-*-{hero,kitchen,call,road,door}`, plus `reduced-390x844-road-above-bar` (the parked van in view above the sticky bar).
- **Mid-visit switch:** `switch-390x844-to-reduced`.

Checks:
- **Wheels turn about their axles.** The wheel box's centre stays at a fixed offset from the van's box at p = 0, 0.3, 0.6 and 1:
  - 390 px: (42.18, 70.07) rear and (129.41, 70.07) front;
  - 1280 px: (53.49, 88.85) and (164.1, 88.85);
  - 375 px: also constant.

  Only the box width changes, as the spokes turn.
- **The near layer never shows its edge.** Its right edge stays beyond the stage's right edge through the whole pin: +39 px at 390, +38 at 375 and +64 at 1280 at the very end. Far and mid stay well beyond.
- **Header and sticky bar:**
  - y = 0: header `false`, bar `false`;
  - y = 60: header `true`;
  - hero end − 10: bar `false`;
  - hero end + 10: bar `true`.

  All at three sizes.
- **Breakpoint crossing** (390 → 1280 → 390) rebuilds the pins (950/1266/950/1899/950 ↔ 1200/1600/1200/2400/1200).
- **Language switch** to ru re-measures the pins.
- **No console errors or warnings.**
- **Mid-visit reduced-motion switch:** spacers 5 → 0 → 5 and sirens 2 → 0 → 2. Inline styles were removed from the door, hearts, bubble, digits, call line, road section and van. The door shows open. Small harmless leftovers are listed under Concerns.

## Files changed

- **New:** `src/scroll/motion.ts`, `src/scroll/timeline.ts`, `src/scroll/reduced.ts`, `src/scroll/smooth.ts`, `tests/motion.test.ts`.
- **Modified:**
  - `src/main.ts` (boot and refresh);
  - `src/styles/van.css`: wheel `--wheel-rot` transform, siren pulse, van idle, reduced-motion off switch, comment;
  - `src/styles/scenes.css`:
    - door and hearts on custom properties;
    - `will-change`;
    - `.reduced` still frame;
    - **`max-width: none` on the road layers**;
    - badge comment;
  - `tests/main.test.ts`.

## Self-review findings, fixed before reporting

1. **Road layers were never 200 % wide.** `base.css` gives every `svg` `max-width: 100%`, so Task 5's `width: 200%` was silently capped to one stage width. At rest this looks identical, so it went unseen. Once the layers moved, the near layer's edge showed mid-drive (the road ended halfway across the card). Fixed with `max-width: none` and a guard test.
2. **The call line didn't draw.** GSAP auto-rounds px CSS values, so the 0–1 path-unit offset snapped from 1 to 0 at about 73 %. Fixed with `autoRound: false` and a test.
3. **`anticipatePin` misfired under Lenis.** Twice I caught the road pin not engaged after a programmatic jump (the section scrolled past its pin) with `anticipatePin: 1` and Lenis active; once it pinned early at 6300 px. Lenis moves the scroll and the pins in the same frame, so anticipation is unnecessary there. It is now 0 under Lenis and 1 for native touch scrolling.
4. **The sky turned grey halfway.** A straight orange-to-blue blend in RGB goes khaki and grey around the middle of the road scene (`rgba(188,200,196)`). It now passes through sunrise at 40 %, using the `--cream` and `--sky-dawn-bottom` tokens, and every in-between colour stays clean.
5. **Hero on short phones.** The stage-first rule pushed the hero's headline under the header at 375×667. The hero now uses title-first: headline, call button and the big "105" stay in view.
6. **Stale comments** in `van.css`, `scenes.css` and `timeline.ts` (wheels, door, badge, Dad) updated to match the implementation.

## Deviations from the rulings (please confirm)

1. **Breakpoint queries.** I used `(max-width: 899.98px)` and `(min-width: 900px)` instead of `(max-width: 900px)` and `(min-width: 900.01px)`. They match the layout (`layout.css` and `scenes.css` switch at 900), so a 900 px screen gets the desktop layout and desktop distances.
2. **Wheels and sky.**
   - **Wheels:** a GSAP tween of `--wheel-rot` (0 → `wheelTurn(stageWidth, renderedVanWidth)`) replaces an `onUpdate` that computed it each frame. Both read the same rect on refresh.
   - **Why one tween is exact:** the van and the road are both linear over the same span, so the angle stays exactly proportional to the distance rolled.
   - **Distance:** it is measured **along the road**, i.e. the van's travel plus the near layer sliding back (2.2 stage widths). Using the van's translateX alone (1.3) would make the tyres skid against the moving lane marks.
   - **Same pattern elsewhere:** the door, the hearts and the sky are GSAP tweens of custom properties, not proxy objects with `onUpdate` writes. That way the `matchMedia` context reverts them, with no manual cleanup.
3. **Sky colours.** The sky goes dawn → sunrise (40 %) → day, not dawn → day straight (finding 4).
4. **Siren and bob timing.**
   - **Siren:** a 2 s cycle in the hero (the spec's "slowly pulsing", "2 s") and a 1.2 s blink on the road (your ruling).
   - **Idle bob:** 0 → −2 px through the individual `translate` property, never +2 px. The van lifts but never sinks into the road, and this leaves `transform` free.
5. **Reduced van position.** The van's **centre** is at 70 % of the card, not its left edge. A left edge at 70 % would cut off its nose: 70–114 % of the card on phones.
6. **The still frame is CSS keyed on `.reduced`**, not JS writes. `initReduced()` only adds the class and the header and sticky listener. In reduced mode the sticky bar shows once the hero's call button has scrolled off; with nothing pinned there is no hero trigger to use.
7. **Sticky bar trigger.** The sticky bar uses its own trigger, `start: () => hero.scrollTrigger.end`, `end: 'max'`, with `onToggle`, rather than `onLeave`/`onEnterBack` on the hero. It behaves the same and stays right after every refresh (tested and measured).
8. **Pins.** Story scenes rise so their stage clears the sticky bar; the hero is title-first. So on short phones (and on real phones whose browser chrome leaves ~660–750 px) a story scene's title is off-screen **during** its pin. Copy and stage are each fully visible, but not at the same moment: the copy on entry, the stage for the whole pin. At 390×844 both are visible during the pin, except in the kitchen.
9. **Cross-task CSS fix:** `max-width: none` on the road layers (Task 5's rule).

## Concerns

1. **The hero pin has little to show.** It holds for 150 % (112.5 % on phones), about 950–1200 px of scroll. Only the scroll hint fades and the numeral drifts 24 px. To a visitor this can feel stuck, close to the spec's "scroll hijacking" anti-goal. I recommend dropping the hero to about 50 % or not pinning it (`DISTANCE.hero`).
2. **Long holds after the beats.**
   - **Kitchen:** the casing covers Dad by about 30 %, leaving a ~890 px hold on phones (reading time for the card).
   - **Call:** about 5 % of its pin is spent after the bubble.
   - **Door:** about 5 % after the price tag.
   - **Road:** the van leaves the card at about 92 %.

   All of these are constants at the top of `timeline.ts`. Please judge the feel from the beat table.
3. **Performance is measured headless only.** Style recalc from the sky's inherited custom properties is the largest per-frame cost (~2.3 ms/frame in the "4×" run). If a real device struggles, swap the sky for a cross-faded day layer (opacity only). Lenis is isolated in `smooth.ts` if Task 7 decides to drop it.
4. **Bundle +137 kB raw / +51.5 kB gzip** (GSAP, ScrollTrigger, Lenis). Total JS is 71.5 kB gzip, within the 400 KB page budget, but Task 7 should keep an eye on it.
5. **Harmless leftovers after a mid-visit reduced-motion switch:**
   - the badge keeps GSAP's folded `transform: rotate(-4deg); rotate: none`, which looks identical;
   - `#dad-peek` keeps an identity `transform` attribute and `opacity: 1`.
6. **Lenis is decided when the context is built.** A change of pointer type without a width change (a mouse plugged into a tablet) does not rebuild it until the next breakpoint crossing.
7. **Not done:**
   - the spec's "small motion lines behind the van": there is no art for them;
   - `#tub-lid` is left static (restraint; the ruling made it optional).
8. **Commit trailer.** I used `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`, as your instruction and the plan (`docs/superpowers/plans/…`, line 24) require. The session that wrote the code was Claude Opus 5.5; amend if you want the trailer to name the actual model. The commit is not pushed.

---

## Fix report (review round 1)

**Commit:** `9843742 fix: chrome to the page bottom, gags played in time, desktop call action` (not pushed; `CLAUDE.md` and `.claude/launch.json` untouched).

**How I verified in the browser.** I built with `npm run build`, served it with `vite preview --port 4174`, and drove headless Chrome over CDP:
- 1280×800 with Lenis;
- 390×844 and 375×667 emulated as touch;
- a language-switch run with the cache disabled.

Results are in `task-6-shots/fix1-results.json`, and the shots are `task-6-shots/fix1-*.jpg`.

### Per item

**1 · C1: header and sticky bar at the bottom of the page** (`timeline.ts` `headerAndSticky`)
- **Change:** both flags now come from `self.scroll() > self.start`. They are written on every state change (`onUpdate`) and on every refresh (`onRefresh`), with `end: 'max'`.
- **Why not `onToggle` with `self.progress`?** A first attempt with `onToggle` and `end: 'max+=1'` failed in the browser, in two ways:
  - ScrollTrigger clamps `end` to the maximum scroll. On the hero-CTA trigger, `'max+=1'` even resolved to 854 px.
  - A jump from the bottom (progress 1, inactive) to the top (progress 0, inactive) never toggles.

  For non-scrubbed triggers, `onUpdate` fires on any change of state, including that jump (`ScrollTrigger.js`: `stateChanged = toggled || !!clipped !== !!prevProgress`).
- **Tests:** `tests/motion.test.ts`:
  - *keeps the header frosted and the call bar up to the very bottom of the page*: `onUpdate` at progress 1 keeps both `"true"`; at the top both are `"false"`.
  - *sets the header and the call bar on load, wherever the page opens*: `onRefresh`.
- **Browser, 390×844:**
  - Flag log: y = 100 → header on; y = 1000 → bar on; bottom (11 166) → both on; jump to 0 → both off; 1500 → both on; 0 → both off.
  - All three sizes: both flags `true` at the bottom (`fix1-*-page-bottom.jpg`).
  - Reload at the bottom (y = 6227): both `true`.
  - 1280: the header pill is hidden at the top and shown after scrolling.

**2 · Language switch before the Cyrillic subset loads** (`main.ts`)
- **Change:** on `langchange`, `refreshScroll()` runs at once (which also starts loading the new subset), then `void document.fonts?.ready.then(refreshScroll)`.
- **Test:** `tests/main.test.ts`: one refresh on the click, a second after `fonts.ready`; four in total after uz → ru → uz.
- **Browser** (390×844, cache disabled):
  - fonts loaded: 2 before, 4 after;
  - pin windows: identical across uz, ru immediately, ru after fonts, and a fresh `?lang=ru` load (`0,380 / 1224,760 / 2833,950 / 4627,1899 / 7370,950`).

**RULING: timing**
- `DISTANCE.hero` is 60 and `DISTANCE.kitchen` 120. Dad's exit spans 0–0.75 of the kitchen pin; he fades over 0.45–0.75.
- Pins in px:

  | Size | Hero | Kitchen | Call | Road | Door |
  | --- | --- | --- | --- | --- | --- |
  | 1280×800 | 0–480 | 1280–2240 | 3040–4240 | 5040–7440 | 8240–9440 |
  | 390×844 | 0–380 | 1277–2037 | 2886–3836 | 4680–6579 | 7423–8373 |
- **Tests:** desktop ends `+=60% +=120% +=150% +=300% +=150%`; narrow `+=45% +=90% +=112.5% +=225% +=112.5%`.

**3 · I3: gags played in time** (`timeline.ts`)
- **How it works:** a new exported `beat(tween, at)` plays a paused tween once the pin's progress passes `at`, and reverses it at `timeScale(1.6)` below it. It runs from each scene trigger's `onUpdate`, and from `onRefresh` with the progress computed from the scroll position.
- **Gags:**

  | Gag | From → to | Duration | Ease |
  | --- | --- | --- | --- |
  | Bubble | scale 0.6 → 1, opacity 0 → 1 | 0.32 s | `back.out(1.6)` |
  | Hearts | `--pop` 0.5 → 1, `--pop-o` 0 → 1 (CSS: `opacity: var(--pop-o, 1)`) | 0.28 s | `back.out(2)` |
  | Digits | opacity 0 → 1, scale 0.88 → 1 (origin 50% 50%; no `fill-box` on them) | 0.12 s | `power2.out` |
  | Badge | y 16 → 0, opacity 0 → 1 | 0.3 s | `expo.out` |
  | Dad's thumbs-up (my values, as a gag too) | opacity 0 → 1 | 0.2 s | `power2.out` |
- **Still scrubbed:** van, layers, sky, door swing, Dad's slide, numeral drift and call line.
- **Tests:**
  - `beat` unit test: one play on crossing, no repeats, reverse at 1.6;
  - call and door beat positions;
  - *never grows a gag from nothing*.
- **Browser** (bubble opacity sampled every 60 ms):
  - scrolled to 0.56 and held still: 0 → 0.72 → 1.00 within about 120–180 ms, then settles (not tied to scroll);
  - back to 0.50: down to 0 in about 190–250 ms;
  - shots `fix1-*-call-p20` (1 and 0 lit), `call-p60` (all keys, line, bubble), `door-p40` and `door-p62`.

**4 · I4: beat positions**
- **Call:** keys at 0.06, 0.16, 0.26; line scrubbed 0.32–0.48; bubble at 0.54.
- **Door:** swing scrubbed 0–0.30; hearts 0.36; thumbs-up 0.46; price tag 0.56.
- **Hero:** at progress ≥ 0.05 the siren gets `.siren--alert` (`animation-duration: 0.6s`, the 1.2 s road blink); below that it returns to the 2 s breath. The road siren always carries `.siren--alert`.
- **Tests:** *pulses both sirens… a slow breath parked, a blink once it moves*, plus the two beat-position tests.

**5 · I6: smooth once**
- **Change:** `Pace.scrub` is `true` under Lenis and `SCRUB_TOUCH = 0.4` for native scrolling.
- **Tests:** Lenis → `[true ×5]`; desktop without a fine pointer → `[0.4 ×5]`.

**6 · I1: desktop call action**
- **Header pill:**
  - **Markup:** `<a class="cta cta--compact" href="tel:105" data-cta data-i18n="sticky.cta">` between `.brand` and `.lang`.
  - **Style:** `display: none` below 900 px. From 900 px: inline-flex, min-height 44 px, padding `0 var(--s2)`, 1rem, pill radius, handset icon kept.
  - **Visibility:** hidden (opacity 0, `translate 0 -4px`, `visibility: hidden`) while `.header[data-scrolled='false']`, with a 200 ms `cubic-bezier(0.23,1,0.32,1)` transition. The transition is off under reduced motion.
- **Under the How steps:** `<a class="cta how__cta" href="tel:105" data-cta data-i18n="hero.cta">`, `margin-top: var(--s6)`, full width on phones and `fit-content` from 600 px.
- **Both stay plain-text anchors**, so `applyMode` turns them into pills in teaser and ended mode.
- **Tests:**
  - `tests/markup.test.ts`: 4 CTAs, all plain anchors; the header order is brand, pill, lang; the How CTA comes right after `ol.steps`;
  - CSS guard for the pill.
- **Browser:**
  - 1280: `display: flex`; hidden, opacity 0 at y = 0; visible, opacity 1 at y = 200.
  - Phones: `display: none`.
  - Shots: `fix1-1280x800-road-p50.jpg` (pill in the header), `fix1-390x844-how-cta.jpg`.

**7 · I2: desktop stage and seams (the cheaper variant, as allowed)**
- **(a) Wider stage.** For the story scenes only (`[data-scene]:not([data-scene='hero'])`), the grid columns are 5/12 for copy and 7/12 for art.
  - I kept the 16:9 stage: **733×412 at 1280×800** (was 640×360).
  - I did not do `aspect-ratio: auto; height: min(64svh, 40rem)`. The crop would change with every screen ratio, from about 1.07 at 1024×768 to 1.65 at 1920×1080. So the % anchors of `.bubble` and `.price-badge` (tail on the dispatcher's head, tag on the wall) would drift at most sizes, and placing them in drawing units would mean container-query rework of Task 5's overlays.
  - With 16:9 the crop is unchanged, so no re-tuning was needed.
  - The hero keeps its halves: its 96 px headline needs the 560 px column.
  - Road van 38 % from 900 px (the reduced still frame is updated to `calc(70% - 38% / 2)`).
  - Measured stage size: 450×254 at 900, 525×296 at 1024, 733×412 at 1280, 1053×592 at 1920.
  - No title, body or card overflows at 900, 1024, 1280 or 1920 in uz or ru.
  - The near layer's right edge stays beyond the stage edge through the whole drive (+73 px at the end at 1280).
- **(b) Background chain:**
  - kitchen `dawn-bottom 55% → cream`;
  - road `cream → road-sky-top 30% → road-sky-bottom`;
  - door `sky-day-bottom 55% → cream`.

  The hand-offs show no seam (`fix1-1280x800-handoff-*.jpg`). The flat bands are still there in height, now one continuous sheet.
- **Tests:** CSS guards for the column split and the gradient chain.

**8 · I5: kitchen on phones**
- **Below 900 px:** `#scene-kitchen .body { display: none }`; card `padding: var(--s2); gap: 4px`; list gap 4 px; items 1rem.
- **The kitchen now pins title first** (`pinShift(…, 'title')`, still measuring the sticky bar).
- **Result:**

  | Size | Kitchen height | Shift | h2 during the whole pin | Stage | Bar top |
  | --- | --- | --- | --- | --- | --- |
  | 390×844 | 850 (was 980) | 53 | 72–108 | 310–797 | 772 |
  | 375×667 | 830 | 53 | 72–108 | 308–777 | 595 |

  - At 390×844 the stage's bottom 25 px sits under the bar, about like call, road and door (19 px).
  - At 375×667, keeping the title costs the floor strip, but Dad, the card and the tub's top stay visible (`fix1-375x667-kitchen-p10.jpg`).
- **About the ~825 px target:** the scene keeps `min-height: 100svh`, so its height cannot drop below 844 at 390×844. The extra space would only move into the gap above the stage, so I kept the reviewed compaction and did not compact further.
- **Test:** CSS guard for the phone rules.

**9 · M1: sticky bar only once the hero CTA has gone**
- **Change:** the bar's trigger is the hero's `[data-cta]`, with `pinnedContainer: #hero`, `start: () => 'bottom top+=' + headerHeight`, `end: 'max'`, and the same `onUpdate`/`onRefresh` writer.
- **Test:** *shows the call bar once the hero call button has gone under the header*.
- **Browser,** sampled every 40 px over y = 0–1600: zero frames where the bar shows while the hero CTA is still below the header. First shown at y = 800 (390×844), 720 (375×667) and 1040 (1280; the bar is hidden on desktop anyway).

**10 · M4: road sky**
- **Change:** two new tokens, `--sky-sunrise-top: #ffd9a8` and `--sky-morning-top: #cfeaff`.
  - **Top stop:** dawn → sunrise (0.25) → morning (0.45) → day (1).
  - **Bottom stop:** dawn until 0.55, then → day.
  - Each leg is its own `fromTo`; only the first renders at once.
- **Measured stops:**

  | Progress | Top | Bottom |
  | --- | --- | --- |
  | 0.3 | `rgb(243,221,190)` | `#ffe2b8` |
  | 0.5 | `rgb(201,232,255)` | `#ffe2b8` |
  | 0.7 | `rgb(178,224,255)` | `rgb(247,233,208)` |

  Blue above and warm at the horizon, with no grey stop anywhere.
- **By eye:** `fix1-1280x800-road-p30/p50/p70.jpg` and `fix1-390x844-road-p30/p50/p70.jpg`.

### Reduced motion (unchanged behaviour, re-checked)

At 390×844 and 1280×800:
- `reduced` class on, 0 pin spacers;
- hearts opacity 1 at full scale; bubble opacity 1, untransformed; digits, price tag and thumbs-up opacity 1;
- the header pill is shown after scrolling on desktop;
- the kitchen body is hidden on phones (by the new phone rule).

Shot: `fix1-reduced-*-door.jpg`.

### Tests and commands

RED first, after rewriting the tests (`npx vitest run tests/motion.test.ts tests/main.test.ts tests/markup.test.ts`): 16 failed, including:
- `expected [ '+=150%', … ] to deeply equal [ '+=60%', … ]`;
- `call.onUpdate is not a function`;
- `beat is not a function`;
- `expected [ 0.8, … ] to deeply equal [ true, … ]`;
- `expected … to have a length of 4 but got 2`;
- `expected "vi.fn()" to be called 2 times, but got 1 times`.

The CSS guards then failed (6). The bottom-of-page case failed again during the `'max+=1'` attempt (`expected [ 'max', 'max' ]…`) and once more when I switched to `onUpdate` (`frost.onUpdate is not a function`), before passing.

| Command | Output |
| --- | --- |
| `npx vitest run tests/motion.test.ts tests/main.test.ts tests/markup.test.ts tests/scenes.test.ts` | `Test Files 4 passed (4)`, `Tests 75 passed (75)` |
| `npx vitest run` | `Test Files 10 passed (10)`, `Tests 121 passed (121)`, no stderr or warnings |
| `npx tsc --noEmit` | clean |
| `npx prettier --check index.html vite.config.ts src tests` | clean |
| `npm run build` | CSS 23.70 kB (gzip 5.95), JS 211.69 kB (gzip 71.99), built |

### Files changed in this round

- `index.html`: header pill and How CTA.
- `src/main.ts`: double refresh on `langchange`.
- `src/scroll/timeline.ts`:
  - tuning constants, `Pace.scrub`, `PinOptions` with `first`, `underStickyBar` and `beats`;
  - `beat()` and `gagTween()`;
  - hero alert, kitchen title-first, call, door and sky legs;
  - `headerAndSticky()`.
- `src/styles/layout.css`: `.cta--compact`, `.how__cta`, reduced-motion list, sticky-bar comment.
- `src/styles/scenes.css`: background chain, 7/12 story columns, `--pop-o`, kitchen phone rules, reduced van at 38 %.
- `src/styles/van.css`: `.siren--alert` (replaces `#scene-road .siren--on`), road van 38 % on desktop.
- `src/styles/tokens.css`: two sky stops.
- Tests: `tests/motion.test.ts`, `tests/main.test.ts`, `tests/markup.test.ts`.

### Concerns

1. **I2 was done in its cheaper variant** (16:9, 7/12 → 733×412), for the anchor-drift reason above. The flat bands between pinned scenes are seamless now but still about 194 px tall at 1280×800.
2. **Two red call buttons on phones.** The How-section CTA shows at the same time as the sticky bar, an intended consequence of item 6(b). Same on desktop: the header pill appears after 40 px while the hero CTA is still on screen, per the "hidden while not scrolled" rule.
3. **Kitchen on 375×667.** Keeping the title puts the bottom ~180 px of the stage (floor, the kid's legs, the tub's base) under the sticky bar for the whole pin.
4. **Perf numbers from the first round were not re-measured.** Stopping at a sunrise top stop adds no per-frame work, but the beats add `onUpdate` work. It is trivial: a comparison per gag per frame.
