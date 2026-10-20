# Task 5 report: Scene illustrations and mounting

**Status:** DONE_WITH_CONCERNS
**Commit:** `a788ed6 feat: paper-cut Tashkent scenes` (on `main`, not pushed). Not committed: `CLAUDE.md` (controller's edit) and `.claude/launch.json`.

## What I implemented

- **Eight drawings** in `src/scenes/`: `hero-bg`, `kitchen`, `call`, `road-sky`, `road-far`, `road-mid`, `road-near`, `door`.
  - Hand-written SVG. Paints are `var(--token)` only, plus `--road-sky-top/bottom`, which fall back to the dawn tokens.
  - No hex colours, filters, `<image>` or `<foreignObject>`.
  - Gradients have two stops at most.
  - Shapes are flat with rounded corners. Depth comes from layering and opacity.
  - Every root has `class="scene__art"`, `aria-hidden="true"` and `focusable="false"`.
  - Ids are prefixed per scene (`kitchen-tiles`, `road-far-lattice`, …), so no id repeats on the page (tested).
- **`src/scenes/mount.ts`**:
  - A table of stage selector → drawings (back to front) and an optional van id.
  - For each stage that exists, `mountScenes`:
    - removes every node that is not a `[data-van]`, including the whitespace between drawings;
    - inserts the drawings at the start of the stage;
    - mounts the van only if `[data-van="<id>"]` is missing. The hero van is `hero`, the road van is `road`, mounted last so it sits above the near layer.
  - Re-running keeps the existing vans: the same nodes survive, with any state Task 6 put on them. Nothing is duplicated (tested on node counts).
  - The coverage mount is unchanged in behaviour.
- **`src/van/van.ts`**: one `setAttribute('preserveAspectRatio', 'xMaxYMax meet')` in `mountVan` (ruling 2). It is tested with swapped art that lacks the attribute.
- **`index.html`**: added a `.scene__overlay` (`aria-hidden="false"`) after the stage in `#scene-call` and in `#scene-door` only:
  - call: `<p id="bubble" class="bubble" data-i18n="call.bubble">`;
  - door: `<div id="price-badge" class="price-badge">` with `p[data-i18n="door.price"]` and `p[data-i18n="door.price.note"]`.
- **`src/styles/scenes.css`**:
  - **Stage geometry** (decision below). `.scene__stage` and `.scene__overlay` share the same cell, aspect ratio and alignment, so the overlay box is identical to the stage box (measured at every size).
  - **Layers** are absolutely stacked (`inset: 0; width/height 100%`). Far, mid and near are `width: 200%`.
  - **Cards:** kitchen, call, road and door stages are rounded paper cards with `overflow: clip` and a soft shadow.
    - Phones: a sheet rising from the bottom (top corners rounded).
    - Desktop: bleeds off the right edge (left corners rounded).
  - **The hero is open sky**, not a card. Its drawing may overflow, so the street runs on under the copy column on desktop.
  - **`--road-sky-top` / `--road-sky-bottom`** are defined on `[data-scene=road]`. The section's background and `road-sky.svg` both paint with them.
  - **Bubble and badge styles.**
  - **Pivots:** `#door-leaf { transform-box: fill-box; transform-origin: left center }` and `#heart-l, #heart-r { fill-box; center }`.
  - **Hero changes:**
    - removed the phone-only `min-height` rule (the aspect ratio replaces it);
    - the scroll hint is restyled (see deviations).
- **`src/styles/van.css`**: road van `#scene-road .van { position:absolute; left:0; bottom:2%; width:44% }`, and `width:34%` from 900 px.
- **`src/main.ts`**: unchanged. The boot order is already `mountScenes → applyI18n` (Task 4 ruling), so the overlays and the vans get translated.

## Scene compositions

Each drawing is 800 wide.
- **Kitchen, call, door** are `800×500` with `xMidYMax slice`. Phones (4:5) see the story crop x 200–600 × y 0–500. Desktop (16:9) sees x 0–800 × y 50–500, so the wings (x < 200, x > 600) are extras.
- **Road layers** are 1600×450 with `xMinYMax slice`. Phones only ever see x 0–720.

Full-art renders are in `task-5-shots/art-*-full.jpg`.

- **Hero.** Transparent sky (the section's dawn gradient).
  - Low skyline in one soft hazel tone, composed around the van and the numeral: a low dawn sun and blocks of flats at the far left, Hotel Uzbekistan's lattice slab left of the van, and a tall block plus the TV tower (tripod legs, two decks, spire) rising above the van's roof.
  - A golden plane tree and a lamp post stand between the hotel and the van.
  - Grey sidewalk, white curb, then a chocolate road band (y 368–450) that extends far left. The cream "Pastga aylantiring" hint is written on it.
  - Phones: the numeral's top-left zone stays free of art (the skyline sits below or right of it).
  - Desktop: the stage is bottom-aligned, so the street runs along the bottom of the whole viewport and the van parks on it at the right.
- **Kitchen** (morning, cream wall, peach tiled splashback, wood floor).
  - Window (top-left) with a dawn gradient, sun, roofs and a tiny TV tower. A white light beam falls on the tub.
  - Red pendant lamp. Table with a non on a plate.
  - The patient: an empty red Chococream tub with a cream inside, a chocolate smear, and three drips of different lengths over the rim. `#tub-lid` leans on its right.
  - A cotton-pattern choynak and a piyola.
  - The kid, seen from behind (blue T-shirt, shorts, cowlick), leans in toward the tub.
  - **Dad** (`#dad-peek`) at the right door frame: sky-blue sleeve, a fist holding a spoon with chocolate, side-eye, raised brows, moustache with a smear, and a crumb.
    - He is drawn before the white casing, the dark doorway (which has a lit room at its end, for depth) and the wall beyond it.
    - So a +140 px slide tucks him into the dark hall: at 1280 px he ends ≈ 175 units right, still behind the doorway (566–706) and the wall patch (to 800).
  - A trail of chocolate drops leads to the doorway.
  - Desktop wings: a fridge with the kid's drawing of the van and a red-cross magnet; a clock.
- **Call** (peach card on the cream section). White signal rings radiate from the phone.
  - Left: the kid's hand (blue sleeve, hazel fingers) holds a dark phone tilted 8°. Its dial pad shows aria-hidden digits; keys 1, 5 and 0 are lit red with white numerals.
  - `#call-line` is a red dashed arc from the phone's edge to the headset.
  - Right: the dispatcher behind a hazel desk:
    - hair bun, headset with a red mic tip, smile;
    - white coat with brown lapel trim over a red top;
    - chocolate badge: a cream drop on a red cross, on a choco disc with a hazel ring.
  - The HTML bubble sits above her head, tail pointing down at her.
  - Desktop wings: a clock at ten past seven, a framed city-ring map, and a monitor with a dispatch map and a red pin.
- **Road** (four layers).
  - **Sky:** gradient from the road-sky variables, a sun, four clouds.
  - **Far** (hazel at 55 %, with lattice and window patterns): TV tower, Hotel Uzbekistan (moved clear of Chorsu), flats. Desktop-only: Tashkent City towers and a minaret.
  - **Mid:** Chorsu bazaar (big sky-blue dome with white ribs, hazel band and finial, cream drum with arched windows, two small domes), golden plane trees, cream houses with red-deep roofs.
  - **Near:** grey sidewalk with lamp posts, a white board with a red metro "M" (a path, not text), a bus stop (red-deep roof, glass, bench, bus sign), benches and bins, curb, chocolate road, and `#road-lines` (cream centre dashes).
  - The van waits at the card's left edge on the near lane.
- **Door** (hall with cream and peach striped wallpaper).
  - `#door-leaf` is a chocolate-bar front door: eight choco segments with hazel bevels, hinges left, lever and peephole right, on a white casing and a red-deep mat.
  - Behind the door: a bright sky-blue stairwell with a window and a handrail.
  - The choco-medic stands there: white cap with a red cross, white coat with brown trim, red bag with a white cross on a red-deep strap. He holds `#tub-full` (lid on).
  - The kid, in three-quarter view facing the door, reaches out with an open-mouthed grin. `#heart-l` and `#heart-r` are over the eyes.
  - `#dad-thumb`: Dad leans out of the next room's doorway with closed happy eyes, still a chocolate smear on his moustache, giving a thumbs-up.
  - The tilted red price tag (HTML) sits top-right on the wall.
  - Desktop wings: a coat on a hook, a red backpack, shoes, and a framed heart.

## Final id contract (for Task 6)

All animated SVG parts are `<g>` or `<path>` with **no `transform` attribute of their own**, so a CSS transform won't wipe their placement. SVG parts are drawn in their final appearance. The **exception is the door**, whose untransformed state is closed, because the plan defines its motion as rotateY 0 → −100°.

| Scene | Hook | What it is | Drawn state | Intended motion |
| --- | --- | --- | --- | --- |
| hero | `[data-van="hero"]`: `#siren-light-hero`, `#van-wheel-front-hero`, `#van-wheel-rear-hero` | parked van (Task 4) | parked | siren pulse, idle bob |
| kitchen | `#dad-peek` | `g`: head, spoon hand, crumb | peeking | `x` 0 → +140 px, opacity → 0 (slides behind the doorway) |
| kitchen | `#tub-lid` | `g` | leaning on the tub | free |
| call | `#digit-1`, `#digit-0`, `#digit-5` | `g`: red key plus white numeral, laid over the plain key | lit | opacity 0 → 1 |
| call | `#call-line` | `path`, `pathLength="1"`; the dasharray is 11 dashes over [0, 1) and a gap over [1, 2) | drawn (offset 0) | `stroke-dashoffset` 1 → 0. 1 = hidden, 0.5 = first half drawn from the phone, 0 = full (verified in the browser). **Do not overwrite `stroke-dasharray`**: it carries the dashes. |
| call | `#bubble` | **HTML** `p` in `#scene-call > .scene__overlay`, `transform-origin` at its tail (`var(--tail) 100%`) | final | scale 0 → 1 `back.out(1.4)` |
| road | `.layer-sky` | sky `svg`, stage-sized | static | colours via `--road-sky-top` / `--road-sky-bottom` set on `#scene-road` (both default to the dawn tokens) |
| road | `.layer-far`, `.layer-mid`, `.layer-near` | `svg`, 200 % of the stage width, viewBox `0 0 1600 450`, `xMinYMax slice` | translate 0 | `translateX` 0 → at most −50 % of their own width (= one stage width) |
| road | `#road-lines` | `g` in `.layer-near` | | free |
| road | `[data-van="road"]`: `#van-wheel-front-road`, `#van-wheel-rear-road`, `#siren-light-road` | van, mounted last | `left:0; bottom:2%`, 44 % / 34 % wide | `x` −20 % → 110 % of the stage width; wheels via `style.transform` |
| door | `#door-leaf` | `g`; CSS `transform-box: fill-box; transform-origin: left center` | **closed** | `style.transform = perspective(900px) rotateY(0 → -100deg)`, which looks right in Chrome (shots) |
| door | `#tub-full` | `g`, in the medic's hands, hidden by the closed door | final | free |
| door | `#heart-l`, `#heart-r` | `g`; CSS `fill-box`, `center` | popped | scale 0 → 1 |
| door | `#dad-thumb` | `g` | visible | opacity 0 → 1 |
| door | `#price-badge` | **HTML** `div` in `#scene-door > .scene__overlay`; tilt via the `rotate` property (composes with `transform`), `transform-origin: 50% 0` | final | `y` +24 → 0 |

## Stage ratio decision

- **Phones (< 600 px): 4:5**, per the ruling.
- **≥ 900 px: 16:9**, per the ruling.
  - Cards are `align-self: center` in the right column.
  - The hero stage is `align-self: end`, so its street sits on the viewport's bottom edge.
- **Hero: 16:9 at every width** (ruling 5's escape hatch).
  - The CTA is in the copy row, so it stays above the fold with any stage ratio.
  - But a 4:5 hero stage at 390×844 makes the hero 1107 px tall, with the parked van's roof ~140 px below the fold. That also means the van would be off-screen in a pinned hero.
  - With 16:9: copy 620 + stage 219 = **844, exactly one screen**, with the van in it.
- **Tablets (600–899 px): 4:3.** This extends the ruling, which only named phones and desktop.
  - A 4:5 stage is 960 px tall at 768 px wide. Call, road and door scenes became 1301 px on a 768×1024 screen.
  - With 4:3 they are 1024 px (kitchen 1062).
  - The 4:3 crop shows x 67–733 of the drawings, so the whole story area plus part of the wings.
- **Scrims:** none needed. On phones the copy is above the stage and on desktop beside it; no art sits behind copy anywhere.

**Hero verification (measured in same-origin iframes, then screenshotted):**

| Size | Result |
| --- | --- |
| 390×844 | Hero 844 px (copy 620, stage 390×219). Van roof clears the numeral's ink by 19 px (uz) / 34 px (ru). CTA bottom at 474. Hint on the road, 9 px clear of the bumper. |
| 375×667 | Stage 375×211. **Roof clears the numeral by 27 px** (the Task 4 overlap is gone). CTA bottom at 472. The hint is hidden there by the existing max-height rule. |

**Sweep: 12 sizes × uz/ru** (320×568, 360×640, 360×780, 375×667, 390×844, 430×932, 768×1024, 900×700, 1024×768, 1280×800, 1440×900, 1920×1080), plus 600×960, 820×1180 and 899×700:
- no horizontal overflow;
- the CTA is always above the fold;
- the roof always clears the numeral (min 9 px at 360×780);
- the overlay box always equals the stage box;
- the bubble and badge always lie inside their stage;
- the scroll hint is always on the road and clear of the van.

**Scene heights on phones, for Task 6's pins:**
- call, road and door fit exactly 100 svh at ≥ 360×780;
- they exceed it on short phones (375×667: 782; 320×568: ~712–747);
- the kitchen is always taller than the screen on phones (980 at 390×844, because of its card copy).

Pin by real section height, as already noted in Task 3.

## Asset sizes

| File | Bytes |
| --- | --- |
| `call.svg` | 8 701 |
| `door.svg` | 11 908 |
| `hero-bg.svg` | 4 111 |
| `kitchen.svg` | 11 500 |
| `road-far.svg` | 2 965 |
| `road-mid.svg` | 3 895 |
| `road-near.svg` | 4 115 |
| `road-sky.svg` | 1 443 |
| **Scene art total** | **48 638** |
| `coverage.svg` (Task 3) | 4 463 |

- Each drawing is under 20 KB and the total is under 100 KB (both guarded by a test).
- `npm run build`: JS **73.59 kB (19.95 kB gzip)**, CSS **21.11 kB (5.34 kB gzip)**. For comparison, Task 4's bundle was 24.5 kB JS.

## Tests and TDD evidence

**`tests/scenes.test.ts`** (new, 19 tests). It loads the real `index.html` body into jsdom.

On the real page, after `mountScenes(document)`:
- paint order per stage:
  - hero: `[art, van:hero]`;
  - road: `[layer-sky, layer-far, layer-mid, layer-near, van:road]`;
  - each other scene: `[art]`;
- every contract id exists exactly once, inside its own `[data-scene]`, and the hinged and popping parts are `g`;
- no id repeats anywhere on the page;
- overlays:
  - `.scene__overlay` exists only in call and door, right after the stage, with `aria-hidden="false"`;
  - `#bubble` and `#price-badge` are HTML elements carrying the three `data-i18n` keys;
- all eight scene SVGs have `aria-hidden="true"` and `focusable="false"`; the only `<text>` is in the call scene, each `aria-hidden`, each a single `[0-9*#]`;
- `#call-line` is a path with `pathLength="1"`;
- far, mid and near have viewBox `0 0 1600 450` and `xMinYMax slice`;
- a second run keeps one hero van and one road van (the same nodes), the same contents and the same child-node counts, and one coverage SVG.

Sources:
- each paint is `none | url(#id) | var(--token[, var(--token)])`, with token names checked against `tokens.css` plus the two road-sky variables;
- no filter, image, foreignObject, script, `rgb()` or `hsl()`;
- size budget.

CSS guards:
- 4:5, 4:3 (600–899) and 16:9 (≥ 900) stage ratios, and the hero at 16:9;
- `#door-leaf` has `fill-box` and `left center`.

**`tests/van.test.ts`** (+1): swapped art without `preserveAspectRatio` gets `xMaxYMax meet` from `mountVan`.

**`tests/mount.test.ts`**: unchanged. No expectation conflicted; the hero test still passes with the backdrop present.

**RED → GREEN:**
1. `npx vitest run tests/scenes.test.ts` → suite failed: `ENOENT … src/scenes/hero-bg.svg`.
2. `npx vitest run tests/van.test.ts` → `AssertionError: expected null to be 'xMaxYMax meet'` (1 failed, 11 passed). Added the `setAttribute` → 12 passed.
3. Art + `mount.ts` → full suite 4 failed (`bubble: expected to have a length of 1 but got +0`, overlays `[]`, two CSS guards). Added the `index.html` overlays and the CSS → 75 passed.
4. Self-review RED: the child-node idempotence check got `expected [ 4, 3, 3, 13, 3 ] to deeply equal [ 3, 2, 2, 9, 2 ]` (whitespace nodes piling up on a re-run). Fixed `mountScenes` to remove all non-van nodes → 75 passed.

**Final:**
- `npx vitest run` → **9 files, 75 tests passed**, with no warnings or stderr;
- `npx tsc --noEmit` → no errors;
- `npx prettier --check index.html vite.config.ts src tests` → clean;
- `npm run build` → OK.

## Visual verification

Built with `npm run build`, served with `vite preview --port 4174` (I added a `chocobulance-preview-4174` entry to the untracked `.claude/launch.json`). Checked in the Browser pane at 390×844, 375×667, 768×1024 and 1280×800, in uz and ru. Each drawing was also rendered standalone at 2x with headless Chrome to judge details.

Iterations from what I saw:
- the tub's symmetric drips read as eyes; redrawn as three drips of different lengths;
- redrew the kid's torso and arms, Dad's arm and fist, the coat and backpack, and Dad's thumbs-up (it read as a pointing finger);
- added a lit room inside the dark doorway;
- moved the teapot clear of the frame, Hotel Uzbekistan clear of Chorsu, and the hero sun clear of the hotel;
- rebuilt the hero skyline around the van and the numeral, because the van hid most of it;
- moved the tub fully inside the door opening;
- reset the clock hands, which overlapped.

Screenshots are in `.superpowers/sdd/2026-10-20-chocobulance-landing/task-5-shots/` (git-ignored):
- `hero-390x844-uz`, `hero-375x667-uz-stage`, `hero-1280x800-uz`;
- `kitchen-390x844-uz`, `kitchen-1280x800-uz`;
- `call-390x844-uz`, `call-390x844-ru`, `call-1280x800-ru`, `call-768x1024-uz-tablet`;
- `road-390x844-uz`, `road-1280x800-ru`, `road-768x1024-uz-tablet`;
- `door-390x844-uz-closed-as-drawn`, `door-390x844-uz-opened-by-js`, `door-1280x800-ru-opened-by-js`;
- `art-{kitchen,call,door,door-open,road,hero-bg}-full`.

## Files changed

- New: `src/scenes/hero-bg.svg`, `kitchen.svg`, `call.svg`, `road-sky.svg`, `road-far.svg`, `road-mid.svg`, `road-near.svg`, `door.svg`, `tests/scenes.test.ts`.
- Modified: `src/scenes/mount.ts`, `src/van/van.ts`, `src/styles/scenes.css`, `src/styles/van.css`, `index.html`, `tests/van.test.ts`.

## Self-review

| Check | Result |
| --- | --- |
| Every contract id exists exactly once, inside its scene | Tested |
| No animated group has its own `transform` attribute | Checked with grep |
| Colours are tokens only; no hex, filter or image | Tested |
| SVG roots are `aria-hidden` and `focusable="false"` | Tested |
| `<text>` only for the dial digits, each `aria-hidden` | Tested |
| Bubble and badge are HTML with the right keys | Tested |
| `mountScenes` is idempotent, including whitespace nodes | Tested (a bug found and fixed in review) |
| Stage aspect rules | Tested in source, measured in the browser |
| Size budget | Tested |
| Test output pristine | Yes |

Fixed during review:
- the whitespace accumulation in `mountScenes`;
- a wrong number in a CSS comment;
- the hero lane dashes ran through the cream scroll hint, so I removed them from the hero.

## Concerns

1. **Commit trailer.** The brief asked for `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. This commit was written by Claude Opus 5.5, and my session's attribution rule requires naming the model that actually wrote it, so the trailer reads `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, as on Task 4. Amend it if you want uniform history (it is not pushed).
2. **Deviations from the brief and rulings (please confirm):**
   - (a) 4:3 tablet band for 600–899 px;
   - (b) hero 16:9 at all widths;
   - (c) road van 44 % wide on phones and tablets, 34 % from 900 px. At 34 % on a 4:5 stage the van is ~66 px tall on a ~95 px road and looks lost;
   - (d) hero scroll hint is now cream text written on the road, with the chevron hidden under 380 px. My first try, a cream chip, made it wider than the free strip left of the van;
   - (e) the hero road has no lane marks (they ran through the hint).
3. **The door is drawn closed**, its rotation-0 state. Task 6's reduced-motion and static path must set it open (`perspective(900px) rotateY(-100deg)`), otherwise the scene shows heart eyes at a closed door.
   - Safari may flatten 3D transforms on SVG children. Flattened, rotateY(−100°) becomes a thin mirrored panel at the hinge, which still reads as "open".
4. **GSAP and `fill-box` (same trap as the wheels).** `#door-leaf` and the hearts have `transform-box: fill-box`. GSAP's SVG path writes a `transform` attribute with a view-box origin plus an inline `transform-origin: 0 0`, which would offset them. Drive them with `element.style.transform`. Opacity and `x`-only tweens (`#dad-peek`, digits, `#dad-thumb`) are unaffected.
5. **Parallax budget.** The plan's "factors 0.15 / 0.4 / 1.0 of the van's travel" exceeds the 50 %-of-own-width maximum for the near layer: the van travels 130 % of the stage width, but the layer can only move 100 % of it. Task 6 must clamp or rescale.
   - On phones only x 0–720 of each 1600-wide layer is ever visible; the landmarks were placed there for that reason.
6. **`#call-line`'s dashes live in its `stroke-dasharray`.** Animate only `stroke-dashoffset` (1 → 0).
7. **Safe-area edge case.** On iOS with the toolbar collapsed (safe-area-inset-bottom 34 px), the hero hint rises off the road onto the sidewalk and skyline, where cream text has low contrast. This only happens after scrolling, when the hero is leaving.
8. **Phone scene heights:** the kitchen everywhere, and the others on short phones, exceed 100 svh (numbers above). This is a pinning concern for Task 6.

---

## Fix report (review round 1)

### Important: the price spilled out of the red tag at 320 px (uz)

**Cause.** `.price-badge` had `max-width: 48%` while `.price-badge__price` is `white-space: nowrap` (a no-break price). At 320 px the tag's content box was about 122 px, but "99 000 soʻm" needs 146 px, so the price ran past the tag and pulled the note pill with it.

**Fix** (`src/styles/scenes.css`, `.price-badge`):
- replaced `max-width: 48%` with `width: min-content`;
- in a grid whose price cannot wrap, min-content is the width of the unbroken price;
- so the tag is always exactly as wide as the price plus its padding, and the note pill wraps beneath it at that width;
- the comment above the rule explains this.

Nothing else changed: no price-font step-down was needed.

**Regression guard** (`tests/scenes.test.ts`, CSS-source check, because jsdom has no layout): `.price-badge__price` keeps `white-space: nowrap`, `.price-badge` has `width: min-content`, and `.price-badge` has no `max-width: <n>%` cap.

**Verified in the browser** (built page on `vite preview --port 4174`, same-origin iframes at real sizes, uz and ru). I measured layout boxes with `offset*`, which ignores the −4° tilt.

| Lang | Size | Tag width | Price box (scroll / client) | Note width |
| --- | --- | --- | --- | --- |
| uz | 320×568 | 178 px | 146 / 146 | 146 px |
| uz | 360×780 | 178 px | 146 / 146 | 146 px |
| uz | 375×667 | 178 px | 146 / 146 | 146 px |
| uz | 390×844 | 179 px | 147 / 147 | 147 px |
| ru | 320×568 | 160 px | 128 / 128 | 128 px |
| ru | 360×780 | 160 px | 128 / 128 | 128 px |
| ru | 375×667 | 161 px | 129 / 129 | 129 px |
| ru | 390×844 | 161 px | 129 / 129 | 129 px |

At all eight sizes:
- the tag's `scrollWidth <= clientWidth`;
- the price text fits its box and sits inside the tag's content box;
- the note fits and sits inside;
- the tag lies inside the door stage.

The same holds at 430×932, 768×1024 and 1280×800.

At 320×568 uz:
- the tag (bottom at 292 px) clears Dad's head (top at 331 px);
- in the screenshot `task-5-shots/fix1-door-320x568-uz-price-tag.jpg` the price sits inside the red tag and the note wraps to two lines under it;
- the tag is now centred: the content track equals the price width.

### Minor: `road-sky.svg` was not well-formed XML

**Cause.** The header comment contained `--road-sky-top / --road-sky-bottom`, and `--` is not allowed inside an XML comment.

**Fix.** Reworded it to "the road-sky-top / road-sky-bottom custom properties". A scan of every `src/scenes/*.svg` comment for `--` now finds nothing.

**Guard:** `tests/scenes.test.ts` parses each of the eight scene drawings with `new DOMParser().parseFromString(src, 'image/svg+xml')` and asserts no `parsererror` and an `<svg>` root.

### Tests and commands

RED first:
- command: `npx vitest run tests/scenes.test.ts`
- result: 2 failed / 26 passed
  - `× road-sky is well-formed XML …` → `AssertionError: expected Element{ …(1) } to be null` (the parsererror);
  - `× sizes the price tag to its unbroken price …` → `expected '…' to match /width:\s*min-content/`.

After the fix:

| Command | Output |
| --- | --- |
| `npx vitest run tests/scenes.test.ts` | `Tests 28 passed (28)` |
| `npx vitest run` | `Test Files 9 passed (9)`, `Tests 84 passed (84)`, 0 warnings or stderr lines |
| `npx tsc --noEmit` | clean |
| `npx prettier --check src/styles/scenes.css` | clean |
| `npm run build` | `index-*.css 21.11 kB (gzip 5.34 kB)`, `index-*.js 73.61 kB (gzip 19.97 kB)`, built |

### Files changed in this round

- `src/styles/scenes.css` (`.price-badge` width and its comment)
- `src/scenes/road-sky.svg` (comment wording)
- `tests/scenes.test.ts` (9 new cases: 8 XML parses and 1 tag-width guard)
