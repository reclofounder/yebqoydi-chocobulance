# Task 4 report: Van component

**Status:** DONE_WITH_CONCERNS
**Commit:** `8a470d3 feat: swappable van component with wheel rotation` (on `main`, not pushed; `.claude/launch.json` left untracked)

## What I implemented

- `src/van/van.svg`: placeholder van, `viewBox="0 0 480 240"`, facing right, colours only via tokens, no filters or raster images. Contains the six contract ids `van-shadow`, `van-body`, `van-siren`, `siren-light` (a `rect`), `van-wheel-rear`, `van-wheel-front`. It also has `preserveAspectRatio="xMaxYMax meet"` (see the hero placement section). Its header comment holds the swap rules.
- `src/van/van.ts` exports:
  - `VAN = { width: 480, height: 240, wheelRadius: 26, wheelCenters: [{x:118,y:196},{x:362,y:196}] } as const`, verbatim from the brief.
  - `wheelRotation(distancePx, radiusPx = VAN.wheelRadius)`, which returns `distance / (2πr) * 360`. A positive distance gives a positive (clockwise) angle.
  - `mountVan(target, { id }?)`, which:
    - parses `van.svg?raw` with `DOMParser('image/svg+xml')` and throws a clear error on malformed art or a non-`<svg>` root, then imports it into the page's document;
    - suffixes every id (root included) with `-${id}`;
    - rewrites the art's own references to those ids: `url(#x)` in any attribute (quoted or not, `style` included), `url(#x)` inside `<style>` blocks, and `href` / `xlink:href="#x"`. References to ids outside the art are left alone;
    - adds class `van` and `data-van="${id}"`;
    - removes any `aria-hidden`, sets `role="img"` and `data-i18n-attr="aria-label:a11y.van"`, and sets `aria-label` immediately with `t('a11y.van')`;
    - appends to `target` and returns the `SVGSVGElement`.
  - If no id is given, a counter (`1`, `2`, …) is used so vans still coexist. Ids outside `[\w-]+` throw, because they would break `url(#…)` references.
- `src/styles/van.css` (imported in `main.ts` after `scenes.css`):
  - `.van { display:block; width:100%; height:auto }`;
  - `.van [id^='van-wheel-'] { transform-box: fill-box; transform-origin: center }`. The prefix match is needed because ids are suffixed;
  - the hero placement rules. Nothing is inside the SVG as a `<style>`.
- `src/scenes/mount.ts`: after the coverage mount, `mountScenes` calls `mountVan(heroStage, { id: 'hero' })` when `#hero [data-stage]` exists and has no element children. This makes it idempotent.
- `src/main.ts`: boot order is now `mountScenes → applyI18n → applyMode → applyPhoneHint`, with a one-line comment. `tests/main.test.ts` needed no change.
- `src/vite-env.d.ts`: **not added**. `tsconfig.json` already lists `"types": ["vite/client", …]`, which declares `*?raw`, and `coverage.svg?raw` already type-checked. `npx tsc --noEmit` is clean.

## How the van is composed (for judging the art without reading the SVG)

Paper-cut flat shapes. The body and livery have no outlines; depth comes from layering.

- **`#van-shadow`:** two concentric choco ellipses under the wheels (rx 226 at 8% opacity, rx 192 at 16%), giving a soft ground shadow without filters.
- **`#van-body`**, drawn back to front:
  - Grey-out bumper ends peek out at front and rear, behind the body.
  - A "paper layer" shadow: the body silhouette repeated, offset (+3, +4), choco at 12%. It gives the right and bottom edges definition against the pale dawn sky.
  - **Silhouette:** one white path for a high-roof panel van. Rounded rear corners, flat roof, then a rounded cab: the roof curves down into a raked windscreen, a short hood and a rounded nose. It is defined once in `<defs>` (`#van-shape`) and reused via `<use>` for the fill, the shadow and a `clipPath`.
  - **Livery, clipped to the silhouette** so it follows the curves:
    - red roof block (top band, y ≤ 56, wraps over the cab curve);
    - red side stripe (y 144–160, full length);
    - 3 px choco 12% shade lines under both red bands (the layered-paper look);
    - a faint lower-body shade;
    - grey-out lower cladding;
    - wheel arches: a grey-out flare (r 33) around a choco 70% well (r 29). The well is lighter than the tyre so the two don't merge.
  - **Cab:**
    - side window in `--sky-day-bottom` with a 3 px choco frame, its front edge raked parallel to the windscreen. The frame is needed because the pale glass is nearly invisible on white;
    - door seam line at x = 306;
    - choco-soft door handle;
    - choco-soft wing mirror on a stalk, standing just ahead of the A-pillar.
  - **Lights:**
    - cream headlight with a choco-soft rim on the nose;
    - small hazel indicator below it;
    - red-deep tail light on the rear edge.
  - **Emblem:** centred on the box side above the lettering. A red rounded cross with a glossy choco chocolate drop over its centre, plus a small hazelnut at the drop's lower right: hazel shell, pointed choco-soft tip, cream base, thin choco-soft outline.
  - **Lettering:** "Chocobulance" as `<text>`, centred on the side panel, `var(--font-display)` 900, 30 px, `var(--red)`, `aria-hidden="true"`. `textLength="202"` is pinned to Nunito's measured width, so a fallback font is stretched to the same width instead of overflowing the panel.
  - **`#van-siren`:** on the roof above the cab door. A grey-out base, the `rect#siren-light` (red, rx 8, a dome-like pill) and a white highlight that stays when the light pulses.
- **`#van-wheel-rear` / `#van-wheel-front`** (drawn last, in front of the arches), each at its `VAN.wheelCenters` point:
  - choco tyre r = 26;
  - choco-soft rim r = 18;
  - five white 2 px round-capped spokes at 72° steps from the centre to r = 17;
  - grey-out hub r = 10;
  - choco-soft centre nut r = 3.5.
  - The tyre is the largest shape in the group, so the group's fill-box is centred on the axle.

Colours used: `--white`, `--red`, `--red-deep`, `--choco`, `--choco-soft`, `--hazel`, `--cream`, `--grey-out`, `--sky-day-bottom`, `--font-display`. Size: 6.7 KB raw, 2.1 KB gzip.

## Hero placement

- **Desktop (≥ 900 px):** `position:absolute; right: gutter (safe-area aware); bottom: --s2; max-width: min(68%, 44rem)`. At 1280×800 the van is 435 px wide in the bottom-right of the stage, with the "105" well above it (about 320 px gap).
- **Phones:** `max-width: 58%` and `bottom: --s1`. This deliberately deviates from the suggested ~68%. At 390×844 the 68% van's roof ran 6 px into the "105" ink, and its rear bumper touched the "Pastga aylantiring" hint. At 58% the roof clears the numeral by 18 px and the bumper clears the hint.
- **Height cap:** `max-height: calc(100% - bottom)`. On a stage shorter than the van (landscape 844×390) the box is height-capped, and `xMaxYMax meet` keeps the drawing parked bottom-right instead of covering the copy (verified).

## Verification

### Tests

`npx vitest run` → **8 files, 55 tests passed** (the 43 existing plus 12 new). Output is clean: no warnings or errors (grep count 0).

`tests/van.test.ts` (11):
- `wheelRotation`: the circumference gives 360 and 0 gives 0; a custom radius works (π·10 at r = 10 gives 180); negative distance gives −360.
- `van.svg`:
  - the viewBox equals `VAN.width/height`;
  - all six part ids exist and `siren-light` is a `rect`;
  - for each wheel, the largest circle has `r === VAN.wheelRadius` and its `cx/cy` equal `VAN.wheelCenters[i]`. This guards the swap contract;
  - a source scan finds every `fill` / `stroke` / `stop-color` is `none`, `currentColor`, `var(--…)` or `url(#…)`, and there is no `<filter>`, `<image>`, `<foreignObject>` or `filter:`.
- `mountVan`:
  - suffixed ids, including `#van-wheel-front-hero` and `#siren-light-hero`; every id ends in `-hero`; `.van` and `data-van`; the result is an `SVGSVGElement` appended to the target;
  - two vans (`hero` and `road`) produce no duplicate ids in the document, and every internal reference resolves inside its own van;
  - two vans without ids get distinct suffixes;
  - an invalid id throws and nothing is mounted;
  - accessibility: `role=img`, `data-i18n-attr`, and `aria-label` equal to `uz['a11y.van']`; `<text>` is `aria-hidden`; after `applyI18n(document,'ru')` the label equals `ru['a11y.van']`.
- **Swapped art:** `vi.doMock` replaces `van.svg?raw` with designer-style art (XML prolog, `xlink:href`, `url('#clip')`, `url( #paint )`, a `<style>` block, and an outside reference). The test asserts every reference is rewritten and the outside one is left alone.
- **`van.css` source guard:** the wheel rule has `transform-box: fill-box` and `transform-origin: center`.

`tests/mount.test.ts` (+1): the hero stage gets exactly one `svg.van` with `data-van="hero"` and `#van-wheel-front-hero`, and a second run adds nothing.

### TDD evidence

- **RED 1:** `npx vitest run tests/van.test.ts` → `Error: Failed to resolve import "../src/van/van" from "tests/van.test.ts". Does the file exist?` (Test Files 1 failed, no tests).
- **RED 2:** `npx vitest run tests/mount.test.ts` → `× parks one van in the hero stage, once` / `AssertionError: expected to have a length of 1 but got +0` (1 failed, 3 passed).
- **GREEN, step 1** (svg + van.ts): `npx vitest run tests/van.test.ts` → 10 passed, 1 failed. The failure was `ENOENT … src/styles/van.css`, expected because the CSS did not exist yet.
- **GREEN, step 2** (mount + main + van.css): `npx vitest run` → `Test Files 8 passed (8) / Tests 55 passed (55)`.
- **Final (after art iterations):**
  - `npx prettier --check src tests` → clean;
  - `npx vitest run` → 55 passed;
  - `npx tsc --noEmit` → "No errors found";
  - `npm run build` → built, with the JS bundle at 24.5 kB (8.4 kB gzip).

### Visual check

Run on `npm run build && npx vite preview --port 4174`, in the Browser pane.

- Rendered at 1280×800 and 390×844. I also enlarged a clone of the van on the lightest sky colour (debug overlay only) to judge details, and iterated three times:
  - added the paper-layer shadow and the band shade lines;
  - redrew the hazelnut, which first read as a blob;
  - lightened the wheel wells so the tyres don't merge into them.
- A sweep in same-origin iframes (360×780, 375×667, 390×844, 430×932, 768×1024, 844×390, 900×600, 1280×800, 1440×900, 1920×1080) measured whether the van's roof clears the numeral's ink, the bumper clears the scroll hint, and the page has no horizontal overflow. There is no overflow at any size. Clashes remain only at 360×780 and 375×667 (concern 2).
- **Wheel pivot, live:** with `style.transform = rotate(37deg)` on each wheel group, the tyre's on-screen centre is unchanged (front 1141.02, 744.11 before and after) while the spokes move. Computed values: `transform-box: fill-box`, `transform-origin: 26px 26px`.
- **Language toggle, live:** the label switches uz "Chocobulance mashinasi" ↔ ru "Машина Chocobulance". `role="img"`. No console messages.

Screenshots are in `.superpowers/sdd/2026-10-20-chocobulance-landing/task-4-shots/` (git-ignored):
- `hero-1280x800.jpg`
- `hero-390x844.jpg`
- `van-enlarged.jpg`
- `hero-844x390-landscape.jpg`
- `hero-360x780-overlap.jpg`

## Files changed

- `src/van/van.svg` (new)
- `src/van/van.ts` (new)
- `src/styles/van.css` (new)
- `tests/van.test.ts` (new)
- `src/scenes/mount.ts` (hero van mount)
- `src/main.ts` (van.css import, boot order)
- `tests/mount.test.ts` (+1 test)

## Self-review

- All six ids are present and suffixed: tested.
- `url(#…)` and `href` references are rewritten, so two vans coexist: tested with the real art (`clip-path`, `<use href>`) and with the mocked designer art (`xlink:href`, quoted url, `<style>`).
- `wheelRotation` math and sign: tested.
- `VAN` matches the drawn wheel centres and radius exactly: measured by a test against the SVG.
- Tokens only, no filters or raster: tested by a source scan.
- Test output is clean.
- Removed an unneeded `overflow: visible` on `.van` (nothing is drawn outside the viewBox).

## Concerns

1. **GSAP and the wheel pivot (affects Task 6).** GSAP writes SVG transforms as a `transform` attribute. It bakes the origin into the matrix assuming the default `transform-box: view-box`, and forces an inline `transform-origin: 0px 0px` (`node_modules/gsap/CSSPlugin.js:796`). It never resets `transform-box`. Under the contract's `fill-box`, a GSAP-style write makes the wheel orbit off its axle. I measured this by mimicking GSAP's write (`style.transformOrigin='0px 0px'` plus `transform="rotate(37 118 196)"`): the tyre centre moved from (151.7, 833.3) to (195.2, 825.7). With `view-box` it stays put. CSS transforms work correctly, as verified above.
   - **Recommendation for Task 6:** turn the wheels with `wheel.style.transform = \`rotate(${deg}deg)\`` in the ScrollTrigger update, or with a `--wheel-turn` custom property set on the van root and a matching CSS rule. Do not use GSAP `rotation` / `svgOrigin` on the wheel groups.
   - I kept the brief's contract and put this warning in the comment above the wheel rule in `van.css`.
2. **Phones with a short hero stage.** At 360×780 and 375×667 the phone stage sits at its 10rem (160 px) floor. The van's roof runs 35 px and 25 px respectively into the bottom of the "105" ink (the numeral is drawn on top, z-index 1). At 360×780 the rear wheel area also touches the "Pastga aylantiring" hint. At 160 px a ~83 px numeral and a readable van cannot be stacked, and a van small enough to fit (about 100 px wide) would look lost. Larger phones (390, 430), tablets, landscape and desktop are clean.
   - Task 5's planned `aspect-ratio: 4/5` mobile stage (≥ 288 px at 360 px wide) removes the clash with no change to `van.css`.
   - If Task 5 doesn't do that for the hero, raise the hero stage floor on phones to fit the numeral plus the van (about +40–50 px).
   - I did not override stage geometry from `van.css`.
3. **Phone width is 58%, not ~68%.** Reason in the hero placement section. Desktop uses 68%, capped at 44rem (704 px) so ultra-wide screens don't get a giant van.
4. **Mount condition is "stage is empty" (controller ruling).** If Task 5 injects `hero-bg` into the same stage first, the van would be skipped. Task 5 should mount the van first, or switch the check to `!hero.querySelector('.van')`.
5. **`preserveAspectRatio="xMaxYMax meet"` lives in `van.svg`.** It doesn't matter for a road van whose height follows its width. Whoever swaps in the final art should keep it; it is noted in the SVG header comment.
6. **`<style>` rewriting covers `url(#…)` only.** It does not rewrite `#id` selectors in `<style>` blocks. Design-tool exports use class selectors, so this is fine in practice.
7. **Commit trailer.** The task asked for `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` (as on earlier commits). This commit was authored by Claude Opus 5.5, and my session's attribution rule requires crediting the model that actually wrote it, so the trailer reads `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. If you want uniform history, amend it with `git commit --amend` (not pushed).
