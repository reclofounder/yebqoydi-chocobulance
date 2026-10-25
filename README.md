# Chocobulance

Landing page for the Chococream "Chocobulance" PR activation: a chocolate ambulance you call (71 209 99 00) when the tub is empty.
One long red page in the style of the campaign teaser: the words in the order things happen, and the Chocobulance car driving across between them as you scroll. Bilingual (Uzbek / Russian), Vite + TypeScript + GSAP, served as plain files from `dist/`.

## Commands

Node 20.19+ or 22.12+ (`.nvmrc` pins 22), as Vite 8 requires (`engines` in `package.json` says the same).

| Command             | What it does                                                             |
| ------------------- | ------------------------------------------------------------------------ |
| `npm install`       | Install dependencies.                                                    |
| `npm run dev`       | Vite dev server, http://localhost:5173.                                  |
| `npm run build`     | Production build into `dist/`.                                           |
| `npm run preview`   | Serve `dist/` with Vite's preview server, http://localhost:4173.         |
| `npm start`         | Serve `dist/` with `serve` on `$PORT` (default 3000); unknown paths 404. |
| `npm test`          | Vitest (jsdom). `npx vitest run tests/markup.test.ts` runs one file.     |
| `npm run typecheck` | `tsc --noEmit`, TypeScript strict.                                       |
| `npm run format`    | Prettier over `index.html`, `vite.config.ts`, `src`, `tests`.            |

## Project layout

```
index.html           The page: header, the arched hero, the words, the car lanes, the footer. Copy comes from data-i18n keys.
public/              favicon.svg, og.png (1200x630 share image), robots.txt
public/brand/        The Chococream 20 logo for red backgrounds (from brand/design-system)
public/car/          The car from the design PDF: each view's body and rims, WebP (see "The car")
tools/car/           render.swift and export.py: the PDF to public/car/ and src/styles/car.css
src/config.ts        PHONE, PHONE_DISPLAY, PRICE, MODE
src/i18n.ts          Copy engine: t(), applyI18n(), language choice (?lang=, then localStorage, then uz)
src/i18n/            uz.json, ru.json
src/state.ts         Campaign mode (teaser / live / ended)
src/main.ts          Boot: apply copy and mode, start the motion once the fonts are in
src/scroll/          car.ts (the car in each lane), motion.ts (header, words rising, start-up), smooth.ts (Lenis)
src/styles/          tokens (brand colours, fonts), base (the red field), layout (everything else), car (generated)
tests/               Vitest suites, one per area
brief/, docs/        Campaign brief and key visuals; earlier design spec and plan (v1)
vite.config.ts       Build targets, the %VITE_SITE_URL% fill for the share tags, Vitest
.env.example         VITE_SITE_URL, the site's public origin (see Deploy)
```

## The page

Top to bottom, white on the red field:

1. "Yebqoʻydingizmi?" on a gentle arc (an SVG `textPath`; the real words sit beside it, hidden, for screen readers).
2. "Endi kichkintoyni tezlik bilan ovutish kerak".
3. "Telefoningizni oling, 71 209 99 00 raqamiga qoʻngʻiroq qiling", the number a white pill that dials.
4. "Chocobulance uyingiz eshigida", with the car pulling up and parking under it.
5. How it works, three steps. 6. "Chaqirish bepul", the price per tub. 7. Tashkent city only. Then the © line.

The car crosses in lanes between the blocks (`data-lane` in `index.html`): `enter` (half in on the first screen, drives off left), `ltr`, `arrive` (parks at the door), `ltr`, `rtl`. Every block between two lanes is at least a screen tall, so only one car is ever on screen.

Fonts: Baloo 2 ExtraBold for the headlines (the closest match to the teaser's lettering; it has `ʻ`). It has no Cyrillic, so Russian headlines fall through to Nunito 900. Body text uses the system font.

## Change the hotline number

Edit `src/config.ts`: `PHONE` is what a tap dials (international form, `'+998712099900'`), `PHONE_DISPLAY` is how it reads (`'71\u00a0209\u00a099\u00a000'`, no-break spaces so it never wraps). The copy uses `{phone}`, so the header button, its label and the pill in the call line all follow. The two `tel:` links in `index.html` and the static Uzbek description in its `<head>` carry the number for visitors without the script: change those too (a test compares the description).

## Campaign mode

`MODE` in `src/config.ts`:

- `'teaser'` (before launch): the header call button turns into an inert "Tez orada" / "Скоро" pill, and the number in the call line stays as text but no longer dials.
- `'live'` (today): everything dials `PHONE`.
- `'ended'`: the header button becomes "Aksiya yakunlandi" / "Акция завершена"; the number stays as text.

## Edit copy

All copy lives in `src/i18n/uz.json` and `src/i18n/ru.json`; the HTML only carries keys (`data-i18n="soothe.title"`). Both files must have the same keys (a test checks it). A key can use `{phone}` and `{price}`, filled from `src/config.ts`; never type the number or `99 000` into the copy (a test fails if you do).

Uzbek uses two different marks, never the ASCII `'`: `ʻ` (U+02BB) inside the letters oʻ and gʻ (qoʻngʻiroq), and `ʼ` (U+02BC) as the apostrophe. Copy them from the existing strings.

The page title and descriptions in `index.html` ship in Uzbek (for link previews that do not run scripts); if you change `meta.title` or `meta.description`, change the static copies too. A test compares them.

The hero's arc fits "Yebqoʻydingizmi?" at `font-size: 136px` in its 1200-unit drawing (`.hero__arc text` in `layout.css`). A longer line drops the letters that do not fit on the path: lower the size, or lengthen the arc in `index.html` (`#hero-arc`).

## The car

The car is the design's own artwork (`Hyundai_starix_chococream_20.pdf`, Illustrator: a Hyundai Staria in Chococream livery; page 1 faces left, page 2 right, 3 and 4 are the rear and front). Two views, never one mirrored, or "Chococream" would read backwards. `public/car/` holds, per view, the body (`left.webp`, `left-720.webp`) and its two rims (`left-wheel-a.webp`, `-b`, each also at `-720`); `src/styles/car.css` says where each rim sits.

The rims are round copies of the photo's own rims, laid exactly over them: standing still the car is the PDF; driving, the rims turn (by the distance rolled, with the tyre size in `--tyre-share`). Holes the photo cut-out left inside the car (between the spokes) show what they show on the white artboard, so the red page never shows through.

To re-export after a design change (macOS; Python with Pillow, numpy and scipy, for example in a throwaway virtualenv):

```
swift tools/car/render.swift design.pdf 1 2.0833333 /tmp/left.png    # page 1, 150 dpi, ColorSync colours
swift tools/car/render.swift design.pdf 2 2.0833333 /tmp/right.png
python tools/car/export.py /tmp/left.png /tmp/right.png public/car src/styles/car.css
```

Render with `render.swift`, not `pdftocairo`: the artwork is CMYK, and only Quartz converts it as Illustrator and Preview show it (red `#D9242A`, not `#ED1C24`). `export.py` finds the wheels itself and writes the images and `car.css`; if a new body changes its pixel size, update the `width`, `height` and `srcset` widths in `index.html` (the script prints the sizes). Then `npm test`, a scroll through at 1440x900 and 390x844, and a new `og.png` (below).

## Motion

- `src/scroll/car.ts`: one ScrollTrigger per lane, scrubbed by the scroll, writing only `transform` (the car's offset, the wheels' turn). `laneRange` says where the car starts and ends in each kind of lane; `ENTER_SHOWN` is how much of it shows on the first screen; the `arrive` lane brakes (eases out) into the middle.
- Words rise into place as they come on screen (`data-reveal`, `motion.ts`). The hero's arc pops in once on load (CSS).
- Desktop mouse scrolling is smoothed with Lenis (`smooth.ts`); touch scrolling stays native.
- Reduced motion (`prefers-reduced-motion: reduce`): no driving, no smoothing, no rising words. CSS hides every lane but the one at the door, where the car stands parked.

## Deploy on Vercel

Live at **https://chocobulance-omega.vercel.app** (Vercel project `chocobulance`, team "recloglobal's projects", linked to this GitHub repo): **every push to `main` deploys to production**; other branches and pull requests get preview URLs (behind a Vercel login). Zero config: Vercel detects Vite (build `npm run build`, output `dist`) and serves `dist` itself, 404 for unknown paths. The only setting is the production variable `VITE_SITE_URL=https://chocobulance-omega.vercel.app`: the build writes it into `og:image`, `twitter:image`, `og:url` and the three `hreflang` links (`%VITE_SITE_URL%` in `index.html`, filled by `vite.config.ts`), so link previews get absolute URLs. It is read at build time, so change it, then redeploy. With a custom domain, add it under Settings → Domains and set `VITE_SITE_URL` to it.

After a deploy, a smoke check: `/` and `/?lang=ru` return 200; `/og.png` is `image/png`; `/nope` is 404; the page source has absolute `og:image` and `og:url`; a link pasted into Telegram shows the share card.

To check the production build locally: `npm run build && PORT=4180 npm start`, then open http://localhost:4180 (`npm start` serves `dist` with `serve`; `public/serve.json` turns off its directory listing).

`og.png` is a screenshot of the Uzbek first screen at 1200x630 (the arc and the car half in), taken once the hero's entrance has finished. Redo it after any change to the hero or the car.

## Known open items

- Domain: not chosen; once it is, set `VITE_SITE_URL` (see Deploy), which also makes the `hreflang` links absolute (Lighthouse SEO flags them as relative until then).
- Legal texts: the footer has only the © line for now.
