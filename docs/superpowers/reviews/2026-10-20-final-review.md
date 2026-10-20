# Final whole-branch review: Chocobulance landing (4b825dc..5bc634f)

Reviewer: senior code review, read-only. Date: 2026-10-20.

## How this review was done

- **Package.** Read in passes: commits, stat and README from `final-review-package.md`. The base is the empty tree, so every hunk is a whole new file. The code, styles, tests and configs were then read straight from the checkout at HEAD (same content, with line numbers): `index.html`, all of `src/`, `tests/motion.test.ts` (fakes, pins, gags, header logic), `tests/main.test.ts` and the titles of every test. Also read the spec, the plan, CLAUDE.md §3/§6/§7, the deferred list, and design-review §1–2.
- **Commands, run once each.**
  - `npx vitest run`: 11 files, **168 passed**.
  - `npm run typecheck`: clean.
  - `npm run build`: clean. JS 215 KB (73 KB gzip), CSS 25 KB. The font preloads are rewritten to hashed `/assets/` URLs, so the Cyrillic `x-preload-ru` links resolve in `dist`.
- **Runtime probes.** `vite preview` of the fresh `dist`, Chrome in the Browser pane, layout reads only.
  - The pane runs as a background page, so `requestAnimationFrame` (and with it GSAP's ticker) does not fire. Scroll-driven flag sweeps could not be run; those parts are judged from the code and the tests.
  - Probes: fragment landing, hero geometry at seven desktop sizes, kitchen at 375×667, Russian at 320×568, hero at 360×640.

---

## Strengths

- **Architecture is clean and honest.** config → i18n → state → mount → scroll, each module small and single-purpose. `main.ts` has the right boot order: `mountScenes → applyI18n → applyMode → applyPhoneHint`, then `initScroll` after `document.fonts.ready`.
- **The boot gate degrades safely.**
  - `try/finally` reveals the page if a step throws.
  - A `<noscript>` rule and a 2.5 s CSS `boot-reveal` cover a bundle that never runs. The reveal still fires under reduced motion, because only the siren and van animations are switched off there.
  - Storage access is wrapped everywhere, including the inline preload script.
  - `IntersectionObserver` absence is handled.
- **The HOOK / PHONE split is done carefully.**
  - Templates (`{hook}`, `{phone}`, `{price}`, `{date}`) are used, and a test forbids literal `105` or `99 000` in copy and markup.
  - The static Uzbek meta tags are kept in step with `uz.json` by a test.
  - `applyMode` tags its swapped spans with `data-i18n`, so a language switch re-translates "Tez orada" / "Скоро" without re-running the mode.
- **The call-button chain integrates correctly.** The CTA triggers resolve `#hero [data-cta]` and `#how [data-cta]` *after* `applyMode` has swapped anchors for spans, so teaser and ended work. The design review's C1 was fixed the right way: `past(self)` instead of `isActive`, plus `onRefresh` so the page opens in the right state. Both are tested.
- **Motion discipline is high.**
  - Only `transform` and `opacity` move, plus custom properties for the `fill-box` pivots (wheels, door, hearts), which avoids GSAP's view-box-origin trap.
  - The gags play in time and can be interrupted, with a faster reverse.
  - Scrolling is smoothed once: `scrub: true` under Lenis, 0.4 on touch.
  - Lenis runs on fine pointers only, with `lagSmoothing` restored on undo.
  - The `gsap.matchMedia` revert path rebuilds across the breakpoint and drops to the still frames mid-visit.
  - `pinShift` / `clearOfBands` is thoughtful geometry with good unit tests.
- **Accessibility basics are solid.**
  - Skip link, `aria-pressed` on the language buttons, `lang` on each button.
  - Decorative SVGs are `aria-hidden`; the van is `role="img"` with a translated label.
  - Focus rings are re-coloured per background; targets are at least 44 px.
  - The kitchen paragraph on phones is visually hidden but still read by screen readers.
  - Dark mode covers the static sections only, as specified.
- **Performance.** Fonts load through `unicode-range` with Cyrillic preloaded only for Russian. The `clip-path: inset(0)` choice (CLS 0 under pins) is documented. The bundle is well inside the 400 KB budget.
- **Tests cover behaviour.** Most assert DOM state, flags or decisions; GSAP, ScrollTrigger and Lenis are fakes that test this code's choices. A few CSS tests are regex-level, which is acceptable for this size.
- **README.** "Change the hotline number", "Campaign mode", "Edit copy" and "Swap the van" are accurate and operator-friendly.

---

## Issues

### Critical (Must Fix)

None.

### Important (Should Fix)

#### I1. Deep links with a fragment land in the middle of the story

- **Where:** `src/scroll/motion.ts:65-69` (`initScroll`) and `src/main.ts:42`. There is no fragment handling anywhere.
- **What.** The browser resolves `#how` / `#faq` / `#coverage` against the un-pinned layout. `initScroll` then adds five pin spacers, about 7.8 screens of scroll above the static sections. On refresh, ScrollTrigger restores the recorded raw scroll value; it also sets `history.scrollRestoration = 'manual'`. So the visitor stays at the old pixel offset. Measured on a fresh navigation:

  | Viewport | URL | Landed at `scrollY` | Target top | Scene on screen |
  | --- | --- | --- | --- | --- |
  | 1280×800 | `/#faq` | 5519 | 11823 | road |
  | 390×844 | `/#how` | 4161 | 9164 | call / road |

- **Why it matters.** A link shared as `…/#how` or `…/#faq` from a Telegram post, a PR article or a blogger bio drops the visitor on a random mid-story frame. A reasonable visitor expects the section they were linked to. Links clicked *after* boot (hero "Qanday ishlaydi?", brand) are fine.
- **Fix:** once, after ScrollTrigger's first full refresh, re-resolve the hash.
  ```ts
  // motion.ts, end of initScroll()
  const id = decodeURIComponent(location.hash.slice(1));
  const target = id ? document.getElementById(id) : null;
  if (target) {
    const once = () => { ScrollTrigger.removeEventListener('refresh', once); target.scrollIntoView(); };
    ScrollTrigger.addEventListener('refresh', once);
  }
  ```
  `scroll-margin-top` is already set on `.section`. Lenis follows native scroll. Add a test with the fake ScrollTrigger: a hash present means `scrollIntoView` is called after `refresh`.

#### I2. The hero note sits on the street at common laptop heights; at 1280×720 it is invisible

- **Where:**
  - `src/styles/layout.css:456-461`: desktop `.scene__copy` is vertically centred.
  - `layout.css:470-475`: short screens trim `padding-bottom`.
  - `src/scenes/scenes.css:131-133`: `#hero .scene__art { overflow: visible }`.
  - `src/scenes/hero-bg.svg:71-75`: sidewalk, kerb and road run left under the copy column.
- **What.** Measured at y = 0. The road colour is `--choco-soft`, the same colour as the `.note` text. Real laptop viewports sit exactly in this band once browser chrome is subtracted: 1366×768 screens give about 1366×650, 1536×864 about 1536×730, a MacBook Air about 1440×790.

  | Viewport | Note (top–bottom) | Sidewalk | Road | Result |
  | --- | --- | --- | --- | --- |
  | 1280×720 | 665–687 | — | 654 | Wholly on the road, about 1:1 contrast; confirmed by screenshot |
  | 1440×790 | 695–717 | 700 | 716 | Straddles the kerb |
  | 1366×650 | 676–698 (below the fold) | — | 660 | On the road while the hero is pinned |
  | 1280×800, 1440×900, 1536×864, 1920×1080 | — | — | — | Clear |

- **Why it matters.** The note carries the practical promise ("Faqat Toshkent shahri · 99 000 soʻm · Toʻlov yetkazib berilganda"). It also fails WCAG 1.4.3 where it lands. The deferred list recorded only the 1440×790 kerb overlap; it is worse than that. The same overlap is baked into `og.png` (the note sits on the kerb line).
- **Fix, either of:**
  - (a) On desktop, give `#hero .note, #hero .phone-hint` a chip backdrop like `.eyebrow`: `background: var(--white); padding: 2px var(--s1); border-radius: 999px; align-self: flex-start`. `--choco-soft` on white is about 9:1.
  - (b) Keep the copy above the street: on desktop, add bottom padding to `#hero .scene__copy` equal to the stage's street height (stage height × 100/450) plus `--s2`.

  Option (a) is the robust one-liner. Re-check 1280×720, 1366×650 and 1440×790, then regenerate `og.png`.

#### I3. Once `PHONE ≠ HOOK`, desktop visitors may have no legible real number

- **Where:**
  - `index.html:146` and `:316` are the only `[data-phone-hint]` elements: hero and sticky bar. The sticky bar is `display: none` at 900 px and up.
  - The header pill (`index.html:109`) and the How call (`:241`) carry no hint.
  - `call.phone.label` (`src/i18n/uz.json:28`, `ru.json:28`) is defined but used nowhere.
- **What.**
  - Spec §3 says that when `PHONE !== HOOK`, the hero and the sticky bar show the real number, *and "the dispatcher scene shows it on the dispatcher card"*. The plan's Task 2/3 interfaces dropped the dispatcher card, so this is a **plan gap against the spec**, never built.
  - On desktop, every label then says "105". The README itself notes a brand cannot own 105.
  - A desktop visitor cannot tap `tel:`; they read and dial. The only real number they get is the hero hint. Simulating `PHONE ≠ HOOK` puts that hint on the road (about 1:1 contrast) at 1366×768 (hint 698–720, road 698) and 1440×790 (hint 714–737, road 716).
  - Nothing is broken today (`PHONE === HOOK`). But the number change is a must-before-launch step, and following the README produces this state.
- **Fix.**
  1. Add `<p class="phone-hint" data-phone-hint hidden></p>` under the How call (all widths).
  2. Show the hint beside the header pill at 900 px and up (or in the pill's accessible name).
  3. Build the spec's dispatcher-card line in the call scene's `.scene__overlay`: `call.phone.label` plus `{phone}`, live mode only.
  4. Fix I2 so the hero hint is legible.
  5. Extend `state.test.ts`: with `PHONE ≠ HOOK`, a hint outside the hero and sticky bar becomes visible.

### Minor (Nice to Have)

1. **Stale comments.**
   - `src/styles/layout.css:156`: "a later task toggles the attribute".
   - `layout.css:305` and `:380`, and the comment at `tests/motion.test.ts:885`: "scrolled away". The trigger is now the hero call's *top edge reaching the header*.

   Reword so the next editor does not "fix" the timing back.
2. **The Node floor is wrong in two places.**
   - `package.json` has `engines.node: ">=20.19"`, which admits 22.0–22.11. Vite 8 needs `^20.19.0 || >=22.12.0`, and jsdom 29 (tests) needs `^22.13.0`.
   - `README.md:8` says "anything from 20.19 works".

   Use `"^20.19.0 || >=22.13.0"` and say the same in the README. Railpack reads `engines` first.
3. **`serve -s` turns every unknown path into a 200 copy of the page (soft 404s)** (`package.json` `start`). A one-page site has no client routes, so drop `-s`; `serve` still serves `index.html` at `/`. Optionally add a `serve.json` with `Cache-Control: public, max-age=31536000, immutable` for `/assets/**`.
4. **`og.png` is a screenshot of the hero UI**, not a share card.
   - It shows the two buttons and 12-px body text, unreadable at preview size, and the note sits on the kerb (I2).
   - It is Uzbek-only and bakes in "105" and the price.

   Consider a purpose-made 1200×630 composition: wordmark, big "105", the van, one line of copy.
5. **Absolute `og:image`, `twitter:image`, `og:url` and `hreflang` depend on hand-editing `index.html` at deploy** (`index.html:19-21, 36, 50`). Vite substitutes `%VITE_SITE_URL%` in `index.html`. With that, the operator sets one Railway variable, not HTML, and a test can assert the placeholders exist.
6. **The footer social pills look tappable but are inert** (`index.html:305-308`, styled as bordered pills at `layout.css:735-745`). Mark the list `hidden` until the handles exist; a dead "Instagram" pill on a UGC campaign reads as broken.
7. **The Uzbek ʻ (U+02BB) is visibly gappy in Nunito headlines.** The hero reads "qo ʻ ng ʻ iroq" (confirmed in screenshots and `og.png`). This is the user's call (README "Known open items"). It should be decided before launch, since it is the campaign line. Besides keep, ASCII `'` or another font, U+2018 `‘` is a common Uzbek web substitute worth trying in Nunito.
8. **`?lang=` in the URL always beats the visitor's own choice** (`src/i18n.ts:19-29`). Open a `?lang=ru` link, switch to UZ, reload: Russian again. On toggle, `history.replaceState` the `lang` param (or drop it).
9. **A breakpoint gap of 899.98–900 px** (`src/scroll/timeline.ts:23-24`, `:521`). At a fractional viewport in that range neither `NARROW` nor `WIDE` matches, so GSAP never calls the callback: no story and no header or call-bar flags. It is practically unreachable, but `WIDE = 'not all and (max-width: 899.98px)'` closes it for free.
10. **CLAUDE.md §6a contradicts the HOOK / PHONE ruling** (`CLAUDE.md:111`). It says to "replace every `105` (tel: links, copy, OG tags)". CLAUDE.md declares itself the source of truth, so a future session could rewrite the campaign line. Reword: set `PHONE` / `PHONE_DISPLAY` only; `HOOK` stays 105 unless the user decides otherwise.
11. **Test gaps that matter for a two-week page.**
    - Fragment landing (I1).
    - A single end-to-end "exactly one call button" sweep. Today it is pieced together from flag tests plus regex CSS tests.
    - The `PARALLAX ≥ −1` invariant (`timeline.ts:61`): export the constant and add a one-line test.
    - The `PHONE ≠ HOOK` desktop hint (I3).
12. **The deploy runbook is thin.**
    - The README's Railway section omits the config-as-code deprecation that CLAUDE.md §3 records ("honoured until 2026-12-01").
    - It has no post-deploy smoke list: `/` and `/?lang=ru` load; `/og.png` is 200; og tags are absolute; an unknown path returns 404 once `-s` is dropped.

---

## Deferred-items triage

| Deferred line | Verdict | Reason |
| --- | --- | --- |
| **T1:** engines vs Vite floor; `.nvmrc`; typecheck script | CAN SHIP | `.nvmrc 22` and `typecheck` are done. The engines range is still loose and the README wrong (Minor 2), but Railpack resolves the newest matching Node. Fix the wording anyway. |
| **T1:** config test restates; hex case; npm-init noise | CAN SHIP | Cosmetic. |
| **T3:** layout.css size and concerns; stray `--icon-phone` `:root`; `!important` on `[hidden]`; 760 px split; inert social anchors; lang `aria-pressed`; markup walk; `keys.size>50`; off-grid px | CAN SHIP | `aria-pressed` is done; a no-literal-copy test exists. Organisation nits are not ship blockers at 823 lines. Inert socials: hide them (Minor 6). |
| **T4:** `preserveAspectRatio`; hero placement split; duplicate-id guard; `<style>#id` selectors; regex CSS test; tyre no-transform test | CAN SHIP | `preserveAspectRatio` is now set in `mountVan`. A page-wide unique-id test exists. No SVG ships a `<style>` block today; note the selector limit for the final van art. |
| **T5:** SVG comments in bundle; overlay `aria-hidden="false"`; 200 % rule untested; `<use>`; three 900 px blocks; badge off-grid; van.css comment; bus stop layer | CAN SHIP | The overlay `aria-hidden` is gone; the 200 % rule is now tested. About 6 KB of comments inside a 73 KB gzip bundle is fine. The rest is polish. |
| **T6:** wheel tween coupled to linear motion; parallax ≤ −1 untested; regex CSS tests; `initReduced` rect per scroll; Lenis pointer once; badge leftover transform | CAN SHIP | All latent or polish. Add the parallax invariant test (Minor 11). |
| **T6 ruling line** (fix round 1 bundle, M2→T7, M3 kept) | CAN SHIP | Informational; nothing left open. |
| **T6:** 194 px blended bands between pins on desktop | CAN SHIP | Chained gradients make the hand-offs seamless. The stage is now 7/12 at 16:9 (733×412 at 1280). The bands are pacing, not seams. The I2 "bigger stage" part is only partly done: acceptable, revisit with final art. |
| **T6:** beats run ahead of scrubbed motion on fast flicks | CAN SHIP | Cosmetic on flicks only; the beats are interruptible. |
| **T6:** double refresh on `langchange` when fonts are loaded | CAN SHIP | One extra layout pass per language switch. |
| **T6:** kitchen at 375×667, about 180 px of stage under the bar | CAN SHIP | Verified: at the pin the title, the card, Dad and almost all of the tub are in view. The bar covers the table and the tub's lowest ~20 px. |
| **T8:** `railway.json` on Railpack, untested until deploy | CAN SHIP, verify at deploy | Cannot be verified offline. Run the smoke list (Minor 12). If Railpack ignores the file, set the same build and start commands in service settings. |
| **T8:** hero note overlaps the road at 1440×790 | MUST FIX | Worse than recorded: invisible at 1280×720, and the future phone hint is invisible at 1366×768 and 1440×790. See I2 and I3. |
| **T8:** og / hreflang relative until a domain exists | MUST FIX at deploy | Required for link previews on Telegram, X and Facebook, which is the campaign's traffic. A deploy-step blocker, not a code blocker now. Minor 5 makes it a variable. |

---

## Declined to judge

- **SVG art quality and composition** (scenes, van, `og.png` beyond the kerb overlap): excluded from the package and judged by the controller.
- **The runtime "exactly one call button" sweep and scrub feel:** the Browser pane ran as a background page, so `requestAnimationFrame` and GSAP's ticker did not run. Judged from code and tests only.
- **iOS Safari:** `perspective() rotateY()` on the door `<g>`, and the ʻ rendering. Not available here.
- **Real-device frame rate and the Lighthouse 100/99 claims:** not re-measured; the Task 7 report is taken as given.
- **Railpack behaviour** (dev-dependency install, Node resolution from `engines`, config-as-code deprecation date): cannot be verified offline.
- **Total scroll length:** about 15 screens on desktop and 14.5 on phones, against the spec's "roughly 10–11". Spec §8 leaves distances to the builder, and the design-review rulings retuned them.
- **Plan / spec deviations already ruled on:** scrub `true`/0.4 instead of 0.8; time-based gags instead of scrubbed `back.out(1.4)`; header pill plus How CTA instead of an "inline desktop sticky"; Vite 8; Railpack.
- **The inert grey call bar that stays on phones in `ended` mode:** the spec defines the pill for teaser, is silent for ended, and the behaviour is coherent.
- **No-JS and pre-ES2020 browsers**, which get an empty shell after 2.5 s: there is no spec requirement. A build-time Uzbek prerender of `data-i18n` (see Recommendations) would cover it cheaply.
- **Uzbek and Russian copy wording:** supplied by the spec.
- **How desktop browsers handle `tel:`**: platform behaviour.
- **The final van art arriving as hex colours or raster:** the README's token-only rule is a deliberate contract. Flagged only as a heads-up for the art hand-off.

---

## Recommendations

1. **One small fix wave before ship:** I1 (fragment re-resolve, plus a test), I2 (chip backdrop on the hero note and hint, then re-check 1280×720, 1366×650 and 1440×790, and regenerate `og.png`), I3 (How-call hint, desktop hint by the header pill, dispatcher-card line, plus a test). Minors 1, 2, 3, 6 and 10 are single-line edits; do them in the same wave.
2. **Before the number goes in:** set `PHONE` / `PHONE_DISPLAY`, then eyeball 1366×650 and 1440×790 desktop with the hint visible.
3. **At deploy:** absolute og / hreflang tags (via `%VITE_SITE_URL%` if adopted), a Telegram / X preview check, and the smoke list.
4. **Optional:** a Vite `transformIndexHtml` step that pre-fills `data-i18n` with Uzbek. This gives crawlers and no-JS visitors real copy; the runtime still overwrites it, and the no-literal-copy test can target the source `index.html` only.

---

## Assessment

**Ready to ship?** With fixes.

**Reasoning:** The build is architecturally sound, well tested (168 green, typecheck and build clean) and integrates its pieces correctly, including mode swaps, call-button hand-offs, the reduced-motion and breakpoint reverts, and the boot fallbacks. Three behaviours need fixing first: fragment links landing mid-story, the hero note being illegible on the street at the most common laptop heights, and the real phone number having no legible home on desktop once it differs from 105.
