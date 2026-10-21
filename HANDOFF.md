# Chocobulance — handoff for the next developer

Written 2026-10-21 by Claude (the AI that built v1) for the person continuing this project.
Read this, then `CLAUDE.md` (the running project memory) and `README.md` (how to operate the site).
The whole working conversation is in `handoff/CONVERSATION.md` if you want the full story.

## 1. What this is, in one paragraph

A landing page for **Chococream** (Uzbek chocolate-hazelnut spread, 20th anniversary) and its PR
activation **Chocobulance**: when the tub is empty you call **105** and a branded "chocolate
ambulance" delivers a new one across Tashkent for 99 000 UZS, paid on delivery. The site is the
public face of that hotline: it tells the joke in one screen, makes the call button unmissable, and
answers how / where / how much. Information only, no ordering, no payment, no Uklon integration.
Uzbek (Latin) by default with a Russian toggle. The concept comes from 605 Agency.

## 2. Where things stand

| | State |
| --- | --- |
| Code | Branch `main`, 16 commits, every task reviewed, final whole-branch review clean. |
| Tests | 190 Vitest tests, all green. `npm run typecheck` and `npm run build` clean. |
| Quality | Lighthouse mobile 100 (UZ) / 99 (RU), CLS 0, ~115–130 kB transferred. |
| GitHub | `reclofounder/yebqoydi-chocobulance`, public. Fork it, work on a branch, open a PR. |
| Deploy | **Not deployed.** Railway is the target; config is in the repo (`railway.json`, `npm start`). Steps in `README.md` → "Deploy on Railway". |
| Phone | `105` is the campaign hook. The real dial number is not known yet: set `PHONE` / `PHONE_DISPLAY` in `src/config.ts` before launch. Everything else follows. |

## 3. Run it

```bash
nvm use            # Node 22 (.nvmrc); 20.19+ or 22.12+ work
npm ci
npm run dev        # Vite dev server
npm test           # Vitest
npm run typecheck
npm run build && npm start   # production build served on $PORT (default 3000)
```

## 4. How the site is built

- **Stack:** Vite 8, TypeScript (strict), GSAP 3.15 ScrollTrigger, Lenis (desktop smooth scroll),
  `@fontsource/nunito`. No framework, no Tailwind. Static output in `dist/`, served by `serve`.
- **Page:** five pinned, scroll-driven scenes (hero with the parked van and the big "105" →
  kitchen where Dad hides as you scroll → the call with the dispatcher → the road drive with
  three-layer parallax and wheels that roll with the ground → the door handover with heart eyes and
  the price tag), then How it works, Coverage (Tashkent only, price, hours), FAQ, footer.
- **Everything is code-drawn SVG** (`src/scenes/*.svg`, `src/van/van.svg`), colours only via CSS
  tokens (`src/styles/tokens.css`). No raster, no filters, no AI-generated video. Page weight stays
  small and the art is editable.
- **The van is a swappable component.** `src/van/van.svg` is placeholder art. Final art can replace
  it as long as the six group ids stay (`van-shadow, van-body, van-siren, siren-light,
  van-wheel-rear, van-wheel-front`) and `VAN.wheelCenters` / `wheelRadius` in `src/van/van.ts` are
  updated. README → "Swap the van".
- **Copy** lives only in `src/i18n/uz.json` and `ru.json` (same key set, tested). Templates
  `{hook}` `{phone}` `{price}` `{date}` are filled from `src/config.ts`. Uzbek uses ʻ (U+02BB) and
  ʼ (U+02BC).
- **Campaign modes:** `MODE` in `src/config.ts` is `teaser | live | ended`; the call buttons turn
  into inert pills with their own copy outside `live`.
- **Motion:** `src/scroll/timeline.ts` (tuning constants at the top), `motion.ts` (reduced motion,
  anchor landing, call-button visibility), `reduced.ts` (static frames for
  `prefers-reduced-motion`), `smooth.ts` (Lenis). Only `transform`/`opacity` are animated. Wheels,
  door and hearts rotate/scale through CSS custom properties because their pivots use
  `transform-box: fill-box` (GSAP's SVG transforms would orbit them off their axles).
- **Design rules:** Apple Human Interface Guidelines translated to the web (clarity, restraint,
  reduced-motion fallback, 8-pt grid, ≥ 4.5:1 contrast). The project skill `.claude/skills/apple-design`
  is the reference; `CLAUDE.md` §4 explains how it was applied.

## 5. How we worked (so you can keep the same rhythm)

1. Brief → design spec (`docs/superpowers/specs/…design.md`: copy UZ/RU, sections, visuals, stack).
2. Spec → 8-task plan (`docs/superpowers/plans/…landing.md`) with tests per task.
3. Each task: an implementer AI agent built it test-first, a separate reviewer agent checked spec
   compliance and code quality against the diff, fixes went back to the implementer, a scoped
   re-review closed the loop. Reports are in `docs/superpowers/reports/`.
4. After the motion task, a design review against the Apple HIG and animation-craft skills; after
   all tasks, a whole-branch review and one fix wave. Both in `docs/superpowers/reviews/`.
5. `CLAUDE.md` was updated after every step. **Keep doing that**: it is the file a fresh AI session
   (or a human) reads first.

Conventions: commit per milestone with a clear subject; keep every `[data-cta]` a plain-text anchor
(the campaign-mode engine replaces them); never put copy in HTML or SVG; keep each scene SVG under
~20 KB; run `npm test`, `npm run typecheck`, `npm run build` before a PR.

## 6. Open items, in priority order

1. **Real hotline number** → `PHONE`, `PHONE_DISPLAY` in `src/config.ts`. Then eyeball desktop at
   1366×650 and 1440×790 with the hint visible.
2. **Deploy** → README "Deploy on Railway": new Railway project (do not reuse the existing "Haysam
   Landing Page Live"), set `VITE_SITE_URL` to the final domain and rebuild so Open Graph and
   hreflang links become absolute, add `public/serve.json` with `{"directoryListing": false}`,
   run the smoke list, check Telegram/X link previews.
3. **Service hours** (`coverage.hours.value` in both JSON files is a "coming soon" placeholder).
4. **Social links** (the footer list is hidden until real handles exist).
5. **Final van art** (the slot is ready, see §4).
6. **Launch date** (`LAUNCH_DATE`) if teaser mode is used.
7. **Taste call:** the Uzbek ʻ glyph is wide in Nunito headlines ("qo ʻ ng ʻ iroq"). Options: keep
   (orthographically correct), switch headings to ASCII `'`, or a narrower display font.
8. Nice-to-haves from the final review: a designed share card instead of the hero screenshot for
   `og.png`; a Vite step that pre-fills Uzbek copy into the HTML for crawlers and no-JS visitors.

## 7. Decisions you should know about (and may overturn)

- Hotline only, Tashkent only, 99 000 UZS on delivery, info-only site — the client's decisions.
- Code-only build instead of AI-generated scroll video (cost, and the van art was not final).
- Side-scrolling paper-cut Tashkent rather than an isometric diorama (wheels read better, cheaper).
- `105` stays as the visible hook everywhere; the dial target is a separate constant with a small
  "yoki {phone}" hint and a dispatcher line that appear only when the two differ, in live mode.
- Russian via a `?lang=ru` toggle on one URL, not separate pages (hreflang still set).
- FAQ uses native `<details>`; dark mode only touches the static sections; display font Nunito.
- Hero pin shortened to 60 % and kitchen to 120 % of a viewport after a scroll-through felt sticky;
  discrete gags (digits, bubble, hearts, badge) play in time at a scroll position instead of being
  scrubbed, so they never freeze mid-pop.
- Breakpoint queries use `(min-width: 900px)` / `not all and (min-width: 900px)` so every width
  matches exactly one GSAP context without CSS range syntax (older-browser floor).
- A `data-booting` gate hides the empty shell until copy is injected, with a `<noscript>` rule and a
  2.5 s CSS safety net so a failed script never leaves a blank page.

## 8. Map of the repo

```
index.html                 shell, head tags (OG, Twitter, hreflang via %VITE_SITE_URL%)
public/                    favicon, og.png (1200×630)
src/config.ts              HOOK, PHONE, PHONE_DISPLAY, PRICE, MODE, LAUNCH_DATE
src/i18n.ts, src/i18n/     copy engine + dictionaries
src/state.ts               campaign mode + phone hints
src/scenes/, src/van/      SVG art, mounting, the swappable van
src/scroll/                GSAP timeline, reduced motion, helpers, Lenis
src/styles/                tokens, base, layout, scenes, van
tests/                     11 files, 190 tests (jsdom)
docs/superpowers/          spec, plan, reviews, task reports, build ledger
brief/                     agency concept extract, key visuals, design references
.claude/skills/            design/motion skills used by AI sessions (Apple HIG etc.)
CLAUDE.md                  project memory — read first, keep updated
README.md                  operator manual
```

## 9. Working with the client's AI setup (optional)

The repo ships the Claude Code skills that were used (`.claude/skills/`) and `CLAUDE.md` is written
so a new Claude session resumes without re-asking. If you use Claude Code: open the folder, say
what you want to change, and it will read `CLAUDE.md` first. If you don't, ignore `.claude/`.
