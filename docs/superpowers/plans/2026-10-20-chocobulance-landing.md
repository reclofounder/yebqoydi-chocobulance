# Chocobulance Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static, bilingual (UZ/RU), scroll-driven landing page where the Chocobulance van drives across a paper-cut Tashkent as you scroll, telling the "Dad ate it → call 105 → delivery" story and giving price/coverage info.

**Architecture:** Single `index.html` with inline SVG scenes, vanilla TypeScript modules (config, i18n, van, scroll timeline), GSAP ScrollTrigger pinning five scenes and scrubbing their motion; static info sections below; `serve`-hosted `dist/` on Railway. Everything is code-drawn so the van and copy can be swapped without touching the animation.

**Tech Stack:** Vite 6, TypeScript 5, GSAP 3.13 (ScrollTrigger), Lenis, @fontsource/nunito, Vitest, Prettier, `serve` (Railway start command).

**Spec:** `docs/superpowers/specs/2026-10-20-chocobulance-landing-design.md`

**Model per task (user's instruction):** Sonnet for Tasks 1, 2, 3, 7, 8. Opus for Tasks 4, 5, 6. The orchestrator (this session) reviews every task before the next starts.

## Global Constraints

- Node ≥ 20, npm. No framework, no Tailwind, no CSS-in-JS. TypeScript `strict: true`.
- All copy comes from `src/i18n/uz.json` and `src/i18n/ru.json`; no hard-coded user-facing strings in HTML/TS except the brand word "Chocobulance". Every `105` in copy is `{hook}`; dial number is `{phone}`; price `{price}`; launch date `{date}`.
- Uzbek uses `ʻ` (U+02BB) and `ʼ` (U+02BC). Task 3 verifies rendering; if fallback occurs, Task 3 replaces both with `'` in both JSON files and records it in README.
- Config constants (Task 1) are the only place for `HOOK`, `PHONE`, `PHONE_DISPLAY`, `PHONE_TEL`, `PRICE`, `MODE`, `LAUNCH_DATE`.
- Color tokens exactly as spec §5.2; display font Nunito 800/900; body system stack; 8-pt spacing; text contrast ≥ 4.5:1 (use `--red-deep` for small text on red).
- Animate only `transform` and `opacity`. Scroll-scrubbed motion linear; reveals `power2.out` 200–400 ms; pops `back.out(1.4)`. `prefers-reduced-motion: reduce` → no pin/scrub, static scenes.
- Budget: ≤ 400 KB transferred on first load, LCP < 2.5 s on 4× CPU throttle mobile.
- Commit after every task with message style `feat: …` / `chore: …` and end every commit message with the line `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Do not push.
- Never commit `chocobulance-pr-activation.html` or `*.pdf`; `brief/` images are fine.

## Review Focus

1. Russian is selected but a key is missing in `ru.json` → the Uzbek string shows and a console warning names the key; never an empty element. (Test in Task 2.)
2. `MODE = 'teaser'` with `LAUNCH_DATE = ''` → the `state.teaser.note.nodate` string renders and the CTA is a non-link pill. (Test in Task 2, markup check in Task 3.)
3. `PHONE !== HOOK` (e.g. `+998901234567`) → every `tel:` href uses `PHONE`, the "yoki {phone}" line appears under the hero CTA and sticky bar, the CTA label still says 105. (Test in Task 2; markup check in Task 3.)
4. `prefers-reduced-motion: reduce` → no ScrollTrigger pins are created, the van sits at its final road position, siren does not pulse, the page is fully readable. (Test + manual step in Task 6.)
5. 320 px wide viewport in Russian (longer strings) → no horizontal scroll, headlines wrap, sticky CTA does not cover the hero headline. (Verification in Task 7.)

---

## File structure

```
index.html                      all markup (sections, data-i18n, inline SVG via Vite ?raw imports happen in TS)
src/main.ts                     boot order: i18n → mount SVGs → scroll
src/config.ts                   HOOK, PHONE, PHONE_DISPLAY, PHONE_TEL, PRICE, MODE, LAUNCH_DATE
src/i18n.ts                     load dict, fill templates, apply data-i18n, lang toggle, <html lang>, hreflang
src/i18n/uz.json, ru.json       flat key → string (spec §4.2 / §4.3 + state keys)
src/state.ts                    applies MODE to CTA/sticky/hero note (teaser | live | ended)
src/van/van.svg                 placeholder van art with required group ids
src/van/van.ts                  VAN constants + wheelRotation()
src/scenes/*.svg                hero-bg, kitchen, call, road-sky, road-far, road-mid, road-near, door, coverage
src/scenes/mount.ts             injects SVGs into their section stages
src/scroll/motion.ts            prefersReducedMotion(), scrollLength helpers
src/scroll/timeline.ts          ScrollTriggers for hero, kitchen, call, road, door; header + sticky state
src/scroll/reduced.ts           static layout when reduced motion
src/styles/tokens.css, base.css, layout.css, scenes.css
public/favicon.svg, public/og.png
tests/*.test.ts                 Vitest
railway.json, README.md, .gitignore, .prettierrc, vite.config.ts, tsconfig.json, package.json
```

---

### Task 1: Scaffold, config, tokens, skeleton (Sonnet)

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `.prettierrc`, `.gitignore`, `railway.json`, `index.html`, `src/main.ts`, `src/config.ts`, `src/styles/tokens.css`, `src/styles/base.css`, `public/favicon.svg`
- Test: `tests/config.test.ts`

**Interfaces:**
- Produces: `src/config.ts` exporting `HOOK: string`, `PHONE: string`, `PHONE_DISPLAY: string`, `PHONE_TEL: string`, `PRICE: string`, `MODE: 'teaser' | 'live' | 'ended'`, `LAUNCH_DATE: string`. Values: `HOOK='105'`, `PHONE='105'`, `PHONE_DISPLAY='105'`, `PHONE_TEL=\`tel:${PHONE}\``, `PRICE='99 000'`, `MODE='live'`, `LAUNCH_DATE=''`.
- Produces: CSS custom properties from spec §5.2 on `:root` in `tokens.css`, plus `--font-display`, `--font-body`, spacing scale `--s1..--s10` (8 px steps), radii `--r-s: 8px`, `--r-m: 16px`, `--r-l: 28px`.

- [ ] **Step 1: Init project** — `npm init -y`, then `npm i -D vite typescript vitest prettier @types/node` and `npm i gsap lenis @fontsource/nunito serve`. Set `"type": "module"`, scripts: `dev`, `build` (`vite build`), `preview`, `test` (`vitest run`), `format`, `start` (`serve -s dist -l ${PORT:-3000}`), `engines.node >= 20`.
- [ ] **Step 2: Write `tests/config.test.ts`**

```ts
import { HOOK, PHONE, PHONE_TEL, PRICE, MODE } from '../src/config';
test('config defaults', () => {
  expect(HOOK).toBe('105');
  expect(PHONE_TEL).toBe(`tel:${PHONE}`);
  expect(PRICE).toBe('99 000');
  expect(['teaser', 'live', 'ended']).toContain(MODE);
});
```
- [ ] **Step 3: Run `npx vitest run tests/config.test.ts`** — expected FAIL (module not found).
- [ ] **Step 4: Create `src/config.ts`** with the exports above and a `// TODO: replace PHONE / PHONE_DISPLAY with the real hotline before launch` comment.
- [ ] **Step 5: Run the test** — expected PASS.
- [ ] **Step 6: Create `tokens.css`, `base.css`** (reset, `html { scroll-behavior: auto }`, body background `--cream`, color `--choco`, font stacks, `:focus-visible` ring in `--red`, `.visually-hidden`), `index.html` with `<html lang="uz">`, meta viewport (`viewport-fit=cover`), `<title>`/description placeholders carrying `data-i18n`, empty `<main>` with section elements and ids from spec §4.1 (`header`, `hero`, `scene-kitchen`, `scene-call`, `scene-road`, `scene-door`, `how`, `coverage`, `faq`, `footer`, `sticky-cta`) and a `<script type="module" src="/src/main.ts">`. `main.ts` imports the CSS and logs nothing.
- [ ] **Step 7: `.gitignore`** (`node_modules`, `dist`, `.DS_Store`, `*.pdf`, `chocobulance-pr-activation.html`, `.tastemaker/`), `.prettierrc` (`singleQuote: true, printWidth: 100`), `railway.json` (`{"build":{"builder":"NIXPACKS","buildCommand":"npm ci && npm run build"},"deploy":{"startCommand":"npm start"}}`), `public/favicon.svg` (red circle, white "105").
- [ ] **Step 8: Verify** — `npm run build` succeeds; `npx vite preview` serves the empty page without console errors.
- [ ] **Step 9: Commit** — `git add -A && git commit -m "chore: scaffold Vite + TS project with config and tokens"` (+ Co-Authored-By line).

---

### Task 2: i18n dictionaries and engine (Sonnet)

**Files:**
- Create: `src/i18n/uz.json`, `src/i18n/ru.json`, `src/i18n.ts`, `src/state.ts`
- Modify: `src/main.ts`
- Test: `tests/i18n.test.ts`, `tests/state.test.ts`

**Interfaces:**
- Consumes: `src/config.ts` constants.
- Produces: `src/i18n.ts` exporting `type Lang = 'uz' | 'ru'`; `getLang(): Lang` (order: `?lang=` query → `localStorage['lang']` → `'uz'`); `t(key: string, lang?: Lang): string` (fills `{hook}`, `{phone}`, `{price}`, `{date}`; falls back to `uz` with `console.warn('[i18n] missing', key, lang)`; returns the key itself if missing in both); `applyI18n(root: ParentNode, lang: Lang): void` (sets `textContent` for `[data-i18n]`, attributes for `[data-i18n-attr="attr:key,…"]`, `<html lang>`, `document.title`, meta description, `link[hreflang]` hrefs); `setLang(lang: Lang): void` (persists, re-applies, dispatches `CustomEvent('langchange', { detail: lang })`).
- Produces: `src/state.ts` exporting `applyMode(root: ParentNode): void` — reads `MODE`; `live`: CTAs are `<a href={PHONE_TEL}>`; `teaser`/`ended`: replaces `[data-cta]` elements with `<span class="cta cta--disabled" aria-disabled="true">` carrying `state.<mode>.cta`, and `[data-state-note]` gets `state.<mode>.note` (`.nodate` variant when `LAUNCH_DATE` is empty). Also exports `applyPhoneHint(root)`: shows `[data-phone-hint]` with `cta.or` only when `PHONE !== HOOK`.

- [ ] **Step 1: Write both JSON files** from spec §4.2/§4.3 using `{hook}`/`{phone}`/`{price}`/`{date}` templates; same key set in both.
- [ ] **Step 2: Write `tests/i18n.test.ts`**

```ts
import uz from '../src/i18n/uz.json'; import ru from '../src/i18n/ru.json';
test('key parity and no empty strings', () => {
  expect(Object.keys(ru).sort()).toEqual(Object.keys(uz).sort());
  for (const d of [uz, ru]) for (const [k, v] of Object.entries(d)) expect(v, k).not.toBe('');
});
test('t fills templates', () => { expect(t('hero.title2', 'uz')).toBe('105 ga qoʻngʻiroq qiling.'); });
test('t falls back to uz and warns', () => { /* spy console.warn, call t('__missing__','ru') → warns and returns key */ });
test('applyI18n sets lang and text', () => { /* jsdom: element data-i18n="hero.cta" → textContent 'Позвонить 105' after applyI18n(doc,'ru'); html.lang === 'ru' */ });
```
(Vitest `environment: 'jsdom'` for DOM tests — add `jsdom` dev dep in this task.)
- [ ] **Step 3: Run tests** — expected FAIL.
- [ ] **Step 4: Implement `src/i18n.ts`** per the interface.
- [ ] **Step 5: Run tests** — expected PASS.
- [ ] **Step 6: Write `tests/state.test.ts`** — mock `../src/config` with `vi.mock`: (a) `MODE='teaser'`, `LAUNCH_DATE=''` → `[data-cta]` becomes a `span` with text `t('state.teaser.cta')` and note equals `t('state.teaser.note.nodate')`; (b) `MODE='live'`, `PHONE='+998901234567'`, `HOOK='105'` → `a[data-cta]` href is `tel:+998901234567`, `[data-phone-hint]` visible with text `yoki +998901234567`, CTA text still contains `105`; (c) `PHONE==='105'` → hint hidden.
- [ ] **Step 7: Run** — FAIL; **implement `src/state.ts`**; run — PASS.
- [ ] **Step 8: Wire `main.ts`**: `applyI18n(document, getLang()); applyMode(document); applyPhoneHint(document);` and the language toggle handler on `[data-lang]` buttons calling `setLang`.
- [ ] **Step 9: Commit** — `feat: bilingual i18n engine with campaign mode states`.

---

### Task 3: Markup, layout, static sections, fonts (Sonnet)

**Files:**
- Modify: `index.html`, `src/main.ts`
- Create: `src/styles/layout.css`, `src/styles/scenes.css` (section shells only), `src/scenes/coverage.svg`
- Test: `tests/markup.test.ts` (loads `index.html` text, asserts required ids/attributes)

**Interfaces:**
- Consumes: i18n keys (Task 2), `data-cta`, `data-state-note`, `data-phone-hint`, `data-lang` hooks.
- Produces: section DOM contract used by Tasks 4–6: each pinned scene is `<section id="…" class="scene" data-scene="hero|kitchen|call|road|door">` containing `<div class="scene__copy">` (eyebrow `p.eyebrow`, `h2`, `p.body`, optional card) and `<div class="scene__stage" data-stage>` (empty; SVG mounted by Task 5). Hero has `h1` split into `span[data-i18n=hero.title]` and `span[data-i18n=hero.title2]`, a `div.hero__numeral` showing `{hook}`, `a.cta[data-cta][data-i18n=hero.cta]`, `a.cta--ghost[href=#how]`, `p.note[data-i18n=hero.note][data-state-note]`, `p.phone-hint[data-phone-hint]`. Header: `a.brand`, `div.lang` with two `button[data-lang=uz|ru]`. Sticky: `div#sticky-cta` with `a.cta[data-cta][data-i18n=sticky.cta]` + `span[data-phone-hint]`.
- Produces: static sections fully styled: `#how` (3 `article.step` with numerals), `#coverage` (`coverage.svg` left, price card right, hours row), `#faq` (5 `details > summary`), `#footer`, `#header`.

- [ ] **Step 1: Write `tests/markup.test.ts`** — read `index.html` as text; assert it contains `data-scene="road"`, `id="sticky-cta"`, `data-lang="ru"`, `<html lang="uz"`, five `<details`, and no literal `105` outside `data-*`/`href` attributes (regex on text nodes: `>\s*105\s*<` must not match).
- [ ] **Step 2: Run** — FAIL. **Write the markup** for all sections with `data-i18n` keys from the spec; `tel:` hrefs are placeholders replaced at runtime by Task 2 (`href="tel:105"` initial is fine).
- [ ] **Step 3: Fonts** — `import '@fontsource/nunito/800.css'` and `/900.css` in `main.ts` (includes Cyrillic + Latin-ext subsets); set `--font-display`. Render `hero.title2` in UZ in `vite preview` and check `ʻ` and `ʼ` glyphs match the display font (same stroke weight). If they fall back, replace with `'` in both JSON files and note it in README (Task 8 copies the note).
- [ ] **Step 4: Layout CSS** — fluid type scale (`clamp()` per spec §5.3), `.section` padding, `.container` 1120 px, `.scene` = `min-height: 100svh; position: relative; overflow: clip`, `.scene__copy` top third / `.scene__stage` bottom two-thirds on mobile, side-by-side ≥ 900 px; `#sticky-cta` fixed bottom with `env(safe-area-inset-bottom)` on < 900 px, hidden by default (`[data-visible=false]`), Task 6 toggles it; header fixed, `backdrop-filter` only when `[data-scrolled=true]`; `.cta` 56 px tall, red, white 900 text, `--r-l` radius, `:active` scale 0.98; `.cta--disabled` grey.
- [ ] **Step 5: `coverage.svg`** — rounded Tashkent ring shape (abstract, 480×360), inside fill `--red` at 12 % with red stroke, outside `--grey-out`, small red van icon inside with label slot, grey van outside with a crossed circle; labels are HTML overlays with `data-i18n=coverage.inside|outside`, not SVG text.
- [ ] **Step 6: Dark mode** — `@media (prefers-color-scheme: dark)` overrides for `#how, #coverage, #faq, #footer` only (`--night` bg, `--cream` text), per spec.
- [ ] **Step 7: Run tests (`npx vitest run`)** — PASS; `npm run build` OK; open `vite preview` at 390 px and 1280 px: all sections readable, no horizontal scroll, FAQ opens.
- [ ] **Step 8: Commit** — `feat: page markup, layout system, static sections, fonts`.

---

### Task 4: Van component (Opus)

**Files:**
- Create: `src/van/van.svg`, `src/van/van.ts`
- Test: `tests/van.test.ts`

**Interfaces:**
- Produces: `src/van/van.ts` exporting `VAN = { width: 480, height: 240, wheelRadius: 26, wheelCenters: [{ x: 118, y: 196 }, { x: 362, y: 196 }] } as const`; `wheelRotation(distancePx: number, radiusPx = VAN.wheelRadius): number` (degrees, `distance / (2πr) * 360`); `mountVan(target: Element, opts?: { id?: string }): SVGSVGElement` (parses `van.svg?raw`, suffixes ids with `-${id}` so two vans can coexist, sets `role="img"` + `aria-label` from `data-i18n-attr` key `a11y.van`, returns the element).
- SVG contract (ids before suffixing): `van-shadow`, `van-body`, `van-siren`, `siren-light`, `van-wheel-rear`, `van-wheel-front`; wheels have `transform-box: fill-box; transform-origin: center`.

- [ ] **Step 1: Write `tests/van.test.ts`** — `wheelRotation(2 * Math.PI * 26)` ≈ 360; `wheelRotation(0)` = 0; jsdom: `mountVan(div, { id: 'hero' })` yields `#van-wheel-front-hero` and `#siren-light-hero`.
- [ ] **Step 2: Run** — FAIL. **Draw `van.svg`** (480×240, facing right): white body with rounded cabin, red side stripe and red roof block, "Chocobulance" `<text>` on the side in Nunito 900 red, chocolate-drop emblem with a hazelnut, windows `--sky-day-bottom`, headlight, siren block with `rect#siren-light` fill `--red`, two wheels: dark tyre circle r=26, hub r=10, five spokes 2 px white so rotation reads; soft shadow ellipse. Use `currentColor`/CSS vars where possible, no filters.
- [ ] **Step 3: Implement `van.ts`** and the `?raw` import (Vite supports it; add `declare module '*.svg?raw'` in `src/vite-env.d.ts`).
- [ ] **Step 4: Run** — PASS. Mount a van in the hero stage via `main.ts` temporarily (Task 5 moves mounting into `scenes/mount.ts`); check in `vite preview` that it is crisp at 390 px and 1280 px.
- [ ] **Step 5: Commit** — `feat: swappable van component with wheel rotation`.

---

### Task 5: Scene illustrations and mounting (Opus)

**Files:**
- Create: `src/scenes/hero-bg.svg`, `kitchen.svg`, `call.svg`, `road-sky.svg`, `road-far.svg`, `road-mid.svg`, `road-near.svg`, `door.svg`, `src/scenes/mount.ts`
- Modify: `src/main.ts`, `src/styles/scenes.css`
- Test: `tests/scenes.test.ts`

**Interfaces:**
- Consumes: `mountVan` (Task 4); section/stage contract (Task 3).
- Produces: `mountScenes(root: ParentNode): void` — injects each SVG into its `[data-stage]`, mounts the van into hero (`id:'hero'`) and road (`id:'road'`). Animated-part ids (used by Task 6): kitchen `dad-peek`, `tub-lid`; call `digit-1`, `digit-0`, `digit-5`, `call-line`, `bubble`; road layers are the four SVG roots with classes `layer-sky`, `layer-far`, `layer-mid`, `layer-near`, plus `road-lines` group; door `door-leaf`, `tub-full`, `heart-l`, `heart-r`, `dad-thumb`, `price-badge`.
- Produces: `src/styles/scenes.css` gives each stage an aspect-stable box (`aspect-ratio: 16/9` desktop, `4/5` mobile), layers absolutely stacked.

- [ ] **Step 1: Write `tests/scenes.test.ts`** — jsdom with the Task 3 markup (import `index.html?raw`, set `document.body.innerHTML` of `<main>`): after `mountScenes(document)`, `#dad-peek`, `#bubble`, `.layer-near`, `#door-leaf`, `#van-wheel-front-road` exist.
- [ ] **Step 2: Run** — FAIL. **Draw the scenes** per spec §5.6 in the paper-cut style: limited palette from tokens, soft two-stop gradients, rounded shapes, no filters or raster. Hero bg: dawn sky + low skyline + road. Kitchen: window, table, empty red tub with smears, kid back-view silhouette, Dad's head (`#dad-peek`) at the right door frame. Call: phone frame, dial pad with `#digit-1/0/5` highlight circles (opacity 0 initially), `#call-line` dashed path, dispatcher avatar, `#bubble` group (scale 0). Road: `road-sky` (gradient rect, two cloud shapes), `road-far` (TV tower, Hotel Uzbekistan lattice, flats; width 200 % of stage for parallax travel), `road-mid` (Chorsu dome, plane trees, bus stop; 200 %), `road-near` (road surface, `#road-lines` dashes, lamp posts, metro "M" sign; 200 %). Door: door frame + `#door-leaf`, choco-medic with red bag holding `#tub-full`, kid, `#heart-l/#heart-r` (scale 0), `#dad-thumb` (opacity 0), `#price-badge` group with text slots `[data-i18n]` rendered as HTML overlay, not SVG text.
- [ ] **Step 3: Implement `mount.ts`** and call it from `main.ts` after `applyI18n`.
- [ ] **Step 4: Run** — PASS. `vite preview`: scroll through; every scene composes at 390 px and 1280 px with the copy readable over it (add a subtle cream scrim behind copy where needed).
- [ ] **Step 5: Commit** — `feat: paper-cut Tashkent scenes`.

---

### Task 6: Scroll timeline, parallax, wheels, humor beats, reduced motion (Opus)

**Files:**
- Create: `src/scroll/motion.ts`, `src/scroll/timeline.ts`, `src/scroll/reduced.ts`
- Modify: `src/main.ts`, `src/styles/scenes.css`
- Test: `tests/motion.test.ts`

**Interfaces:**
- Consumes: ids from Task 5, `wheelRotation`/`VAN` from Task 4, DOM contract from Task 3.
- Produces: `prefersReducedMotion(): boolean`; `initScroll(): void` (chooses `initTimeline()` or `initReduced()`); `initTimeline()` creates one ScrollTrigger per scene with `pin: true, scrub: 0.8`, `end` distances hero `+=150%`, kitchen `+=200%`, call `+=150%`, road `+=300%`, door `+=150%` (×0.75 when `matchMedia('(max-width: 900px)')` via `ScrollTrigger.matchMedia`); road layers translate by factors 0.15 / 0.4 / 1.0 of the van's travel; van x from `-20%` to `110%` of stage width with wheels rotated by `wheelRotation(deltaX)` each update; sky gradient stops interpolated from dawn to day tokens via CSS variables on the road section; siren `#siren-light-*` pulse via CSS keyframe class, removed under reduced motion; kitchen `#dad-peek` x from 0 to `+140px` and opacity to 0 over the first 60 %; call digits opacity 1 at 20/40/60 %, `#call-line` `stroke-dashoffset` to 0 by 80 %, `#bubble` scale 0→1 `back.out(1.4)` at 85 %; door `#door-leaf` rotateY 0→-100° over 0–40 %, hearts pop at 60 %, thumb at 75 %, price badge y +24→0 at 85 %; header `[data-scrolled]` after 40 px; `#sticky-cta[data-visible]` true once hero's trigger ends; Lenis enabled only when `matchMedia('(pointer: fine)')` and synced with `ScrollTrigger.update`.
- Produces: `initReduced()` — adds class `reduced` on `<html>`; scenes unpinned, van placed at 70 % of road stage, all pop elements at final state, hint text hidden.

- [ ] **Step 1: Write `tests/motion.test.ts`** — mock `matchMedia`: `prefersReducedMotion()` true/false; `initScroll` with reduced → `document.documentElement.classList.contains('reduced')` and `ScrollTrigger.getAll().length === 0` (mock gsap).
- [ ] **Step 2: Run** — FAIL. **Implement `motion.ts`, `timeline.ts`, `reduced.ts`** per the interface, registering `gsap.registerPlugin(ScrollTrigger)` once; all tweens use `transform`/`opacity` only; `will-change: transform` on `.layer-*` and the road van only.
- [ ] **Step 3: Run** — PASS. Wire `initScroll()` last in `main.ts` (after fonts ready: `document.fonts.ready.then(...)`).
- [ ] **Step 4: Manual verification** — `vite preview`: (a) desktop 1280 px: van crosses the stage during the road scene, wheels visibly spin, layers move at different speeds, sky brightens; (b) 390 px with DevTools CPU 4× throttle: no dropped frames in the Performance panel during the road scene; (c) emulate reduced motion: no pins, page scrolls normally, all text present; (d) resize window: `ScrollTrigger.refresh()` keeps scenes aligned.
- [ ] **Step 5: Commit** — `feat: scroll-driven story timeline with parallax and wheel rotation`.

---

### Task 7: Mobile-native, performance, accessibility pass (Sonnet)

**Files:**
- Modify: `index.html`, `src/styles/base.css`, `src/styles/layout.css`, `src/styles/scenes.css`, `vite.config.ts`
- Test: `tests/a11y.test.ts`

**Interfaces:** consumes everything; produces no new exports.

- [ ] **Step 1: Write `tests/a11y.test.ts`** — markup text checks: a "skip to content" link is first in `<body>`; every `img`/`svg[role=img]` mount gets `aria-label` (check `mount.ts` sets `a11y.van`); every `button` has text or `aria-label`; `details > summary` count is 5; `meta[name=theme-color]` present.
- [ ] **Step 2: Run** — FAIL; **apply**: skip link, `theme-color` = `--cream`, `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation` on buttons, `100svh` everywhere instead of `100vh`, `overscroll-behavior-y: none` only on `html` if Lenis active, inputs none; focus-visible rings on CTAs and `summary`; `font-display: swap` confirmed (fontsource default).
- [ ] **Step 3: Performance** — `vite build` with `build.target: 'es2020'`, check `dist` sizes; Lighthouse (Chrome DevTools, mobile preset) on `vite preview`: Performance ≥ 90, LCP < 2.5 s, CLS < 0.05, transferred < 400 KB. If over budget: subset fonts to 800 only, inline critical CSS, drop Lenis.
- [ ] **Step 4: 320 px Russian check** — `setLang('ru')`, 320×568 viewport: no horizontal overflow (`document.documentElement.scrollWidth === 320`), hero headline wraps, sticky CTA does not overlap the headline (headline bottom < sticky top while hero pinned).
- [ ] **Step 5: Run tests** — PASS. **Commit** — `chore: mobile-native, a11y and performance pass`.

---

### Task 8: Deploy config, README, OG image, project docs (Sonnet)

**Files:**
- Create: `README.md`, `public/og.png` (1200×630, rendered from the hero with the van and "105" — Playwright screenshot of `vite preview` or a static SVG→PNG export; any method), `src/scenes/README-van-swap.md` (short)
- Modify: `index.html` (og:* and hreflang tags), `railway.json` (verify), `CLAUDE.md` (sections 3, 7, 8)
- Test: `tests/markup.test.ts` (extend: `og:image`, `hreflang="uz"` and `"ru"` present)

- [ ] **Step 1: Extend markup test** with the three assertions; run — FAIL; add tags; run — PASS.
- [ ] **Step 2: README.md** — run/build/test/deploy commands; "Change the hotline number" (edit `src/config.ts`: `PHONE`, `PHONE_DISPLAY`); "Campaign mode" (`MODE`, `LAUNCH_DATE`); "Swap the van" (replace `van.svg` keeping group ids, update `VAN.wheelCenters`/`wheelRadius`); "Edit copy" (JSON files, templates); apostrophe convention; Railway: new project, `railway init`, `railway up`, env `PORT` provided.
- [ ] **Step 3: `og.png`** generated and referenced; favicon linked.
- [ ] **Step 4: CLAUDE.md** — §3 stack decided + Railway steps, §7 pointer to spec/plan, §8 session log entry "site v1 built, not deployed".
- [ ] **Step 5: `npm run build && npm start`** on a free port — page serves from `dist`. **Commit** — `chore: deploy config, README, OG image, docs`.

---

## Orchestrator review checklist (run after each task, before dispatching the next)

- Tests pass (`npx vitest run`), `npm run build` passes, no console errors in `vite preview`.
- Code matches the task's Interfaces block (names, ids, signatures).
- Global Constraints honoured (no hard-coded copy, transform/opacity only, tokens).
- After Task 3, 5 and 6: open in the built-in browser at 390 px and 1280 px, screenshot, run `/apple-design` (design review) and, after Task 6, `review-animations`; feed findings back to the implementer as fix requests.
- Commit exists with the attribution line.
