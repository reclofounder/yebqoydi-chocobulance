# Final fix wave: report

- **Status:** DONE_WITH_CONCERNS. The concerns are two deliberate deviations from the brief (item 10's media query form and the commit trailer). Everything else is as asked.
- **Commit:** `efcf770` "fix: anchor landing, legible hero note, real-number hints, deploy polish". One commit on `main`, not pushed.
- **Not committed:** `CLAUDE.md` (the controller edits it) and the untracked `docs/superpowers/reviews/` are left as they were. `.claude/launch.json` was not touched.
- **Tests:** 168 before, 190 after, all green. Typecheck, build and Prettier are clean.

## Per item

### 1. I1: fragment links landed mid-story

**Landing from outside (`/#faq`).** `src/scroll/motion.ts` gains `landOnFragment()`.

- It runs on the pinned path only, right after `initTimeline()`.
- If `location.hash` names an element, it listens once for ScrollTrigger's `refresh` event. That event fires after the first full refresh, which is the step that restores the stale pre-pin offset.
- It then removes itself and calls `target.scrollIntoView({ block: 'start' })`. This honours the section's `scroll-margin-top`, and Lenis, idle at boot, follows a native jump.
- Later refreshes (a resize, a language switch) leave the visitor where they are.
- `fragmentTarget(hash)` lives in `src/scroll/smooth.ts`. It decodes the fragment and returns null for `#`, an unknown id or a malformed escape.

**Reduced motion: not needed.** It is verified in the browser to land correctly as it is, since nothing is pinned. A test pins that the still frames register no listener.

**In-page clicks under Lenis.** `initSmoothScroll()` adds a delegated click listener for `a[href^="#"]` and removes it in its undo.

- It calls `lenis.scrollTo(target, { immediate: true })` and does not `preventDefault`. The browser still follows the link: it updates the hash and sets the focus starting point for the next Tab, so the skip link keeps working.
- It ignores modified clicks (meta, ctrl, shift, alt), non-primary buttons and links to nothing.
- Why this is needed: a native jump while Lenis is mid-glide gets undone. Lenis keeps animating to where the wheel was heading. The control run below shows it.
- Why `immediate`: a glide to the link would replay the whole story at speed.

**Tests** (`tests/motion.test.ts`):

- The fake ScrollTrigger gained `addEventListener` / `removeEventListener` and a `fire()`. The fake Lenis gained `scrollTo`. Fake matchMedia contexts are now reverted after each test, so no listener leaks into the next one.
- `scrollIntoView` is stubbed on `Element.prototype` (jsdom lacks it).
- New tests:
  - lands once after the first refresh, desktop and phones;
  - leaves `/`, `/#`, `/#nothing-here` and `/#%E0%A4%A` alone;
  - leaves the still frames to the browser;
  - a Lenis click jumps immediately without preventing the default;
  - modified clicks and links to nothing are ignored;
  - no handler without Lenis, nor after reduced motion is switched on mid-visit.
- They were written first and failed (RED), then passed.

### 2. I2: the hero note was invisible over the road

**Fix:** `src/styles/scenes.css`, desktop only (`min-width: 900px`). `#hero .note` and `#hero .phone-hint` get a cream chip:

- `background: color-mix(in srgb, var(--cream) 92%, transparent)`, with a plain `var(--cream)` fallback;
- `border-radius: var(--r-m)`, `padding: 4px var(--s1)`, `width: fit-content`.

Phones keep their copy above the street, so no chip there.

**Test:** `tests/scenes.test.ts` pins the rule: inside the 900 px media query, with the background, the radius and `fit-content`. It was written first and failed.

**Contrast**, measured on rendered pixels in headless Chrome. The text was made transparent, the screen captured, and a grid under the text box sampled. "Without chip" repeats the sampling with the chip's background removed, which is what the text had behind it before. The `-pinned` rows are scrolled to y = 250, with the hero pinned.

| View | Element | On chip (worst) | Without chip (worst) |
| --- | --- | --- | --- |
| 1280x720 | note | **7.03** | 1.00 (road) |
| 1280x720-pinned | note | 7.03 | 1.00 |
| 1280x720 + hint | hint | 7.03 | 1.00 |
| 1366x650-pinned | note | **7.03** | 1.00 (road) |
| 1366x768 | note | 7.78 | 5.79 |
| 1366x768 + hint | hint | 7.78 | 5.79 |
| 1440x790 | note | 7.78 | 5.79 (kerb) |
| 1440x790 + hint | hint | **7.03** | 1.00 (road) |
| 1440x900 | note / hint | 7.82 | 6.5 |
| 1280x800 | note / hint | 7.82 / 7.78 | 6.55 / 5.79 |
| 390x844 (no chip) | note / hint | 6.17 / 6.30 (sky) | same |
| 1280x720 ru + hint | hint | 7.03 | 1.00 |
| 1366x650 ru + hint, pinned | note / hint | 7.80 / 7.03 | 6.42 / 1.00 |

- Every case on screen is at least 7.03:1.
- At y = 0, 1366x650 has the note below the fold, so the pinned row is the one that counts.
- With the hint shown at 1366x650 in Uzbek, the hint sits just below the fold while the hero is pinned (see Concerns).

**og.png:** `public/og.png` was regenerated with Task 8's method: headless Chrome against the built page on `:4180`, `?lang=uz`, 1600x840 at `deviceScaleFactor` 0.75, `.header` and `.hero__scroll` hidden. The result is 1200x630, 102 406 bytes (was 102 240), and the note now sits on its chip across the kerb. Before and after are in the shots folder (`og-old.png`, `og-new.png`). The markup test (PNG signature, 1200x630) passes.

### 3. I3: no legible real number on desktop

Markup (`index.html`):

- **(a)** `<p class="phone-hint how__hint" data-phone-hint hidden>` under the How call, at all widths.
- **(b)** `<span class="phone-hint header__hint" data-phone-hint hidden>` right after the header pill. It is `display: none` below 900 px. From 900 px it shows in `--choco`, bold and nowrap, and hides together with the pill (the same `data-cta-visible` / `data-inline-cta` rules, and the same reduced-motion `transition: none`). The pill stays a plain-text anchor.
- **(c)** `<p class="dispatcher-line" data-phone-line hidden>` in `#scene-call .scene__overlay`, holding a `data-i18n="call.phone.label"` label span and an empty `data-phone-number` span. In `scenes.css` it is a white name card at the front edge of the desk (`right 3% / bottom 2%`, max 44 % wide; on desktop `right 2%`, max 26 %). The label is 12 px `--choco-soft`, the number bold `--fs-small`.

`applyPhoneHint` (`src/state.ts`) stays the one switch. In live mode with `PHONE !== HOOK` it:

- reveals every `[data-phone-hint]` with "yoki/или {phone}" (as before);
- reveals every `[data-phone-line]`;
- fills every `[data-phone-number]` with `PHONE_DISPLAY`.

Otherwise everything stays hidden and the number is cleared.

The How hint uses `--fg-soft`, so it follows dark mode (cream at 78 % on night); the base `.phone-hint` colour would be about 2:1 there.

**(d) Tests:**

- `tests/state.test.ts`, on the real `index.html`:
  - with `PHONE='+998901234567'`, `PHONE_DISPLAY='+998 90 123 45 67'`: the hints in `#header`, `#hero`, `#how` and `#sticky-cta` all show "yoki +998 90 123 45 67";
  - the desk line shows the display number under "Chocobulance dispetcheri", and the label follows a switch to Russian;
  - live with `PHONE === HOOK`, teaser and ended: all five elements stay hidden.
- `tests/markup.test.ts`: the header children are `brand, cta cta--compact, phone-hint header__hint, lang`. The How container ends with steps, then the call, then the hint. Four hints in `header, hero, how, sticky-cta`, all hidden. The desk-line markup is pinned.
- All written first; 8 failed before the change.

### 4. Stale comments

Reworded to "the hero call's top edge reaches the header" (plus "wholly on screen" for the How call):

- `layout.css`: the frosted bar comment now names who sets `data-scrolled`, plus the pill and sticky-bar comments.
- `tests/motion.test.ts`: the matching comment.

### 5. Node floor

- `engines.node` is `"^20.19.0 || >=22.12.0"`. `npm install --package-lock-only` synced the lockfile's root entry, one line.
- README: "Node 20.19+ or 22.12+ (`.nvmrc` pins 22), as Vite 8 requires".

### 6. `serve -s` turned unknown paths into soft 404s

- `npm start` is now `serve dist -l ${PORT:-3000}`. The README command row says unknown paths 404.
- Checked with `PORT=4181 npm start` and curl (`/usr/bin/curl`), then stopped:

```
/                  200 text/html; charset=utf-8
/?lang=ru          200 text/html; charset=utf-8
/og.png            200 image/png
/favicon.svg       200 image/svg+xml
/nope              404 text/html; charset=utf-8
/assets/nope.js    404 text/html; charset=utf-8
```

### 7. `%VITE_SITE_URL%`

**`index.html`.** `og:image`, `twitter:image`, a new `og:url` and the three `hreflang` hrefs use `%VITE_SITE_URL%/…`. The head comment was rewritten.

**`vite.config.ts`.** It exports a `siteUrl()` plugin with a `transformIndexHtml` hook at `order: 'pre'`.

- It reads `config.env.VITE_SITE_URL`, which covers `.env` files and process env, defaults to `''`, and strips a trailing slash.
- It runs before Vite's own `%ENV%` and asset passes. Those would otherwise leave an unknown name literal and try to resolve the placeholder as an asset.

**`.env.example`** holds `VITE_SITE_URL=https://example.com`.

**Tests** (`tests/markup.test.ts`):

- the source carries the placeholders;
- the plugin makes everything absolute with `https://example.com`, and the same with a trailing slash;
- with the variable unset, everything falls back to relative with no placeholder left.

**Built both ways:**

- `VITE_SITE_URL=https://example.com/ npm run build` gives absolute `og:image`, `twitter:image` and `og:url`, plus `https://example.com/?lang=uz|ru` and `https://example.com/`.
- Unset, it gives `/og.png`, `/`, `/?lang=uz|ru` and `/`. `grep -c '%VITE_SITE_URL%' dist/index.html` returns 0, and Vite prints no warning.

The README Deploy step 5 now says to set the variable on Railway and rebuild.

### 8. Inert footer social pills

`<ul class="footer__social" role="list" hidden>` with a TODO comment. The `footer.social.*` keys stay. A markup test requires the list to be hidden while any link lacks an `href`; it failed first. The README open item is updated.

### 9. `?lang=` beat the visitor's choice

`setLang` now rewrites an existing `lang` query parameter to the chosen language with `history.replaceState`. It keeps the other parameters, the fragment and `history.state`. An address without the parameter is left alone, since the stored choice carries it. Two tests in `tests/i18n.test.ts` cover this; the first failed before the change.

### 10. The breakpoint gap (deviation)

- `src/scroll/timeline.ts` now has `WIDE = '(min-width: 900px)'`, which is exactly the CSS desktop query, and `NARROW = 'not all and (min-width: 900px)'`, its complement. Every width matches exactly one JS context.
- At a fractional width between 899.98 and 900 px the CSS desktop rules are off too, so the mobile layout and the phone pacing go together.
- The motion test constants are updated. CSS is unchanged.
- Chrome check: `matchMedia` gives narrow at 390 and 899, wide at 900 and 1280, and the CSS sticky bar shows exactly when narrow.
- **Not the range syntax the brief named**; see Concerns 1.

### 11. README Deploy

The Deploy section gains:

- the `VITE_SITE_URL` step;
- a config-as-code caveat (Railway marks it deprecated, legacy files honoured until 2026-12-01; if `railway.json` is ignored, set build `npm run build` and start `npm start` in the service settings);
- a smoke list:
  - the build log shows `vite build`;
  - `/` and `/?lang=ru` return 200;
  - `/og.png` returns 200;
  - `/nope` returns 404;
  - with `VITE_SITE_URL` set, absolute tags and a Telegram / X preview check;
  - `/#faq` opens at the FAQ.

"Change the hotline number" now lists every place the real number shows, and asks to check 1366x650 and 1440x790. The project layout lists `vite.config.ts` and `.env.example`.

## Commands run (final state)

- `npx vitest run`: `Test Files 11 passed (11)`, `Tests 190 passed (190)`. The baseline was 168; the 22 new tests are 10 motion, 5 state, 4 markup, 2 i18n and 1 scenes.
- `npm run typecheck` (`tsc --noEmit`): exit 0.
- `npm run build`: `✓ built in 106ms`. JS is 216.19 kB (73.49 kB gzip), CSS 26.44 kB (6.38 kB gzip).
- `npx prettier --check index.html vite.config.ts src tests README.md`: all files formatted. Prettier reformatted three test files I had edited.
- Serve check: the item 6 table above.

## Browser evidence

**Method:** headless Google Chrome over CDP, using the session's `cdp.mjs` helper, against the built page served by `npm start` on `:4180`. Scripts are in the scratchpad `ffix/` folder (`i1.mjs`, `i2.mjs`, `i3.mjs`, `og.mjs`, `mq.mjs`, `build-phone.mjs`). There are 58 screenshots in `.superpowers/sdd/2026-10-20-chocobulance-landing/final-fix-shots/`.

**I1.** Fresh navigations, re-run on the final build. The section top should be at 64 px, which is its `scroll-margin-top`, right under the header.

| View | Mode | URL | scrollY | Section top on screen | Note |
| --- | --- | --- | --- | --- | --- |
| 1280x800 | pinned (Lenis) | `/#faq` | 11759 | 64 | was 5519 (road) |
| 1280x800 | pinned (Lenis) | `/#how` | 10176 | 64 | |
| 1280x800 | reduced | `/#faq` | 5519 | 64 | the browser's own landing holds |
| 1280x800 | reduced | `/#how` | 3936 | 64 | |
| 390x844 | pinned (touch) | `/#faq` | 11002 | 64 | |
| 390x844 | pinned (touch) | `/#how` | 9100 | 64 | was 4161 |
| 390x844 | reduced | `/#faq` | 6063 | 64 | |
| 390x844 | reduced | `/#how` | 4161 | 64 | |
| 1280x800 | Lenis | click "Qanday ishlaydi?" during a wheel glide (scrollY 586) | 10176 | 64 | lands |
| 1280x800 | Lenis | control: `location.hash='#how'` during the same glide, no click | 1200 | 9040 | Lenis carries it back to the kitchen; this is what the click handler prevents |
| 1280x800 | Lenis | brand link (`#hero`) from `/#faq` | 480 | 0 | end of the hero's pin, which shows the hero; same as native |

**I2.** The contrast table above. The screenshots are `i2-hero-*.png` for every viewport, with and without the hint, at the top and pinned, plus Russian runs.

**I3.** Checked on a real `PHONE != HOOK` build.

- **How it was built:** in the scratchpad (`build-phone.mjs`). A `resolve.alias` points `./config` at a copy with `+998901234567` / `+998 90 123 45 67`, and it is served on `:4182`. The repo was untouched.
- **Why a real build:** a JS simulation is not faithful on phones. ScrollTrigger ignores a resize event that changes no size on touch devices, so the pins would be measured with the shorter bar.
- **Results:**
  - At 1280x800 and 1366x650, the header pill is followed by "yoki +998 90 123 45 67". It hides with the pill while the How call is wholly on screen.
  - The How hint shows under the call; in dark mode it is cream.
  - The desk card sits at the desk's right end under the monitor on desktop, in both languages ("Диспетчер Chocobulance").
  - On phones the card sits on the desk's front edge and clears the taller bar:

    | View | Card bottom | Bar top (about) |
    | --- | --- | --- |
    | 390x844 | 737 | 739 |
    | 375x667 | 549 | 562 |
    | 768x1024 | 906 | 919 |
  - Screenshots: `i3-call-*`, `i3-header-*`, `i3-how-*` (including `i3-how-1280x800-dark`).

## Files changed (19)

- `.env.example` (new)
- `README.md`, `index.html`, `package.json`, `package-lock.json`, `public/og.png`, `vite.config.ts`
- `src/i18n.ts`, `src/state.ts`
- `src/scroll/motion.ts`, `src/scroll/smooth.ts`, `src/scroll/timeline.ts`
- `src/styles/layout.css`, `src/styles/scenes.css`
- `tests/i18n.test.ts`, `tests/markup.test.ts`, `tests/motion.test.ts`, `tests/scenes.test.ts`, `tests/state.test.ts`

Total: +596 / −53.

## Concerns

1. **Item 10 deviates from the brief.** The brief asked for `(width < 900px)` / `(width >= 900px)` and said range syntax is "supported by all browsers in our ES2020 floor". It is not. Media query range syntax needs Chrome 104 and Safari 16.4, while the script floor is Chrome 80 and Safari 14. In Safari 14 to 16.3 and Chrome 80 to 103 both queries would read as `not all`. GSAP would then never run the story, and the header and call-bar flags would never be set, so phones there would lose the sticky call bar. I used the universally supported complement instead (`not all and (min-width: 900px)`). It meets the stated goal: no width matches neither context, and it agrees with the CSS. Swap it back if you prefer the range syntax regardless.
2. **The commit trailer deviates from the brief.** The brief asked for `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. This session's commit-attribution rule specifies `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, and that is the model that did the work, so I used it. Amend with `git commit --amend` if the Fable line is required.
3. **I3 at 1366x650 in Uzbek with a real number:** the hero's own hint sits just below the fold while the hero is pinned (653–683 px against a 650 px screen). It comes into view as the hero scrolls on, and then the header pill and its hint take over. Russian fits. Fixing it would mean tightening the hero copy on short screens, which is beyond this wave.
4. **The desk card on phones:** the label wraps to two lines ("Chocobulance / dispetcheri"), so the card is about 55 px tall. It stays on the desk and clear of the bar at 375x667, 390x844 and 768x1024.
5. **`og:url` falls back to `/` while `VITE_SITE_URL` is unset**, as the brief allowed. It only becomes useful once the variable is set, and it is read at build time, so Railway must rebuild after it is set.
6. **The Node floor follows the brief (22.12)**, but jsdom 29, a dev dependency used by the tests, asks for `^22.13.0` on the 22 line. It only matters for running tests on Node 22.12 exactly; `.nvmrc` pins 22, which resolves to the newest 22.
7. **`setLang`'s URL rewrite** re-serialises the other query parameters through `URLSearchParams` (for example `%20` becomes `+`). This is harmless for any server.
8. **Out of scope and not done:** the review's minors 4 (a purpose-made OG card), 7 (the ʻ glyph), 10 (CLAUDE.md §6a wording; CLAUDE.md is the controller's) and parts of 11 (a single end-to-end "one call button" sweep, and the `PARALLAX ≥ −1` invariant test).
9. **Housekeeping:** my first serve attempt started a second `serve` on a random port. Every server I started (4180, 4181, 4182) is stopped. `dist/` holds the final unset-variable build and is gitignored.
