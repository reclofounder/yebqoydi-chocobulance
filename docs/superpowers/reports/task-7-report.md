# Task 7 report: mobile-native, performance and accessibility pass

Commit: `ac5260b chore: mobile-native, a11y and performance pass` (on `main`, not pushed; `CLAUDE.md` and
`.claude/launch.json` left alone). Status: DONE_WITH_CONCERNS (concerns at the end; none block).

## 1. What changed, per item

### Brief steps
| Step | Change |
| --- | --- |
| Skip link | `<a class="skip-link" href="#main" data-i18n="a11y.skip">` first in `<body>`; `<main id="main" tabindex="-1">` (Safari keeps focus at the top without it); `a11y.skip` in uz and ru. Clipped away until focused, inner cream ring when focused (`base.css`). |
| `aria-pressed` | `applyI18n` sets it on every `[data-lang]` (so on load and on every `setLang`); markup also ships `true`/`false` for uz/ru; the active look is now `.lang__btn[aria-pressed='true']` (one source of truth, replaces `:root[lang=...]`). Language buttons also carry `lang="uz"` / `lang="ru"`. |
| `theme-color` | `<meta name="theme-color" content="#FFF6EC">`; a test pins it to `--cream` in `tokens.css`. |
| `svg[role=img]` labels | Both vans carry `aria-label` (mountVan + i18n); a test mounts the page in uz and ru and asserts every `svg[role=img]` is named and every other svg is `aria-hidden="true"`. No change needed. |
| Tap and touch | `html { -webkit-tap-highlight-color: transparent }` once; `touch-action: manipulation` on `a, button, summary, [role=button]` in `base.css` (per-rule copies on `.cta`, `.lang__btn`, `summary` removed); `user-select: none` on `button`, `.cta`, `summary` (not on body, not on content). |
| `100svh` | The only `100vh` was the fallback line above `100svh` in `.scene`; removed (the grid rows and numeral already need `svh`, so the fallback saved nothing). A test forbids `100vh` in all four stylesheets. |
| `overscroll-behavior-y: none` | `html.lenis { ... }` only: Lenis puts `.lenis` on `<html>` while it smooths. Checked in Chrome: desktop computed `none`, touch emulation `auto`. A test fails if any other rule sets `overscroll-behavior`. |
| Focus | Global red ring kept. `.header :focus-visible` and `.cta:focus-visible` choco (red on the hero's orange top is 2.74:1), `.footer` and the dark-mode static sections cream (choco on night is 1.12:1), `summary:focus-visible` gets a radius and offset, `.skip-link` an inner cream ring. Tabbed through in Chrome in light and dark: computed outline colours as intended. Focused links and questions in `.section`/`.footer` get `scroll-margin` for the header (and the call bar on phones) so tabbing never lands under them. |
| No traps, toggle reachable | Tabbed the real page (1280x800 uz, 390x844 ru): skip link, brand, UZ, RU, hero call, ghost, call under the steps, 5 questions, (sticky call on phones), out of the page, back to the skip link. Header pill sits between brand and language after the hero call. No positive tabindex, no `autofocus`, no modal (test). |
| `build.target` | `es2020` in `vite.config.ts`. Note: Vite also lowers CSS to that target by default (`inset` became four longhands, `:is()` got `:-webkit-any` copies), so `cssTarget` keeps Vite's own CSS floor (`chrome111, edge111, firefox114, safari16.4, ios16.4`, what the stylesheet needs anyway for `svh` and `color-mix`). |
| 320 px Russian | See section 3. |
| Tests | `tests/a11y.test.ts` (new, 18 tests). |

### Carried items
1. **Two red calls.** (a) The hero-call ScrollTrigger (`headerAndSticky`) now also sets `data-cta-visible` on the header; the pill's CSS keys on that, not on `data-scrolled` (the frost). `initReduced` sets the same flag, and now uses "gone under the header" like the story (was "fully off screen": left a 64 px stretch with no call at all in the still-frame branch). (b) `watchInlineCta()` in `motion.ts`: an IntersectionObserver on `#how [data-cta]` (rootMargin excludes the header) sets `data-inline-cta` on `#sticky-cta` **and on the header**; CSS hides the bar and the pill while it is set. Decision: I hid the desktop pill too, otherwise 1280x800 still showed the pill beside the How call, and your self-review asks for no two red calls at either size. Works for pinned and still-frame branches, and after the state engine swaps the link for an inert span.
2. **Call keys.** `transformOrigin: '50% 50%'` is now in the from-values too. Measured in Chrome at rest: old build `matrix(1,0,0,1,-1.68,-1.68)`, new `matrix(1,0,0,1,0,0)`.
3. **`PAGE_END`** and its comment deleted.
4. **Siren.** I kept the two-speed beat (the design review asked for it) and changed *how* it switches: `setAlert()` in `timeline.ts` calls `animation.updatePlaybackRate(1 / 0.6)` instead of changing `animation-duration` (the `.siren--alert` CSS rule is gone; the class only records the state). Measured per frame around the toggle (390x844): old build opacity 0.964 -> 0.359 in one frame (jump of 0.57); new build is continuous, worst frame delta 0.032, `playbackRate` 1 <-> 1.667. Guarded with `getAnimations?.()` for jsdom.
5. **Kitchen paragraph.** On phones it is clipped to a pixel (same pattern as `.visually-hidden`) instead of `display: none`. Checked in Chrome's accessibility tree: the text is exposed. Layout unchanged (kitchen scene still 830 px at 375x667).
6. **M2, short phones.** The cut cannot be avoided by spacing: at 375x667 the stage alone is 469 px of the 531 px between header and call bar. So `pinShift` takes an optional `bands` list (every line of the copy as a line-height-tall band, plus the eyebrow chip and the kitchen card, measured at refresh by `copyBands`) and snaps the shift so the header's lower edge falls between lines: crossed lines go wholly under the header or wholly out from under it, whichever is nearer (at most about half a line, ~13 px of body). Verified in Chrome by scanning every 25-40 px of every pin for a text line cut by the header: before, 375x667 had cut lines for 775 px (call), 1525 px (road), 775 px (door) in uz and ru, 320x568 the same; after, none at 375x667 (uz, ru), 320x568 (ru), 360x640 (uz, ru). At 375x667 the call/road/door shift is 198.5 instead of 187, i.e. an 11.5 px cream strip above the call bar. Existing `pinShift` results are unchanged when no bands are given.

### Beyond the brief (found while measuring; please look at these)
- **CLS 5-8 during scrolling (pre-existing).** Measured at HEAD with real wheel and touch gestures and a `layout-shift` observer: every time ScrollTrigger pins or releases an `overflow: clip` scene Chrome reports a shift of about 1.0 (sources show the section going from a 0-height previous rect to 800 px), so a scroll-through counted **7.98** (1280x800 wheel) and **7.48** (390x844 touch). Lighthouse never scrolls, so it never saw it; CrUX would. Bisected with injected CSS: `overflow: visible` or `overflow: visible; clip-path: inset(0)` gives 0; `overflow: hidden|clip`, `contain`, `will-change`, `isolation` do not. Fix: `.scene` clips with `clip-path: inset(0)` instead of `overflow: clip`, and `main { overflow-x: clip }` stops any sideways spill from widening the page (nothing spills today; I tested without it). After: 0.000 over a full scroll-through at 1280x800 wheel, 390x844 touch (uz, ru), 375x667 touch. Horizontal overflow sweep (below) re-run on the final CSS.
- **Load-time CLS.** The first Lighthouse runs on this branch (before the font preload) had CLS 0.09 in 2 of 3 runs, cause "web font loaded" (the hero buttons move when Nunito replaces the fallback), and the same shift on `?lang=ru` every time. Fixes: `<link rel="preload" as="font" crossorigin>` for latin 800 and 900 (hrefs are rewritten by Vite to the hashed files); the Cyrillic 800/900 links ship as `rel="x-preload-ru"` and a 10-line inline script promotes them to `preload` only for `?lang=ru` or a stored `ru` (mirrors `getLang()`; tested by running the script text in jsdom). Chrome network log: uz fetches no Cyrillic, ru fetches both at ~20 ms.
- **Skeleton frame.** Unthrottled, Chrome painted the empty shell before the module ran and the copy then pushed the hero buttons down 269 px (CLS 0.086 on a fast connection). `<html data-booting>` + `html[data-booting] body { visibility: hidden }` keep it hidden; `main.ts` removes the attribute in a `finally`, so it is revealed even if a boot step throws (tested). Cost: first contentful paint is now the finished page (about 1.2 s under 4x CPU / Slow 4G CDP throttling) instead of the static brand text (0.63 s); LCP is unchanged (1.17 s before, 1.19 s after). Lighthouse FCP stays 1.2 s.
- `aria-hidden="false"` removed from the two `.scene__overlay` divs (a no-op flagged earlier); `tests/scenes.test.ts` now asserts the attribute is absent instead of `"false"`.

## 2. Performance numbers

Build (`npm run build`), baseline HEAD -> now:

| | before (9843742) | now |
| --- | --- | --- |
| JS | 211.69 kB, 71.99 kB gzip | 214.96 kB, **73.03 kB gzip** |
| CSS | 23.70 kB, 5.95 kB gzip | 25.06 kB, 6.17 kB gzip |
| index.html | 9.52 kB, 1.96 kB gzip | 11.11 kB, 2.52 kB gzip |

Fonts requested on first paint: uz = `nunito-latin-800` 16.5 kB + `nunito-latin-900` 16.7 kB (33 kB); ru adds `nunito-cyrillic-800` 8.5 kB + `-900` 8.6 kB (50.4 kB). latin-ext, cyrillic-ext and vietnamese are never fetched (U+02BB is in the latin subset). `dist` is 560 K on disk (all subsets and the legacy woff files, unused by modern browsers).

Lighthouse 13.5.0, `npx --yes lighthouse@latest http://localhost:4174/ --only-categories=performance --output=json --chrome-flags="--headless=new --no-sandbox"` against `vite preview` (4174 serves `dist`). Default mobile preset: 412x823 emulation, simulated Slow 4G (1.6 Mbps, 150 ms RTT), 4x CPU slowdown. Three runs each, identical to the digit:

| | Performance | FCP | LCP | TBT | CLS | Transferred |
| --- | --- | --- | --- | --- | --- | --- |
| uz | 100 | 1.2 s | **1.7 s** | 10 ms | **0** | **113.5 kB** (JS 70.8, fonts 33, CSS 6.3, doc 2.7) |
| `?lang=ru` | 99 | 1.2 s | 1.9 s | 10 ms | 0 | 130.8 kB |

Budget (<= 400 kB, LCP < 2.5 s, CLS < 0.05): met. Lenis stays (nothing needed dropping). Lighthouse is not in `package.json`; it ran through `npx`.

## 3. Viewport and 320 px checks (headless Chrome over CDP, built page)

- **Horizontal overflow.** 320x568, 360x780, 375x667, 390x844, 768x1024 (touch) and 1280x800 (wheel), each in uz and ru, `document.documentElement.scrollWidth` read every half viewport down the whole page: equal to the viewport width every time (12 of 12), on the final CSS.
- **320x568 ru:** `scrollWidth` 320; the headline wraps to 2 + 1 lines (44 px); hero call fully in view (425-481 of 568); the sticky bar is hidden for the whole hero pin and appears only once the headline has scrolled out (h1 bottom 283 at most while the bar would be at 496). Same read at 360x780 and 375x667 in both languages: no overlap.
- **Two red calls.** Counting call buttons that are on screen (not hidden, not under the header) at every 40-60 px of scroll: never more than one, never none. 390x844 uz/ru, 375x667 uz/ru, 320x568 ru: hero -> bar -> how -> bar. 1280x800 uz/ru: hero -> pill -> how -> pill. Reduced motion (1280x800 uz, 390x844 ru): same sequence.
- **Text under the header at 375x667** (and 320x568, 360x640): see carried item 6.
- **CLS while scrolling:** see "beyond the brief".

## 4. Tests and TDD evidence

`npx vitest run`: 11 files, **158 tests** pass (121 before); `tsc --noEmit` clean; `npm run format` clean; build ok.

- Written first, seen failing (23 red on the first run: skip link, theme-color, tap/touch/overscroll/100vh/focus CSS, aria-pressed, siren duration, kitchen clip, header pill flag, inline CTA, key origin, reduced flags), then implemented to green.
- Added after the browser measurements, so no separate red run; instead a mutation check: I reverted each of nine fixes one at a time (pinShift snap, key origin, header pill flag in timeline and in reduced, inline-CTA watch, `clip-path` back to `overflow: clip`, booting reveal, `aria-pressed`, siren playback rate) and the suite failed every time (9 of 9 killed). Files restored; 158 green.
- New or changed: `tests/a11y.test.ts` (new); `tests/i18n.test.ts` (aria-pressed); `tests/main.test.ts` (reveal, and reveal when a step throws); `tests/markup.test.ts` (data-booting, preloads, inline script in jsdom); `tests/motion.test.ts` (flags, inline CTA with a mocked IntersectionObserver, siren rate, key origin, `pinShift` with bands, CSS guards, adjusted kitchen/siren/pill assertions); `tests/scenes.test.ts` (overlay attribute).

## 5. Files changed (19)

`index.html`, `vite.config.ts`, `src/i18n.ts`, `src/i18n/uz.json`, `src/i18n/ru.json`, `src/main.ts`, `src/scroll/motion.ts`, `src/scroll/reduced.ts`, `src/scroll/timeline.ts`, `src/styles/base.css`, `src/styles/layout.css`, `src/styles/scenes.css`, `src/styles/van.css`, `tests/a11y.test.ts` (new), `tests/i18n.test.ts`, `tests/main.test.ts`, `tests/markup.test.ts`, `tests/motion.test.ts`, `tests/scenes.test.ts`.

## 6. Self-review findings (fixed before committing)

- Reduced-motion branch left a 64 px stretch with no call button (hero call under the header, bar not yet up): threshold now matches the story.
- First `pinShift` idea (snap down only) would have cut the van's wheels under the call bar on the road scene (15 px of clearance); settled on nearest edge, which here hid the line (11.5 px cream strip).
- Lighthouse looked clean on the first runs (CLS 0) and 0.09 on others; traced to font swap and then to the empty-shell frame, not left as luck.
- My first fast "CLS 14" scroll reading came from teleporting scrolls; re-measured with real gestures before concluding (7.5-8.0 at HEAD).

## 7. Concerns

1. **No real phone.** Everything above is headless Chrome with device metrics and touch emulation. Sticky hover, the tap flash, rubber-banding, safe areas and the keyboard cannot be confirmed without hardware (`mobile-native` rule 5); the CSS for them is in and unit-checked at source level.
2. **`rel="x-preload-ru"` flip** is verified in Chrome only. If another engine ignored the rel change, the only effect is the old Cyrillic swap shift for Russian visitors (CLS 0.086), nothing breaks.
3. **FCP semantics** moved from "static brand text at 0.63 s" to "finished page at ~1.2 s" because of the `data-booting` gate (LCP and Lighthouse unchanged). If you prefer the earlier first paint, remove the gate and accept ~0.09 CLS on fast connections.
4. `clip-path` instead of `overflow: clip` on the scenes: visually identical in every screenshot and overflow check, but it is a small change to a core rule; `main { overflow-x: clip }` is a safety net with no measurable effect today.
5. The call/road/door pins at 375x667 now leave an 11.5 px cream strip above the call bar (or, where the nearer edge is the other way, hide up to ~13 px of stage under it).
6. The header pill also hides while the How call is on screen (desktop); your ruling only asked for the phone bar.

Scratch scripts (CDP harness, sweeps, Lighthouse JSON) are in the session scratchpad under `t7/` and `lh/`; none are committed.

---

# Fix report: review of `ac5260b` (Important 1, Minor 2, Minor 3)

Commit: `85d5130 fix: boot gate fallbacks, whole-call inline CTA watch, selectable FAQ questions`.
Touched only: `index.html`, `src/styles/base.css`, `src/styles/layout.css`, `src/scroll/motion.ts`, `tests/markup.test.ts`, `tests/motion.test.ts`, `tests/a11y.test.ts`.

## What changed

**Important 1: the `data-booting` gate had no way out.**
- (a) `index.html`: `<noscript><style>html[data-booting] body{visibility:visible!important}</style></noscript>` in `<head>`. It needs `!important`. As first written (the plain `visibility:visible` you prescribed) it did nothing in the built page: Vite links the bundled stylesheet after the noscript style, so the equal-specificity `hidden` rule won on source order. I found that when the browser check below stayed hidden with scripting off, and fixed it.
- (b) `base.css`: `html[data-booting] body { visibility: hidden; animation: boot-reveal 0s 2.5s forwards; }` and `@keyframes boot-reveal { to { visibility: visible } }`. When `main.ts` finishes it removes the attribute, the rule stops matching, and the page appears at once as before.
- (c) Tests: `tests/markup.test.ts` "reveals the page without the script" pins the `<noscript>` rule (including `!important`) and, in `base.css`, the `boot-reveal 0s 2.5s forwards` animation and its keyframes. The existing `main.test.ts` "revealed even if a boot step throws" test is unchanged.

**Minor 2: the bar and pill hid on 1 px of the How call.** `watchInlineCta` (`motion.ts`) now uses `threshold: 1`, a root inset by the header at the top and by the bar at the bottom (`-64px 0px -72px 0px` on a phone, `-64px 0px 0px 0px` on desktop where the bar is `display: none`), and reads `intersectionRatio >= 1` (not `isIntersecting`, which is true for any overlap whatever the threshold). Added: the margins are measured again on `resize` and the observer is rebuilt only if they changed (a tablet turned past 900 px loses the bar), and `watchInlineCta` undoes its previous run so repeated `initScroll()` leaves one observer and one listener. `-0px` is written `0px`.

**Minor 3:** `user-select: none` removed from `.faq__item summary`. Buttons and `.cta` keep it; the root tap-highlight and `touch-action: manipulation` on `summary` stay. `a11y.test.ts` now asserts the summary rule has no `user-select`.

## Tests run

```
npx vitest run tests/main.test.ts tests/markup.test.ts tests/motion.test.ts tests/a11y.test.ts
 Test Files  4 passed (4)
      Tests  88 passed (88)
npx vitest run            (once, full)
 Test Files  11 passed (11)
      Tests  163 passed (163)          (158 before; +5)
npx tsc --noEmit                        -> No errors found
npx prettier --check index.html vite.config.ts src tests  -> all formatted
npm run build                           -> built in 77ms (JS 215.21 kB / 73.14 kB gzip, CSS 25.11 kB / 6.20 kB gzip)
```

Red first: the six new or changed tests failed before the change (noscript/animation, summary `user-select`, partial-ratio, threshold/margin, resize re-measure, one-watch). Mutation check afterwards, each reverted in turn, suite failed every time: noscript rule, `boot-reveal` animation, `threshold: 1`, the `intersectionRatio` check, the resize listener, `user-select` back on `summary` (6 of 6 killed); files restored, 163 green.

## Browser evidence (headless Chrome over CDP, built page, 390x844)

Boot gate, `data-booting` / body visibility / hero title characters at each mark after navigation:

| Case | 0.3-0.6 s | 1.5 s | 2.3 s | 2.9 s | 3-4 s |
| --- | --- | --- | --- | --- | --- |
| normal load | revealed, 20 chars (400 ms) | revealed | | | revealed |
| bundle blocked (`Network.setBlockedURLs`) | hidden | hidden | hidden | **visible** (empty shell, attribute still set) | visible |
| bundle throws on evaluation (response patched with `throw` first, i.e. a failing static import) | hidden | hidden | hidden | **visible** | visible |
| scripting disabled (`Emulation.setScriptExecutionDisabled`) | **visible at 300 ms** | visible | | | visible |

Before the `!important` fix the scripting-disabled row was hidden at 300 ms and 1 s and visible only at 3 s (the animation, not the noscript rule).

Usable call buttons (fully visible, clear of the header and of the bar's zone; the bar and the pill count when shown), counted at every 10 px of scroll with 480 ms settle:
- 390x844 uz, window 9000-10300 (the How call): `bar` until 9350, then `how` (wholly on screen), then `bar` again from 10000 as the call slides under the header (still 52 px showing). Exactly one at every stop, no gap on the way in, which is what the review asked for.
- 1280x800 uz, window 9800-11000: `pill` -> `how` at 10030 -> `pill` at 10710. Exactly one at every stop.
- 375x667 ru, window 7900-8900: `bar` -> `how` at 8190 -> `bar` at 8670. Exactly one at every stop.
- `getComputedStyle(summary).userSelect` is `auto` (selectable); `.cta` and `.lang__btn` stay `none`.

## Concerns (not changed, per "do not change anything else")
1. **Hero hand-off.** The same scan over the hero window shows a stretch of about 56 px of scroll (the height of the hero call) where the hero call is sliding under the header and the bar or pill is not up yet: 0 fully usable buttons, the hero call 50 px visible shrinking to 0. 390x844: scroll 740-790; 1280x800: 970-1020; 375x667: 640-690. This is the Task 6 trigger (`bottom top+=header`), unchanged. The mirror of this fix would be `top top+=header` in `headerAndSticky` and in `initReduced`; say if you want it.
2. With `threshold: 1` the bar and the How call can both be partly on screen for about one call-height of scroll at each end (the call half behind the bar entering, half under the header leaving). Only one is ever fully usable, which is the trade the review asked for.
3. The 2.5 s safety net also fires on a very slow bundle (more than 2.5 s after the stylesheet applies): the empty shell appears and the copy then shifts the layout when it arrives. Normal and Lighthouse-throttled loads finish well before (LCP 1.7 s).
