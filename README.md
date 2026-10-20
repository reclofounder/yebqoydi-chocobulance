# Chocobulance

Landing page for the Chococream "105" PR activation: a chocolate ambulance you call when the tub is empty.
A static, bilingual (Uzbek / Russian), scroll-driven story: Vite + TypeScript + GSAP, served as plain files from `dist/`.

## Commands

Node 22 (`.nvmrc`); anything from 20.19 works.

| Command             | What it does                                                             |
| ------------------- | ------------------------------------------------------------------------ |
| `npm install`       | Install dependencies.                                                    |
| `npm run dev`       | Vite dev server, http://localhost:5173.                                  |
| `npm run build`     | Production build into `dist/`.                                           |
| `npm run preview`   | Serve `dist/` with Vite's preview server, http://localhost:4173.         |
| `npm start`         | Serve `dist/` with `serve` on `$PORT` (default 3000). Run a build first. |
| `npm test`          | Vitest (jsdom). `npx vitest run tests/markup.test.ts` runs one file.     |
| `npm run typecheck` | `tsc --noEmit`, TypeScript strict.                                       |
| `npm run format`    | Prettier over `index.html`, `vite.config.ts`, `src`, `tests`.            |

## Project layout

```
index.html           Page shell: head tags, the five pinned scenes, static sections. Copy comes from data-i18n keys.
public/              favicon.svg, og.png (1200x630 share image)
src/config.ts        PHONE, PHONE_DISPLAY, HOOK, PRICE, MODE, LAUNCH_DATE
src/i18n.ts          Copy engine: t(), applyI18n(), language choice (?lang=, then localStorage, then uz)
src/i18n/            uz.json, ru.json
src/state.ts         Campaign mode (teaser / live / ended) and the phone hint
src/main.ts          Boot: mount art, apply copy and mode, start the scroll story
src/scenes/          Scene art as SVG (hero-bg, kitchen, call, road-*, door, coverage) and mount.ts
src/van/             van.svg and van.ts: the swappable van and its geometry
src/scroll/          timeline.ts (pinned story), reduced.ts (still frames), motion.ts, smooth.ts (Lenis)
src/styles/          tokens, base, layout, scenes, van
tests/               Vitest suites, one per area
brief/, docs/        Campaign brief and key visuals; design spec and implementation plan
railway.json         Railway build and start commands
```

## Change the hotline number

Edit `src/config.ts`. Two different things are kept apart:

- `HOOK` (`'105'`) is the campaign line shown in the copy ("105 ga qoʻngʻiroq qiling"). It is a parody of 103, the real ambulance number, and a brand cannot own a three-digit short code. Leave it `'105'`.
- `PHONE` is what a tap dials: every `tel:` link uses it. `PHONE_DISPLAY` is how that number reads in print. Use the real number for both, for example `'+998901234567'` and `'+998 90 123 45 67'`.

While `PHONE` equals `HOOK` (today) nothing extra shows. Once they differ and `MODE` is `'live'`, a small "yoki +998 90 123 45 67" hint appears under the hero button and next to the call bar, so people who cannot dial 105 still have a number. Rebuild after any change.

## Campaign mode

`MODE` in `src/config.ts`:

- `'teaser'` (before launch): the call buttons turn into inert "Tez orada" / "Скоро" pills and a note says the line opens soon. If `LAUNCH_DATE` is set the note names the day; empty means "date not announced". It is one string shown in both languages ("Liniya {date} kuni ochiladi", "Линия откроется {date}"), so use a language-neutral form such as `'01.11.2026'`.
- `'live'` (today): buttons dial `PHONE`.
- `'ended'`: buttons become "Aksiya yakunlandi" pills and a thank-you note replaces the call to action.

## Edit copy

All copy lives in `src/i18n/uz.json` and `src/i18n/ru.json`; the HTML only carries keys (`data-i18n="hero.title"`). Both files must have the same keys (a test checks it). A key can use `{hook}`, `{phone}`, `{price}` and `{date}`, filled from `src/config.ts`; never type `105` or `99 000` into the copy (a test fails if you do).

Uzbek uses two different marks, never the ASCII `'`: `ʻ` (U+02BB) inside the letters oʻ and gʻ (qoʻngʻiroq), and `ʼ` (U+02BC) as the apostrophe (Chococreamʼni, eʼlon). Copy them from the existing strings.

The page title and descriptions in `index.html` ship in Uzbek (for link previews that do not run scripts); if you change `meta.title` or `meta.description`, change the static copies too. A test compares them.

## Swap the van

The van is one file, `src/van/van.svg` (the current art is a placeholder). To replace it:

1. Draw it 480x240, facing right, and keep the six group ids: `van-shadow`, `van-body`, `van-siren`, `siren-light`, `van-wheel-rear`, `van-wheel-front`. `siren-light` is a `rect` inside `van-siren`.
2. Make each wheel group's largest circle the tyre; its centre is the wheel's pivot. Put no `transform` on the wheel groups (the timeline spins them through CSS custom properties).
3. Paint with the design tokens only (`fill: var(--red)`), no hard-coded colours.
4. Update `VAN` in `src/van/van.ts` (`width`, `height`, `wheelRadius`, `wheelCenters`) to match the new drawing.
5. Run `npm test`; `tests/van.test.ts` checks the ids, the geometry and the tokens. `mountVan` suffixes the ids per instance (`siren-light-hero`, `siren-light-road`) and sets `preserveAspectRatio`, so the file needs no other changes.

## Scenes and motion

- Art: `src/scenes/*.svg`, injected into each scene's `[data-stage]` by `src/scenes/mount.ts`. The timeline finds parts by id: `dad-peek`, `tub-lid`, `digit-1`, `digit-0`, `digit-5`, `call-line`, `bubble`, `road-lines`, `door-leaf`, `tub-full`, `heart-l`, `heart-r`, `dad-thumb`, `price-badge`, plus the van's. Keep these ids when redrawing a scene; `tests/scenes.test.ts` lists them.
- Story: `src/scroll/timeline.ts`. Each scene is pinned while one scrubbed timeline plays. Tuning constants sit at the top of the file: `DISTANCE` (pin length per scene, in % of screen height), `NARROW_SCALE`, `SCRUB_TOUCH`, `REVERSE_SPEED`, the beat positions (`DIGITS_AT`, `LINE`, `BUBBLE_AT`, `DOOR_OPEN`, `HEARTS_AT`, `THUMB_AT`, `BADGE_AT`), the road's `VAN_FROM`/`VAN_TO`, `PARALLAX` and `SKY_TOP`/`SKY_BOTTOM`.
- Everything animates `transform` and `opacity` (plus custom properties that CSS turns into transforms). Desktop mouse scrolling is smoothed with Lenis (`smooth.ts`); touch scrolling stays native.
- Reduced motion (`prefers-reduced-motion: reduce`): no pins, no scrubbing, no smoothing. `src/scroll/reduced.ts` shows each scene as a still frame in its final state and keeps the header and call bar in step with the scroll. Switching the setting mid-visit swaps between the two.

## Deploy on Railway

The site is static files plus `npm start`. Nothing here has been deployed yet.

1. Make a **new** Railway project in the workspace "Haysam AI School". Do not use the existing project "Haysam Landing Page Live".
2. `railway init` (or create it in the dashboard), then connect this repo or run `railway up` from this folder.
3. `railway.json` sets the builder (Railpack, Railway's current default) and the commands: build `npm run build`, start `npm start`. Railway runs the dependency install itself, so the build command does not repeat it. `PORT` is provided by Railway; `npm start` listens on it.
4. Optional variable `RAILPACK_NODE_VERSION=22`, to pin Node explicitly (Railpack reads `engines.node` before `.nvmrc`).
5. Generate a domain under Settings, then set the domain-dependent tags in `index.html`: make `og:image` and `twitter:image` absolute (`https://<domain>/og.png`), add `og:url`, and make the three `hreflang` links absolute (the script fills in `uz` and `ru` at runtime, but crawlers that skip scripts read the static ones).

To check the production setup locally: `npm run build && PORT=4180 npm start`, then open http://localhost:4180.

`og.png` is a screenshot of the Uzbek hero (van and the "105" numeral): 1600x840 viewport at 0.75 scale, header and scroll hint hidden. Redo it after any change to the hero.

## Known open items

- Real phone number: `PHONE` and `PHONE_DISPLAY` are still `105`.
- Service hours: the coverage section says "to be announced" (`coverage.hours.value`).
- Social links: the footer's Instagram and Telegram are inert text until the handles exist (see the TODO in `index.html`).
- Domain: not chosen; see Deploy for the tags to update.
- Final van art: the current van is a placeholder.
- Uzbek `ʻ` glyph: Nunito's `ʻ` (U+02BB) has a wide advance, so headlines such as "qoʻngʻiroq" look gappy. Not a defect; keep it (orthographically correct), switch to the ASCII `'`, or pick a narrower display font.
- Launch date: `LAUNCH_DATE` is empty.
