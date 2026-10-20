# Task 3 report: Markup, layout, static sections, fonts

Status: DONE_WITH_CONCERNS (all requirements met; concerns are observations the controller should rule on, see section 9)
Commit: `825fb49 feat: page markup, layout system, static sections, fonts` (on top of f512cc6, not pushed; amended once after the final verification pass)
Trailer: `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` (same as Tasks 1-2)

## 1. What I implemented

| File | Change |
| --- | --- |
| `index.html` | Header (`a.brand`, `div.lang` with `button[data-lang=uz|ru]`), five `section.scene` (`data-scene` hero/kitchen/call/road/door; ids `hero`, `scene-kitchen`, `scene-call`, `scene-road`, `scene-door`), each with `.scene__copy` (`p.eyebrow`, `h2`/`h1`, `p.body`, kitchen card) and an empty `.scene__stage[data-stage]`; static `#how` (3 `article.step`), `#coverage`, `#faq` (5 `details > summary`), `footer#footer`; `div#sticky-cta[data-visible=false]`. Every string is a `data-i18n` key; no literal "105" / "99 000" in text. |
| `src/styles/layout.css` (new) | Type scale, containers, header, CTA, sticky bar, pinned-scene shell, how/coverage/faq/footer, dark mode, reduced motion. |
| `src/styles/scenes.css` (new) | Shell backgrounds per scene, hero numeral/title/actions/scroll hint, kitchen card. No scenery. |
| `src/scenes/coverage.svg` (new) | 480x360 art: grey `--grey-out` panel, cream + `--red` 12 % ring with red stroke, dashed inner ring, streets, red/white van inside with speed lines, grey van + crossed circle outside. Painted with `var(--token)` in `style` attributes (no hex, no `<text>`). |
| `src/scenes/mount.ts` (new) | `mountScenes(root: ParentNode): void`; injects `coverage.svg?raw` into `#coverage [data-stage]`. No-op if absent, idempotent. |
| `src/main.ts` | Imports `@fontsource/nunito/800.css` + `900.css` before local CSS; imports `layout.css`, `scenes.css`; calls `mountScenes(document)` right after `applyI18n`. |
| `tests/markup.test.ts` (new) | 9 tests. The first test holds the brief's assertions verbatim. |
| `tests/mount.test.ts` (new) | 3 tests for `mountScenes`. |

Copy hooks used exactly as specified: `data-i18n`, `data-i18n-attr="aria-label:a11y.lang"`, `[data-lang]` buttons (delegated click untouched), two `[data-cta]` plain-text anchors (hero, sticky: no child, no id, no aria-label, `href="tel:105"` placeholder), `p.note[data-i18n=hero.note][data-state-note]`, two `[data-phone-hint][hidden]`, hero numeral `data-i18n="hero.numeral"`.

## 2. TDD evidence

### Markup test, RED (before any markup; skeleton index.html)
Command: `npx vitest run tests/markup.test.ts`
```
 ❯ tests/markup.test.ts (9 tests | 8 failed) 27ms
     × has the required ids, attributes and sections
     × declares the five pinned scenes, each with copy and an empty stage
     × gives the hero its split headline, numeral, actions, note and phone hint
     × has a header with a brand link and both language buttons
     × keeps every call-to-action a plain-text anchor the engine can swap for a pill
     × starts the sticky bar hidden, with phone hints hidden until the engine reveals them
     × builds the static sections: three steps, coverage with a stage and price, five questions
     × only uses copy keys that exist in both dictionaries
 AssertionError: expected '<!doctype html>\n<html lang="uz">\n  …' to contain 'data-scene="road"'
 Test Files  1 failed (1)   Tests  8 failed | 1 passed (9)
```
(The one pass is "no literal 105 in copy", which an empty skeleton satisfies trivially. An earlier attempt failed on a harness problem, `new URL(..., import.meta.url)` is not `file:` under jsdom; I fixed the path to `resolve(process.cwd(), 'index.html')` so the RED above is for the right reason.)

### Markup test, GREEN (after writing index.html)
```
 Test Files  1 passed (1)
      Tests  9 passed (9)
```

### mountScenes test, RED then GREEN
RED: `npx vitest run tests/mount.test.ts` failed to load (`../src/scenes/mount` did not exist; "Test Files 1 failed, no tests").
GREEN: after `mount.ts` + `coverage.svg` + `main.ts` wiring, `npx vitest run` gave 41 passed (see below).

### Final gate (after format, last CSS edit)
```
$ npx vitest run
 Test Files  6 passed (6)
      Tests  41 passed (41)        # 29 existing + 9 markup + 3 mount; output has no warnings
$ npx tsc --noEmit                 # TypeScript: No errors found (exit 0)
$ npx prettier --check index.html vite.config.ts src tests   # All files formatted correctly
$ npm run build                    # built in 50ms; CSS 18.10 kB (4.72 kB gzip), JS 16.51 kB (5.92 kB gzip)
```
The existing `tests/main.test.ts` (boots `src/main.ts` against a tiny DOM) still passes with the new imports (fonts, CSS, SVG `?raw`, `mountScenes` with no coverage stage).

## 3. Glyph check (brief step 3): `ʻ` U+02BB and `ʼ` U+02BC render in Nunito, no fallback. JSON left unchanged.

Four independent confirmations:
1. **unicode-range:** `@fontsource/nunito/800.css` and `900.css`, latin subset: `U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,...,U+2000-206F,...`. The latin-ext subset explicitly excludes them (`U+0100-02BA,U+02BD-...`), so the latin file is the one the browser loads for both glyphs.
2. **cmap of the shipped files** (script reads the WOFF `cmap` table of `nunito-latin-{800,900}-normal.woff`): `ʻ` yes, `ʼ` yes, plus `'`, `«`, `»`, `—`, `·`, `©`; cyrillic subset has `З ё й ы ь`. Every one of the **124 distinct characters in uz.json + ru.json is covered** by Nunito latin / cyrillic / cyrillic-ext (0 missing).
3. **In the browser (vite preview, built page):** `document.fonts` shows `Nunito 800` and `Nunito 900` latin faces `loaded`; after switching to RU the cyrillic faces (`U+400-45F...`) load too. Canvas advance widths at 100 px, Nunito 900 vs system fallback: `ʻ` 50.0 vs 27.8, `ʼ` 38.2 vs 27.8, apostrophe `'` 26.9 vs 23.8. Different widths prove the glyph comes from Nunito, not the fallback.
4. **Visual:** zoomed screenshot of `qoʻngʻiroq` in the 900-weight hero line: heavy rounded comma, same stroke weight as the letters.

Observation (not a fallback, so no replacement per the rule): Nunito's `ʻ` has a very wide advance (0.50 em vs 0.27 em for `'`), so at display sizes it reads as `qo ʻ ng ʻ iroq` with airy gaps (hero accent line, card title, FAQ questions). Body copy uses the system font where the gap is normal. If the user dislikes it, the options are (a) accept, (b) switch UZ headings to `'` (the spec's fallback convention). I left the JSON untouched as instructed.

## 4. Responsive and visual verification (built page via `vite preview`, built-in browser pane)

Viewports driven in the pane: 1280x800, 390x844, 320x568, 900x700; both languages; both color schemes (the pane is dark by default, I forced light for the light checks).

- **No horizontal scroll** at 390 (uz and ru), 320x568 ru, 1280, 900 (`scrollWidth == clientWidth`, and an element-level audit found zero elements outside the viewport).
- **Sweep of 15 viewports x 2 languages = 30 combinations** (same-origin iframes: 320x568, 360x640, 360x800, 375x667, 390x844, 412x915, 430x932, 768x1024, 899x700, 900x700, 1024x768, 1280x720, 1280x800, 1440x900, 1920x1080), re-run on the final CSS: no horizontal overflow, primary CTA always above the fold, no overlap between the scroll hint, the note and the numeral, numeral never overlaps the copy, and **every phone stage is >= 160 px** (smallest: 160 px, hero at 320x568).
- **No mid-word breaks** in any heading, CTA, chip, label, summary at 9 sizes x 2 languages (widest word vs available width; the only hits were the hidden desktop sticky bar, a false positive).
- **FAQ:** real mouse click on "Narxi qancha?" opened that item (`open` true, answer rendered), chevron flips, summary 64 px tall.
- **Language toggle:** real click on RU sets `html lang`, title, headings (Cyrillic), `localStorage.lang = ru`; active button highlighted by `:root[lang] .lang__btn[data-lang]` with no extra script.
- **Sticky bar:** hidden by default (`visibility:hidden`, translated off-screen); with `data-visible=true` it sits at the bottom (72 px, CTA 56 px), footer padding keeps the last line clear.
- **Teaser/ended pill and phone hint:** replicated the engine's DOM swap; the grey `.cta--disabled` span has no icon and the "yoki +998..." hint shows under the note.
- **Dark mode:** `#how, #coverage, #faq, #footer` turn `--night`/`--cream`; scenes untouched.

Contrast audit (script over the real tokens, alpha blends included): all 28 pairs pass; lowest passes: white on `--red` CTA 4.68:1, `--choco-soft` on the top of the dawn gradient 5.01:1, large red numeral on dawn 3.21:1 (3:1 for large text). One real failure found and fixed: dark-mode price (`--red` on the translucent card) was 2.79:1; it now uses `--hazel` there (4.48:1).

## 5. Contract notes for Tasks 5-6 (read these)

- **Mobile scene grid:** `.scene` is `grid-template-rows: minmax(33.334svh, auto) minmax(0, 1fr)`, one column; copy is `grid-row: 1`, stage is `grid-row: 2` (explicit cells). Copy grows if needed, the stage takes the rest and has a **floor of 10rem (160 px)**: on a very short phone the scene grows past the screen instead of losing its art (without the floor the kitchen stage collapsed to 0-1 px at 320x568). Measured at 390x844 (uz): copy 620 px hero / 492 kitchen (58 svh, because of the card) / 314 call, road, door (37 svh); stage 224 / 352 / 530 px. At 375x667: stage 160 hero / 176 kitchen / 354 others.
- **>= 900 px:** columns `[gutter-1fr][copy 560][stage 560][gutter-1fr]`, copy in col 2 (vertically centered), **stage spans col 3 to the right viewport edge** (bleeds), full section height. At 1280 the stage is 640 px wide.
- **Hero deviates in one way:** `.hero__numeral` is a **direct child of `section#hero`**, a grid item sharing the stage cell (phones: top-left of the stage, size `min(--fs-numeral, 14svh)`; >= 900: top-center of the right column). So art mounted into the hero stage must leave that area clear (or sit under it; numeral has `z-index: 1`, `pointer-events: none`). On phones the hero stage has `min-height = max(10rem, numeral height + 32 px)`. Reason: with the numeral inside the copy column the hero was 5 headline lines + numeral and pushed the CTA below the fold at 1280x800 and filled the whole phone screen.
- **Hero headline:** `h1` has two block spans; `hero.title` at `--fs-display`, `hero.title2` (`.hero__line--accent`, `--red-deep`) at the h2 scale. `--fs-display` reaches 96 px at 1920 px (44 px at <= ~360 px), not at 1440: at 1280 it is 74.7 px so "Chococream tugadimi?" fits the 560 px column.
- **Scroll hint** `p.hero__scroll` is absolutely positioned bottom-left of the hero and hidden when the viewport is <= 760 px tall.
- **Header** has `data-scrolled="false"` initially; Task 6 flips it. `.lang__btn` active state is CSS-only.
- **Sticky bar** `#sticky-cta[data-visible="false"]` hides with transform/opacity + `visibility` (not focusable while hidden); Task 6 sets `data-visible="true"`.
- `#coverage [data-stage]` is **not** inside a `.scene`; use `.scene [data-stage]` for the pinned art.
- Safe-area insets are applied on header, sticky bar, scene copy, containers and hero hint.

## 6. Files changed

`index.html` (modified), `src/main.ts` (modified), new: `src/styles/layout.css`, `src/styles/scenes.css`, `src/scenes/coverage.svg`, `src/scenes/mount.ts`, `tests/markup.test.ts`, `tests/mount.test.ts`. 8 files, +1370/-12. `CLAUDE.md` and the ledger were not touched (controller's).

## 7. Self-review (against the brief and the dispatch)

- Every section and hook exists with the exact attribute names: checked by `markup.test.ts` (scenes, hero hooks, header, CTAs, sticky, phone hints, how/coverage/faq/footer).
- No literal copy: asserted in test (`doc.body.textContent` has no `105`, no `99 000`; regex `>\s*105\s*<` does not match). The only literals are the numerals 1/2/3 in `.step__num` (decorative, `aria-hidden`) and the brand word "Chocobulance" as the brand-link/title fallback text.
- Tokens, not hex: grep over `layout.css`, `scenes.css`, `coverage.svg` for `#hex`, `rgb(`, `hsl(` returns nothing.
- All 64 `data-i18n` keys used exist in both JSON files (asserted in test); keys not in the markup are exactly the scene-art/engine ones (`call.bubble`, `call.phone.label`, `door.price*`, `a11y.van`, `a11y.menu`, `cta.or`, `state.*`).
- CTAs: plain-text anchors, icon is a CSS mask on `::before`; focus ring on red button switched to `--choco`; disabled pill hides the icon.
- Caught and fixed during review: (1) hero too tall (see section 5), (2) `#hero .scene__copy` ID-specific padding overrode the desktop padding (note 2 px from the hint), (3) dark-mode price contrast, (4) FAQ title misaligned vs other sections (narrow centered container), (5) coverage chip touching the ring edge, (6) `hyphens: auto` removed from headings (it would have split words like "закончился?" mid-line).
- Tests exercise real behavior (DOM parsed from the real `index.html`, real dictionaries, real `mountScenes`), output pristine.

## 8. Not done / out of scope by design

No scene art, no GSAP, no `data-scrolled`/`data-visible` toggling, no og/hreflang tags (Task 8), no a11y/perf pass (Task 7).

## 9. Concerns for the controller

1. **`99 000` can break across lines** (seen: "Chocobulance keladi. 99 / 000 soʻm..." in step 3 on desktop). `PRICE = '99 000'` uses a plain space by design (config.ts comment). Fix is one character (U+00A0) in `config.ts` PRICE, but `tests/config.test.ts` may pin the plain space; I did not touch Task 1-2 files. Suggest folding it into Task 7/8.
2. **`ʻ` visual gaps in Nunito** (section 3): decision for the user, nothing to do unless they dislike it.
3. **Hero numeral placement deviates** from "inside copy" (section 5); it makes Task 5's hero art responsible for leaving its zone free.
4. **Hero (and, on the smallest phones, kitchen) taller than the viewport on very short screens**, a consequence of the 160 px stage floor plus a long headline: hero is taller by +96..111 px at 375x667, +121..156 at 360x640, +219..254 at 320x568, +16 at 900x700 (uz), and +62..80 on 650 px-tall laptop viewports in UZ. All other tested sizes (>= 360x800 phones, >= 768 wide with >= 720 tall) fit exactly 100 svh. The CTA is above the fold everywhere, but a pinned hero will be taller than the screen on those short devices; Task 6/7 should size pins from the real section height rather than assume 100 svh.
5. **Header over dark sections:** until Task 6 sets `data-scrolled="true"`, the transparent header's `--choco` text is unreadable over the dark static sections (it only matters if the flag is not toggled). Also `aria-pressed` on the language buttons is not set (active look is CSS from `html[lang]`); Task 7 can add it.
6. **Social links** in the footer have no `href` (inert text) with a TODO comment, since handles do not exist yet (spec section 9).
7. **dist** ships both `.woff` and `.woff2` for every Nunito subset (fontsource CSS references both); browsers only download the woff2 of the subsets actually used (latin 800/900 ~33 KB, plus cyrillic in RU). Task 7/8 can prune if the 400 KB budget needs it.
8. Commit trailer: the harness reminder suggested a different co-author line; I used the project's exact `Claude Fable 5.1` trailer as the plan, the dispatch and Tasks 1-2 require.

---

# Fix report: review round 1 (2 Important findings)

## Important 1: disabled CTA pill turned red on hover
Cause: `.cta:hover` (0,2,0, inside `@media (hover: hover)`) beat `.cta--disabled` (0,1,0); the disabled rule's selector list only covered `:active`. Confirmed in the source (not guessed).
Fix (`src/styles/layout.css`): added `.cta--disabled:hover` to the disabled rule's selector list. It has the same specificity as `.cta:hover` and sits later in the file, so it wins. No `:focus-visible` addition: the pill is a `<span>` (not focusable) and the base `.cta:focus-visible` rule only sets `outline-color`.
Test (`tests/layout-css.test.ts`, new, source-level because jsdom has no `:hover`): parses the innermost `selectors { body }` blocks of `layout.css` and asserts that a rule with `.cta--disabled:hover` exists, comes after every `.cta:hover` rule, and sets `background: var(--grey-out)` and `color: var(--choco-soft)`.
RED first: `npx vitest run tests/layout-css.test.ts` -> `Tests  2 failed (2)` (`expected 0 to be greater than 0`: no `.cta--disabled:hover` rule).
Real-browser check (built page, `vite preview`, 1280x800): swapped the hero CTA for the engine's teaser pill (`span.cta.cta--disabled[data-cta]`), moved the real pointer over it with the browser tool; `el.matches(':hover') === true` and computed `background-color: rgb(217, 212, 204)` (= `--grey-out`), `color: rgb(107, 67, 40)` (= `--choco-soft`), `cursor: default`, `transform: none`. Same pill before hover: identical values.

## Important 2: `{price}` wrapped as "99 / 000 soʻm"
Fixes:
- `src/config.ts`: `PRICE = '99 000'` (no-break space written as an escape so it cannot be lost by an editor), doc comment updated.
- `tests/config.test.ts`: `expect(PRICE).toBe('99 000')`.
- `tests/i18n.test.ts` (covered by the same change, not named in the ruling): `t('door.price','uz')` now expects `'99 000 soʻm'` because that test reads the real config; and the "no literal price in copy" guard was widened from `not.toContain('99 000')` to `not.toMatch(/99\s000/)` (`\s` also matches U+00A0) so it keeps guarding the NBSP form too.
- `src/styles/layout.css`: `white-space: nowrap` on `.price-card__price` (insurance).
- `tests/markup.test.ts` needed no change: its price guard is `/99[\s ]?000/`, which already tolerates NBSP (confirmed: it passes, and the regex names U+00A0 explicitly). The mocked `PRICE: '99 000'` in `tests/main.test.ts` and `tests/state.test.ts` are fixtures of their own and were left alone.
RED first: `npx vitest run tests/config.test.ts tests/i18n.test.ts` -> `config defaults` and `t fills templates` failed (`expected '99 000' to be '99 000'`, plain space vs NBSP), `Tests  2 failed | 15 passed`; the layout-css nowrap assertion was also RED (above).
Real-browser check (built page, uz and ru x 320x568, 360x800, 390x844, 768x1024, 1280x800): walked every text node containing the price (hero note, how step 3, coverage price + FAQ answer 3 = 4 per page, 40 in total) and checked the range's client rects: all on a single line, none contains a plain-space price; the nowrap price card text fits its card at 320 px (224 px in a 288 px card) with no horizontal overflow.

## Commands and output (after the fixes)
```
$ npx vitest run tests/markup.test.ts tests/config.test.ts tests/layout-css.test.ts tests/i18n.test.ts
 Test Files  4 passed (4)
      Tests  28 passed (28)
$ npx vitest run
 Test Files  7 passed (7)
      Tests  43 passed (43)        # 41 before + 2 new layout-css tests; no warnings
$ npx tsc --noEmit                 # TypeScript: No errors found (exit 0)
$ npx prettier --check index.html vite.config.ts src tests   # All files formatted correctly
$ npm run build                    # built in 76ms
```

## Changed in this round
`src/config.ts`, `src/styles/layout.css` (+2 lines), `tests/config.test.ts`, `tests/i18n.test.ts`, new `tests/layout-css.test.ts`. Nothing else touched; Minor findings stay deferred. Note: an untracked `.claude/launch.json` appeared in the working tree (written by the desktop browser-pane tooling when the preview was started); it is not part of this task and is not committed.
