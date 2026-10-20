# Design review after Task 6 (commit bc4946f)

Reviewer lenses: `apple-design` (HIG translated to the web) and `review-animations` (Emil Kowalski's craft bar, values from its STANDARDS.md). Read-only review: no source file was changed.

**Method.** `npm run build`, `vite preview --port 4175`, headless Chrome driven over CDP from a scratch script. Captured 1280×800, 1920×1080, 390×844 (touch, DPR 2) and 375×667, in Uzbek and Russian (`?lang=ru`), with `prefers-reduced-motion` on and off, and with `prefers-color-scheme` light and dark. Pin windows were read from the live `.pin-spacer`s. Header and sticky-bar flags were read at each stop. Lenis and scrub lag were measured with real wheel events.

Evidence shots: `design-review-shots/` next to this file.

**Not verified:**
- iOS Safari: the door's `perspective() rotateY()` on an SVG `<g>`, and the ʻ glyph fallback.
- Real-device frame rate.
- Tablets at 600–899 px.

Known items (hero/kitchen pin lengths, the ʻ glyph, the placeholder phone, socials and hours, the Task 7 a11y list) are not re-reported.

---

## 1. Verdict

The page has a real point of view: paper-cut Tashkent at sunrise, a parked ambulance, a red "105". Its motion is technically disciplined: transform and opacity only, a complete reduced-motion branch, and wheels that roll by true distance. What keeps it from Apple-grade is the frame around the story:
- the call action vanishes at the bottom of the page, and on desktop after the hero;
- on desktop the scenes are small postcards separated by empty colour bands;
- the gags (bubble, hearts, Dad, price tag) are scrubbed rather than played, so the humour lands small, late or half-finished.

**Count:** Critical 1 · Important 6 · Minor 12.

---

## 2. Findings, ranked

### Critical

#### C1. The sticky call bar disappears and the header un-frosts at the bottom of the page

- **Where:** `src/scroll/timeline.ts:298-308` (`headerAndSticky`). Screen: the last scroll position, at every size with motion on.
- **What:** both triggers use `end: 'max'` with `onToggle: (self) => setFlag(..., self.isActive)`. ScrollTrigger sets `isActive = clipped > 0 && clipped < 1` (`ScrollTrigger.js:2295`), so at max scroll, progress is 1 and both flags flip off. Measured:
  - At 390×844, `scrollY = 12268` (max): `sticky = false`, `header = false`. The call bar slides away exactly when the visitor has read the FAQ and the footer (`design-review-shots/390x844-page-bottom-no-sticky-bar.jpg`).
  - At 1280×800 the header goes transparent, and "Chocobulance · 105" sits on top of the first FAQ rule (`1280x800-page-bottom-header-unfrosted.jpg`).
  - The reduced-motion branch does not have this bug: it uses a scroll listener.
- **Why:**
  - It breaks the spec's anti-goal "phone number … not tappable".
  - `buttons.md › Style`: "use a button that has a prominent visual style for the most likely action in a view."
  - `color.md`: "make sure its default or resting state … maintains clear legibility". Here, header text sits over content with no material behind it.
- **Fix:** key both flags off progress, not `isActive`:
  ```ts
  onToggle: (self) => setFlag(header, 'scrolled', self.progress > 0),
  // and
  onToggle: (self) => setFlag(sticky, 'visible', self.progress > 0),
  ```
  `onToggle` fires on leave with `progress === 1`, and on leave-back with `0`. Alternative: `end: () => ScrollTrigger.maxScroll(window) + 1`. Add a test: at `progress 1` both flags stay `"true"`.

### Important

#### I1. Desktop has no call action for about 10 screens after the hero

- **Where:**
  - `src/styles/layout.css:353-358` hides `.sticky-cta` at ≥ 900 px. Its comment says "the hero call-to-action is always in reach", which is not true.
  - `index.html:115-211`: how, coverage, faq and footer contain no `tel:` link.
- **What:** at 1280×800, from `scrollY ≈ 900` to the end of the page (13 270 px), the only path to the phone number is scrolling back to the top. The spec (§4.1, sticky-cta row) says "fixed bottom (mobile), **inline (desktop)**". The inline desktop variant was never built. Desktop traffic is real here: the PR article, and blogger links opened on laptops.
- **Why:** `buttons.md › Style` (one prominent action per view); `branding.md`: "use it intentionally for primary actions".
- **Fix:** two small pieces.
  1. **Header pill, ≥ 900 px.** Add `<a class="cta cta--compact" data-cta href="tel:105" data-i18n="sticky.cta">` between `.brand` and `.lang`. Hide it while `.header[data-scrolled='false']`; show it with an opacity transition (200 ms, `cubic-bezier(0.23,1,0.32,1)`).
     - Style: `min-height: 44px; padding: 0 var(--s2); font-size: 1rem; border-radius: 999px`, keeping the handset icon.
     - `applyMode` already handles every `[data-cta]`, so teaser and ended work for free.
  2. **One CTA under the How steps, all widths.** Use the same `.cta[data-cta]` with `margin-top: var(--s6)`. Step 1 says "dial 105" with nothing to tap.

#### I2. Desktop: the story is a 640×360 postcard in an 800-px screen, with empty colour bands between scenes

- **Where:**
  - `src/styles/scenes.css:87-101`: stage at 16:9 inside `grid-column: 3 / -1`.
  - `src/styles/layout.css:398-420`: copy and stage are half the container each.
  - `src/styles/scenes.css:9-31`: a different flat background per scene.
  - Screens: every hand-off between pins at 1280×800, at `scrollY` 1600, 4000, 6000, 9200 and 11200.
- **What:**
  - At 1280×800 the stage is 640×360 at y 220-580, which is 36% of the screen area.
  - Each pinned scene is 100 svh, so every hand-off scrolls a full screen: the outgoing scene's 220-px bottom band, then the incoming scene's 220-px top band, about 440 px of flat colour.
  - Between kitchen (`#FFE2B8`) and call (cream), and between call (cream) and road (`#FFB86B`), a hard horizontal seam crosses the screen (`1280x800-band-*.jpg`).
  - At 1920×1080 the band is about 540 px (`1920x1080-band-kitchen-to-call.jpg`).
  - The same smallness shrinks the protagonists: the road van is about 218 px wide (34% of the card), Dad's peeking face about 40 px, and the heart eyes about 10 px. The road is the spec's "hero moment" (`1280x800-road-p50-small-van-grey-sky.jpg`).
- **Why:**
  - `layout.md › Visual hierarchy`: "Order content by relative importance". The art is the content here, and it gets a third of the screen.
  - `design-principles.md`, Craft.
  - A cinematic page should never show a frame of nothing. The bands read as loading gaps, not as pacing.
- **Fix:** two parts. The second is cheap.
  1. **Bigger stage on desktop.**
     ```css
     @media (min-width: 900px) {
       .scene { grid-template-columns:
           minmax(max(var(--gutter), env(safe-area-inset-left, 0px)), 1fr)
           minmax(0, calc(var(--container) * 5 / 12))
           minmax(0, calc(var(--container) * 7 / 12))
           minmax(var(--gutter), 1fr); }
       .scene__stage, .scene__overlay { aspect-ratio: auto; height: min(64svh, 40rem); }
       #scene-road .van { width: 38%; }
     }
     ```
     - At 1280×800 this gives a stage of about 733×512 (+42% height). The `slice` art crops to x ≈ 42-758 of 800, so the 200-600 story crop stays intact.
     - Road layers: visible units 0-1288 of 1600 against a maximum travel window of 580-1224, so it is still safe.
     - Re-tune the desktop `%` anchors of `.bubble` and `.price-badge` (`scenes.css:300-306, 315-331`), because the crop changes.
     - If re-tuning is too costly, keep 16:9 and only widen the stage column to 7/12. That gives 733×412.
  2. **No seams.** Chain the scene backgrounds so each one ends in the next one's start colour:
     ```css
     [data-scene='kitchen'] { background: linear-gradient(180deg, var(--sky-dawn-bottom) 55%, var(--cream)); }
     [data-scene='road'] { background: linear-gradient(180deg, var(--cream), var(--road-sky-top) 30%, var(--road-sky-bottom)); }
     [data-scene='door'] { background: linear-gradient(180deg, var(--sky-day-bottom) 55%, var(--cream)); }
     ```
     Then every hand-off is one continuous paper sheet.
  3. **Optional, later.** A "deck" hand-off: `pinSpacing: false` on scene N, so scene N+1's card slides over it. This removes the bands entirely, but it changes pin math, so treat it as its own task.

#### I3. Discrete gags are scrubbed, and two grow from nothing

- **Where:** `src/scroll/timeline.ts`:
  - `182-189`: digits;
  - `198-204`: bubble, `scale: 0 → 1`, `back.out(1.4)`;
  - `270-275`: hearts, `--pop 0 → 1`, `back.out(1.4)`;
  - `277-282`: Dad's thumbs-up;
  - `285-290`: price badge.
- **What:**
  - **Two escalation triggers at once.** The bubble and the hearts start at `scale(0)`. And a `back.out` tied to scroll position freezes mid-overshoot whenever the visitor stops scrolling inside its 0.1 window (about 120 px on desktop): the bubble or the hearts rest at about 1.08×, which looks like a bug.
  - **Scrub makes the pop's speed the visitor's scroll speed.** A slow reader gets a slow-motion pop; a flick skips it.
  - These are state changes (answered, delighted, priced), not continuous motion.
- **Why:** `review-animations` standard 5 ("Never `scale(0)`. Start from `scale(0.9–0.97)` + opacity"); standard 6 (interruptible); STANDARDS › Springs ("Keep bounce subtle"). `motion.md › Providing feedback`: "Aim for brevity and precision."
- **Fix:** keep continuous motion scrubbed: van, layers, sky, door swing, Dad's slide, numeral drift. Play the discrete beats in time, triggered at a pin position, and reverse them when the visitor scrolls back:
  ```ts
  /** Plays `tween` when the pin passes `at`, reverses it below; returns the onUpdate piece. */
  function beat(tween: gsap.core.Tween, at: number) {
    let on = false;
    return (p: number) => {
      if ((p >= at) !== on) {
        on = !on;
        on ? tween.timeScale(1).play() : tween.timeScale(1.6).reverse();
      }
    };
  }
  // call scene
  const pop = gsap.fromTo('#bubble', { scale: 0.6, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.32, ease: 'back.out(1.6)', paused: true });
  // hearts: CSS `transform: scale(var(--pop,1)); opacity: var(--pop-o,1)`;
  //   tween --pop 0.5 -> 1 and --pop-o 0 -> 1, 0.28 s, 'back.out(2)'
  // digits: opacity 0 -> 1 and scale 0.88 -> 1, 0.12 s, 'power2.out' (a key press)
  // badge: y 16 -> 0, opacity 0 -> 1, 0.3 s, ease 'expo.out' (≈ cubic-bezier(0.23,1,0.32,1))
  ```
  - Wire them through each scene's `scrollTrigger.onUpdate` (`self.progress`).
  - Exits run 1.6× faster: asymmetric, where the system responds.
  - Under reduced motion nothing changes; every part is already drawn in its final state.

#### I4. Beat pacing: dead scroll at pin start, payoffs at the very end

- **Where:** `timeline.ts:177-206` (call) and `257-292` (door). Pin windows: call 4400-5600 and door 9600-10800 at 1280×800.
- **What:**
  - **Call.** Nothing changes for the first 20% of the pin: 240 px on desktop, 190 px on phones. After 800 px of free hand-off scroll, the page then seems to stop. The three digits are then spread 240 px apart.
  - **Door.** The price tag, the scene's payoff and the only price in the story, arrives at 0.85-0.95. That leaves 60 px of hold. With scrub lag it is still settling when the pin releases.
  - **Hero.** Whatever its new length, its pin changes only the numeral (24 px) and the hint fade. A pinned screen where nothing visibly responds reads as a frozen page.
- **Why:**
  - `feedback.md`: people need to know their input registered.
  - `motion.md › Providing feedback`: brevity and precision.
  - Pacing rule for scrollytelling: respond within the first ~10% of a pin, pay off by ~65%, hold the last ~30% to read.
- **Fix:** new beat positions, and they suit the time-based pops from I3.
  - **Call:** digits at 0.06 / 0.16 / 0.26; line 0.32-0.48; bubble at 0.54; hold.
  - **Door:** door 0-0.3; hearts 0.36; Dad 0.46; badge 0.56; hold 0.44.
  - **Hero (at its new 60%):** one visible beat in the first 10%. For example, the siren switches from its 2 s breath to the 1.2 s road blink, and the numeral drifts as now. Or unpin the hero and run the numeral parallax on an unpinned scrubbed trigger.

#### I5. Phones: the kitchen joke and its caption are never on screen together

- **Where:** `#scene-kitchen` below 900 px. `pinShift` "stage first" (`timeline.ts:81-89`); `index.html:60-73`.
- **What:**
  - At 390×844 the kitchen is 980 px tall, so it pins with a 208 px shift. "Dadam yeb qoʻydilar." sits above the screen for the whole pin, while Dad slides guiltily away (probe at `scrollY` 2129 and 2635: no h2 in view; `390x844-kitchen-pin-title-offscreen.jpg`).
  - At 375×667 the shift is 365.
  - The setup (title) and the punchline (Dad caught) are split across two moments. Phones carry most of the traffic.
- **Why:**
  - `layout.md › Visual hierarchy`, grouping related items.
  - Spec §2: "The joke explained in paragraphs instead of shown". Here the joke is shown without its line.
- **Fix:** make the kitchen fit, so `pinShift` keeps the title. At 390×844 that means height ≤ 844 − 72 + 53 ≈ 825 px.
  ```css
  @media (max-width: 899.98px) {
    #scene-kitchen .body { display: none; }        /* the card says it, funnier */
    #scene-kitchen .card { padding: var(--s2); gap: 4px; }
    #scene-kitchen .card__list { gap: 4px; }
    #scene-kitchen .card__list li { font-size: 1rem; }
  }
  ```
  This saves about 160 px. Re-run the Task 6 pin table to confirm the title stays at 72-144 during the pin.

#### I6. Desktop scrubbing is double-smoothed: Lenis plus `scrub: 0.8`

- **Where:** `timeline.ts:29` (`SCRUB = 0.8`, used for all pins) and `src/scroll/smooth.ts:17` (`new Lenis()`, default lerp 0.1).
- **What:** measured at 1280×800 in the road pin, with four 100-px wheel ticks:
  - Lenis scroll: 50% / 90% / 98% at **181 / 448 / 714 ms**;
  - van `x`: **315 / 631 / 915 ms**.
  - The story trails the hand by about 0.2 s beyond the already-smoothed scroll and keeps drifting for almost a second. It feels floaty, the opposite of the precise "paper" world.
- **Why:**
  - `accessibility.md` (motion): "Tracking animations directly with people's gestures".
  - `motion.md`: "realistic feedback motion that follows people's gestures".
  - `review-animations` standard 10 (cohesion).
- **Fix:** smooth once.
  ```ts
  const scrub = stopSmoothScroll ? true : 0.4; // Lenis already eases wheel input; touch gets a light catch-up
  ```
  Pass it through `Pace`. `SCRUB` becomes the touch-only value.

### Minor

#### M1. Two identical red call buttons on one phone screen

- **Where:** `timeline.ts:304-308`. 390×844, `scrollY ≈ 950-1380`.
- **What:** the bar appears when the hero pin ends, while the hero CTA is still fully in view (measured at `scrollY` 1050: hero CTA at 318-374 with the bar shown; `390x844-two-red-ctas.jpg`). The reduced branch already uses the better rule (`reduced.ts:34`).
- **Fix:**
  ```ts
  ScrollTrigger.create({
    trigger: heroCta,
    pinnedContainer: hero,
    start: 'bottom top+=64',
    end: 'max',
    onToggle: (s) => setFlag(sticky, 'visible', s.progress > 0),
  });
  ```

#### M2. Short phones: a sliced line of body copy sits under the header for whole pins

- **Where:** 375×667, call, road and door pins (shift 187). `375x667-ru-road-pin-sliced-copy.jpg`.
- **What:** the last body line is half under the frosted header for 750-1500 px of scroll. It looks unfinished.
- **Fix:**
  - In `pinShift`'s stage-first branch, when the cut lands inside the copy block, snap the shift to `copyBottom − header` if that costs the stage ≤ 48 px under the bar.
  - Otherwise add a scrubbed `tl.to(copy, { autoAlpha: 0, duration: 0.05 }, 0)` when `shift > titleRoom`.

#### M3. The idle loops are physically off and never stop

- **Where:** `src/styles/van.css:66-94`; `timeline.ts:326-329`.
- **What:**
  - `van-idle` translates the whole SVG, so the wheels and the shadow lift 2 px off the road.
  - The hero siren, the bob and the road siren run from load to unload, including when their scenes are off-screen.
- **Why:** `review-animations` standard 5 (physical correctness); spec §2 anti-goal "motion that keeps playing without scrolling".
- **Fix:**
  ```css
  [data-van='hero'] [id^='van-body'] {
    transform-box: fill-box;
    animation: van-idle 1.6s cubic-bezier(0.37, 0, 0.63, 1) infinite alternate;
  }
  ```
  This drops the rule on `[data-van='hero']`; wheels and shadow stay planted. Then gate the loops per scene: `ScrollTrigger.create({ trigger: scene, start: 'top bottom', end: 'bottom top', toggleClass: { targets: siren, className: 'siren--on' } })`, and the same for an `.is-idling` class on the hero van.

#### M4. The road sky goes grey mid-drive

- **Where:** `timeline.ts:241-253`. Road pin 40-70%.
- **What:** the second leg interpolates cream to `#8FD3FF`. At 50% the top stop is about `#ECF0EF`, which reads as overcast rather than morning (`1280x800-road-p50-small-van-grey-sky.jpg`).
- **Fix:**
  - Route through saturated pale stops: 0-0.35 to (`#FFD6A3`, `#FFEBD1`), then 0.35-1 to (`#A6DBFF`, `--sky-day-bottom`).
  - Better: paint a day-sky layer over the dawn one and scrub its opacity 0 to 1. Opacity only; this also removes the inherited custom-property style recalc that Task 6 measured as the largest per-frame cost.

#### M5. Chrome transitions: the header frost pops, and the sticky bar is symmetric

- **Where:** `layout.css:147-163` and `326-351`.
- **What:**
  - Only `background-color` transitions. `backdrop-filter` and the hairline switch instantly.
  - The bar uses `ease-out` 300 ms both ways.
- **Fix:**
  - Put the frost on `.header::before` (`inset: 0; z-index: -1`) and transition `opacity 200ms cubic-bezier(0.23,1,0.32,1)`.
  - Bar enter: `transform 320ms cubic-bezier(0.32,0.72,0,1)`. Exit: `200ms cubic-bezier(0.23,1,0.32,1)`. Opacity 160 ms.
  - This follows STANDARDS › Easing and Asymmetric timing.

#### M6. Dad's thumbs-up is a plain fade, and he is clipped on phones

- **Where:** `timeline.ts:277-282`; `src/scenes/door.svg` `#dad-thumb`.
- **What:**
  - The callback to the kitchen (Dad slides out guiltily, then slides back in approving) is lost to a 0.08 opacity fade.
  - At 390×844 his face is cut by the stage's right edge (`390x844-door-p97-dad-clipped.jpg`).
- **Fix:**
  - Use a time-based beat (I3): `x: 60 → 0`, `opacity: 0 → 1`, 0.28 s, `back.out(1.4)`, plus the thumb `rotate: -20 → 0` about the wrist.
  - Move `#dad-thumb` about 24 drawing units left so it sits inside the 4:5 crop (x ≤ 600).

#### M7. The number is never dialled on screen

- **Where:** `src/scenes/call.svg`, the phone display (shows "• • •").
- **What:** the scene is about dialling 105, but the display never shows it.
- **Fix:** put three digit glyphs in the display and reveal "1", "10", "105" on the same beats as the keys.
  - Use `<text>` with `font-family: var(--font-display)`; this is the campaign hook, not prose.
  - Or use paths, if Safari's SVG font fallback misbehaves.

#### M8. The spec's speed lines behind the road van are missing

- **Where:** spec §5.6 ("small motion lines behind the van at speed"); `src/van/van.svg`.
- **Fix:**
  - Add `g#van-speed` (three rounded 2-unit strokes behind the rear bumper, `opacity: 0`).
  - In the road trigger's `onUpdate`, drive its opacity from `Math.min(1, Math.abs(self.getVelocity()) / 2500)` through `gsap.quickTo(speed, 'opacity', { duration: 0.2 })`.
  - The lines appear only when the visitor scrolls fast: motion that answers the hand. Skip under reduced motion; that is automatic.

#### M9. Dark mode: muddy header and a hard light-to-night cut

- **Where:** `layout.css:698-720`. Shot: `1280x800-dark-mode-header-over-night.jpg`.
- **What:**
  - The frosted header stays cream-tinted over the night sections, rendering about `#C0B9B7`.
  - Door (`#E6F6FF`) cuts straight to `#1E1B2E`.
- **Why:** `dark-mode.md`: "Ensure that your app looks good in both appearance modes."
- **Fix:**
  - Set `data-surface='night'` on the header while `#how` (start `'top 64px'`) to the footer is under it.
  - In dark mode: `background: color-mix(in srgb, var(--night) 72%, transparent)`, with cream text and segmented control.
  - Add `#how { background: linear-gradient(180deg, var(--sky-day-bottom), var(--night) 96px); }` in dark mode.

#### M10. The hero CTA doesn't scale with the hero

- **Where:** `layout.css:219-243`. Shot: `1920x1080-hero-cta-scale.jpg`.
- **What:** at 1920 the button label is 18 px, under a 96 px headline and a 200 px numeral. The primary action is the visually weakest item in the block.
- **Fix:**
  ```css
  .hero__actions .cta {
    min-height: clamp(56px, 3rem + 1vw, 64px);
    font-size: clamp(1.125rem, 1rem + 0.35vw, 1.375rem);
  }
  ```

#### M11. "105" appears four times in the first screen

- **Where:** header brand, hero accent line, CTA, numeral.
- **Why:** `branding.md`: "Resist the temptation to display your logo throughout … unless it's essential". The numeral is the signature; the others dilute it.
- **Fix:** drop " · 105" from `header.brand` (or show it only once the hero has scrolled away). Keep the CTA and the accent line; they are campaign copy.

#### M12. The Russian eyebrow wraps into a two-line lozenge on small phones

- **Where:** `layout.css:78-89`, 375 px in RU.
- **Fix:** `border-radius: var(--r-m)` instead of `999px`, plus `text-wrap: balance`. Or trim the eyebrow on screens under 400 px with a short key, e.g. "Chococream — 20 лет".

---

## 3. Do not change (protect these)

- **The art direction and palette.** Paper-cut Tashkent at sunrise, flat two-stop gradients, red reserved for the tub, the siren, the CTA and the price. It is specific to this product and passes the "would this fit any other brand?" test.
- **The layout contract.** Copy left and art right on desktop; copy top and art bottom on phones. The copy never moves while the art moves. Text stays still and readable; only the picture performs.
- **The phone hero.** The CTA is above the fold even at 375×667 (401-457 px in RU). The 105 numeral and the parked van form the signature; the van sits on the road with the hint written on the asphalt.
- **Real text for the copy that belongs to the art.** The bubble, the price tag and the coverage labels are HTML over SVG: translatable, selectable, read by screen readers. Keep the price tag's `rotate` tilt and its `min-content` width.
- **Motion hygiene.** Only `transform` and `opacity` animate. Wheels turn through a custom property with a `fill-box` pivot, by distance actually rolled (`wheelTurn`). `will-change` applies only to moving layers and only outside `.reduced`.
- **The reduced-motion branch is complete.**
  - No pins, scrub, Lenis, siren or bob.
  - The door is held open, Dad is left peeking (the funnier still frame), and the road van is parked mid-card.
  - The sticky bar follows the hero CTA's real position.
  - Switching it on mid-visit reverts cleanly through `gsap.matchMedia`.
- **`pinShift`'s idea.** Story scenes keep their stage above the sticky bar, and the hero keeps its headline. Only the M2 edge case needs tuning.
- **Spatial continuity.** The van exits the road card on the right and the door scene follows.
- **The kitchen gag's mechanics.** Dad tucks behind the casing and fades, so no sliver lingers at its edge.
- **Controls and contrast.**
  - 56-px CTAs and 44-px language buttons.
  - `:active` `scale(0.98)` at 120 ms; hover gated behind `(hover: hover)`.
  - Native `<details>` FAQ with 64-px rows.
  - Safe-area padding on the header and the bar; footer padding reserved for the bar.
  - White on red 4.7:1 only on the 900-weight CTA label; `--red-deep` on white chips 6.9:1.
- **The siren as a soft opacity breath and blink** (about 0.5-0.8 Hz). Don't make it a strobe.
