# Chocobulance — Chocoream PR Activation Landing Page

> **Read this file first in every session.** It is the single source of truth for this project.
> Rule set by the user on 2026-10-19: Claude must keep this file updated after every meaningful
> step so a brand-new session can resume without re-asking. If this file and any memory note
> disagree, this file wins.

## 1. What this project is

- **Brand:** Chococream (official spelling; user sometimes types "Chocoream") — Uzbek chocolate-hazelnut spread, 20th anniversary.
- **Purpose:** a landing page for a **new PR activation**. "Chocobulance" is the project/campaign
  codename (folder name and GitHub repo name).
- **Status (2026-10-25):** **v2 built on `main`** (§7 "What was built (v2)", §8): one long red page in
  the style of the campaign teaser, the user's words in order, the car driving across between them.
  **The real car from the design PDF since 2026-10-25** (§7 "The car"). **Pushed and deployed 2026-10-25:**
  live at **https://chocobulance-omega.vercel.app** (Vercel), which auto-deploys every push to `main`.
  **Railway removed 2026-10-26** (user's choice: Vercel is free). Open items in §6b and the README.

## 2. Rules set by the user

1. **Always update `CLAUDE.md`.** Record decisions, assets, open questions, infra state, and a
   dated session log entry (section 8) before ending a session.
2. **Follow Apple design guidelines.** Use the installed `apple-design` skill
   (`.claude/skills/apple-design`, invoke `/apple-design`). See section 4 for how.
3. **More skills will be installed on request.** Log each one in section 5 (name, path, source,
   purpose) so later sessions know they exist.

## 3. Infrastructure

| Piece | State |
| --- | --- |
| Git | Branch `main`, tracks `origin/main`. **Pushed on 2026-10-21** (user's OK). Collaborator workflow: fork → branch → PR into this repo → merge → deploy. |
| GitHub | `origin` → `https://github.com/reclofounder/yebqoydi-chocobulance.git` (public since 2026-10-21). |
| Vercel | **Deployed 2026-10-25** (user: "it is free"). Team **"recloglobal's projects"** (`team_ZF0hf2Mpabbgr99J3sLE9JAL`, the Vercel connector's account) → project **`chocobulance`** (`prj_54uJBknHMTgKxj1yJe5wCohiqyKB`), linked to the GitHub repo, production branch `main`: **every push to `main` deploys here too.** Public URL **https://chocobulance-omega.vercel.app** (the name "chocobulance.vercel.app" was taken). Framework Vite, build `npm run build`, output `dist`, Node 24. Env `VITE_SITE_URL=https://chocobulance-omega.vercel.app` (production). Deployment protection is the team default: the production domain is public, per-deployment and team-alias URLs ask for a Vercel login (302). Do not touch the team's other projects (ogir, haysamaischool-prvt, selfserverguide). |
| Railway | **Removed 2026-10-26** at the user's request ("remove railway"): project `chocobulance` (`0aa292bb-…`) deleted with `railway delete`, this folder unlinked, `railway.json` removed. The CLI stays installed and logged in; the workspace's other projects ("Haysam Landing Page Live", "ögir.uz") were not touched. |
| Deploy target | **Vercel only** (since 2026-10-26; Railway was used 2026-10-25 and removed). Pushing to `main` deploys to production, so push only with the user's OK. |
| Stack (decided) | Vite 8 + TypeScript (strict) + GSAP 3.15 (ScrollTrigger) + Lenis + `@fontsource/baloo-2` (headlines) + `@fontsource/nunito` (Cyrillic fallback only). Static output in `dist/`, served by `serve` (`npm start`, listens on `$PORT`, default 3000). Node 22 (`.nvmrc`), `engines.node` >=20.19. Tests: Vitest + jsdom. |
| Preview config | `.claude/launch.json` (committed): `chocobulance-preview` (`vite preview`, 4173), `chocobulance-dev` (5173), `chocobulance-preview-4174`. Run `npm run build` first for the preview ones. |

Deploying: push to `main` (README "Deploy on Vercel"). `npm start` (`serve`, with `public/serve.json`) is
kept only for checking the production build locally.

Conventions: commit after each milestone; push to `origin main` only when the user OKs it.

## 4. Design system: Apple HIG applied to the web

Source of truth: `.claude/skills/apple-design/` (dickwu/apple-design-skill, 123 HIG pages pulled
from developer.apple.com under `references/hig/`, lookup index in `references/hig-lookup.md`,
Liquid Glass guide included).

How to use it on this project:
- **Before designing a section**, read the relevant HIG page(s) via `references/hig-lookup.md`
  (typography, color, layout, motion, accessibility, buttons, images).
- **Before showing the user any iteration**, run `/apple-design` as a review pass and fix findings.
- The skill is written for native/Flutter/Electron apps; translate to web as follows:
  - Type: system font stack (`-apple-system, SF Pro, Inter fallback`), HIG type scale, generous
    line-height, Dynamic-Type-like fluid sizing (`clamp()`).
  - Layout: 8pt spacing grid, safe-area-aware padding, clear hierarchy, lots of whitespace.
  - Color: semantic tokens, light + dark mode via `prefers-color-scheme`, WCAG AA contrast minimum.
  - Materials: restrained glass/blur only where it aids hierarchy (Liquid Glass guide).
  - Motion: purposeful, short, respects `prefers-reduced-motion`.
  - Principles: clarity, deference (content first), depth; no generic template look.

## 5. Installed skills and tooling

### Project-level (live in this repo, travel with it)

Installed into `.claude/skills/` (≈6 MB, 23 skills). Project skills load at session start; a skill
installed mid-session is callable as `/name` from the next session (read its `SKILL.md` directly
until then). Each skill's description costs context every session, so the set is curated —
the rest of each collection is listed as "available on request".

| Skill(s) | Source | Installed | Purpose on this project |
| --- | --- | --- | --- |
| `apple-design` | github.com/dickwu/apple-design-skill | 2026-10-19 | Apple HIG reference (123 pages) + design review (`/apple-design`). Rule 2 source of truth. |
| `scroll-world` | github.com/oso95/scroll-world (10k★) | 2026-10-20 | Builds a scroll-scrubbed "fly through a miniature world" landing: AI scene stills + AI camera clips (Higgsfield / Monid, Seedance 2.0) chained with frame-identical seams, played by a vanilla-JS scrub engine (`references/scrub-engine.js`). Needs Higgsfield CLI + credits (and/or Monid), ffmpeg, Pillow. See §7 "Scroll-world option". |
| `animate`, `animation-performance`, `review-animations`, `find-animation-opportunities`, `emil-design-eng`, `mobile-native`, `apple-web-motion` | github.com/emilkowalski/skills (47k★) | 2026-10-20 | Motion craft: design/implement/review animations, frame-budget performance, native-feeling mobile web. `apple-web-motion` is Emil's `apple-design` skill **renamed in its frontmatter** to avoid the name clash — Apple's motion/materials/typography translated for the web; complements rule 2. Not installed: `animate-expo`, `write-swift`, `ask-sonner`, `pick-ui-library`, `break-ui`, `prototype`, `animation-vocabulary`. |
| `landing-page-design` | github.com/elayadesign/ai-design-skills | 2026-10-20 | Landing-page system: intake, structure, conversion copy, strict visual rules (type, spacing, radius, hero, motion). |
| `web-design-engineer` | github.com/ConardLi/garden-skills | 2026-10-20 | Build polished HTML/CSS/JS pages with browser acceptance QA. Not installed (Chinese-language / off-scope): `motion-showreel`, `beautiful-article`, `gpt-image-2`, `web-video-presentation`, `kb-retriever`. |
| `better-typography`, `better-colors`, `better-layout`, `better-writing`, `better-ui`, `interface-review` | github.com/jakubkrehel/skills (8k★) | 2026-10-20 | Interface craft with exact values; `interface-review` audits a diff. Not installed: `better-interface` (bundle), `better-accessibility`, `build-design`, `break`, `variant`, `explain-interface`, `state-machine`, `technical-drawing`. |
| `generate-reference-inspired-brand-worlds`, `optimize-web-animations` | github.com/MengTo/Skills (6.8k★) | 2026-10-20 | Brand-world concepts from a visual reference; animation/perf audit (GSAP, canvas, rAF). Not installed: 16 Three.js `3d-*` skills (use if we go real-3D), game VFX, Codex workflow skills. |
| `tastemaker` (+ nested `ideagram`) | github.com/codeswithroh/tastemaker | 2026-10-20 | Reference-grounded palette/type extraction (scripts in `scripts/`), anti-slop checklist, per-project style lock in `.tastemaker/`. |
| `animation-principles`, `interfaces-that-feel`, `illustration-style` | github.com/Owl-Listener/designer-skills (3k★, 100+ skills) | 2026-10-20 | Principles for motion, feel, and illustration direction. Rest of the collection (research, design ops, UX laws, critique) available on request. |

Considered but not installed: `raintree-technology/apple-hig-skills` (14 split HIG skills plus an
`npx hig-doctor .` audit CLI with React/CSS rules).

### User-level (global on this Mac; apply to this project automatically)

Requested by the user on 2026-10-19. All were already present; four were upgraded that day.

| Tool | Kind | Version | Source | How it is used here |
| --- | --- | --- | --- | --- |
| `superpowers` | Claude Code plugin (`superpowers-marketplace`) | 7.0.0 (was 6.1.1) | github.com/obra/superpowers | Process skills: `brainstorming` before creative work, `writing-plans`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`. Auto-loaded. |
| `ui-ux-pro-max` | Claude Code plugin (`ui-ux-pro-max-skill`) | 2.15.0 (was 2.5.0) | github.com/nextlevelbuilder/ui-ux-pro-max-skill | UI/UX design intelligence: palettes, type pairings, component and landing-page patterns. Sub-skills: `ui-ux-pro-max:design`, `:design-system`, `:ui-styling`, `:brand`, `:banner-design`, `:slides`. **Apple HIG (rule 2) wins when they disagree.** |
| `andrej-karpathy-skills` | Claude Code plugin (`karpathy-skills`) | 1.0.0 (latest) | github.com/multica-ai/andrej-karpathy-skills | Coding discipline: think before coding, simplicity first, surgical changes, goal-driven execution. |
| `rtk` | CLI via Homebrew + `PreToolUse` hook in `~/.claude/settings.json` | 1.0.1 (was 0.40.0) | github.com/rtk-ai/rtk | Token-saving command proxy; the hook rewrites Bash calls to `rtk <cmd>` automatically. `rtk gain` shows savings. Hook verified working after upgrade. |
| `graphify` | CLI via `uv tool` (package `graphifyy`) + skill at `~/.claude/skills/graphify` | 0.9.92 (was 0.8.37) | github.com/Graphify-Labs/graphify | `/graphify` builds a knowledge graph of the codebase into `graphify-out/`. Worth running once the site has real structure. |

Notes:
- Plugin upgrades take effect after a Claude Code restart; CLI upgrades are live immediately.
- Project-level skills load at session start. A skill installed mid-session is available as
  `/name` from the next session; until then read its `SKILL.md` directly.
- To check for newer versions later: `claude plugin marketplace update && claude plugin update <plugin>@<marketplace> --scope user`, `brew upgrade rtk`, `uv tool upgrade graphifyy`.

## 6. Decisions and open questions

### 6a. Decided by the user (2026-10-19)

| Topic | Decision |
| --- | --- |
| Mechanic | **Hotline only.** No Uklon integration on the site. |
| Phone number | **Superseded 2026-10-25:** the number is **71 209 99 00** (`PHONE = '+998712099900'`, `PHONE_DISPLAY` with no-break spaces, `src/config.ts`). **105 is dropped everywhere** (no `HOOK` any more). |
| Site purpose | **Information only, for end users:** what Chocobulance is and how to call. No order form, no payment online. |
| Coverage | **Tashkent city only.** Say clearly that addresses outside the city may not be served. |
| Price | **99 000 UZS** per tub, paid by the customer **when the service is completed** (on delivery). **Call-out is free** (2026-10-25). |
| Design direction | "Super cool" animated **parallax** landing page: the **Chocobulance van moves with scroll, wheels animate**. Scroll-driven storytelling. Still must respect Apple HIG rules (clarity, restraint, reduced-motion fallback). |
| Process | User wants **design references first**, then a design discussion, then build. |
| **New direction (2026-10-25)** | Supersedes the v1 illustrated scenes. **One long red background** (the campaign teaser's radial red), **only the user's words** on it in their chronology, **nothing else added**, and **the real Chocobulance car** (from the user's Figma) driving **right to left, then left to right** across the page as you scroll. Hero: "Yebqoʻydingizmi?" on a **gentle arc**. Footer legal: **only the © line** for now. Headline font: Baloo 2 (closest to the teaser's lettering). |
| Production approach (2026-10-20) | **Code only, no AI-generated video.** scroll-world is installed but rejected for this project (cost, and the final van visual is not ready so renders would be redone). Build the world in SVG/CSS/JS with scroll-driven motion. **The van must be a swappable component** (placeholder now, final art later, same anchor points for body/wheels/shadow). Creative but cheap. |

### 6b. Still open

- Languages: Uzbek (Latin) is the base. Russian version? (Tashkent audience is bilingual.)
- Brand assets: **logo lockup and display font received 2026-10-22** (§7 "Brand kit"). Still
  missing: product packshots, a **usable van image** (cut-out or illustrated van with separable
  wheels is needed for the scroll animation; current van visuals are AI renders in
  `brief/key-visuals/`), a licensed (non-demo) Mochipop file, and a decision on headlines the
  demo font cannot set (Cyrillic, the Uzbek ʻ/ʼ marks).
- ~~Restyle the site to the brand kit?~~ Settled 2026-10-25 by the new direction (§6a): brand red
  `#C71920` with the teaser's radial light, Baloo 2 headlines (not Mochipop: no Cyrillic, no ʻ), system
  body font, the on-red logo in the header. The 2026-10-23 mockup artifact is obsolete.
- Service hours and days.
- Social links (Instagram / Telegram) for the UGC loop.
- Domain name.
- Hero spelling: one word "Yebqoʻydingizmi?" as the user wrote it; the teaser had "yeb qoʻydilar" as two words.
- Legal texts for the footer (only © for now).
- Phone hero size: on a 390 px phone the arched headline is about 42 px (a 16-letter word on one arc).
- After deploy (2026-10-25): `serve.json` (no directory listing) and `VITE_SITE_URL` are done and smoke-checked. Still to do: check the Telegram/X link previews; a custom domain (then update `VITE_SITE_URL`); optional designed share card.

## 7. Brief and content (received 2026-10-19)

**Design spec:** `docs/superpowers/specs/2026-10-20-chocobulance-landing-design.md` (copy UZ/RU, sections, visuals, stack, decisions).
**Implementation plan:** `docs/superpowers/plans/2026-10-20-chocobulance-landing.md` (8 tasks; Sonnet for 1,2,3,7,8; Opus for 4,5,6; orchestrator reviews each).
Execution started 2026-10-20 via subagent-driven development; progress is tracked by the plan's checkboxes and git commits.

Sources in repo root (do not commit the 8.5 MB HTML as-is; decide on `.gitignore` or `brief/`):
- `chocobulance-pr-activation.html` — 605 Agency creative concept, "105 editable version", Uzbek.
  Plain-text extract: `brief/concept-105-text-extract.md`.
- `Chocobulance × Taxi apps (Copy).pdf` — 9-page partnership proposal to **Uklon** (taxi app).
- `brief/key-visuals/` — images extracted from the HTML: `chocobulance-van-doctor.png` (hero,
  2752×1536), `dadam-yeb-qoydilar-empty-tub.png` (previous campaign KV), `ugc-dashboard-pov.jpg`.

### Brand
- **Chococream** (official spelling in all materials; user typed "Chocoream"). Chocolate-hazelnut
  spread, 20 years on the Uzbek market; this is the **20th-anniversary** campaign.
- Agency: **605 Agency**, Tashkent, Zulfiyaxonim ko'chasi 12, +998 33 605 60 05, 605agency.uz.
- Visual world: Chococream red, white, chocolate brown, hazelnuts; red oval tub with red lid;
  rounded bold display type in the decks; medical/ambulance cues (red cross-like mark, white
  uniform with brown trim, "SHOKOLAD DOCTOR" badge, red-striped white van, red cooler bag).

### Brand kit (received 2026-10-22)

The user exported a **Chococream design system** from Claude Design (built from the official logo
SVG, the display font and a pasted brand brief) and dropped two files into the project root:
`Chococream Design System.zip` (git-ignored by `*.zip`; **unpacked to `brand/design-system/`**,
untracked until committed) and `Chococream Logo Lockup.html` (a self-contained Claude Design bundle
of the "Logo Lockup" guideline card: the two logo PNGs on white, red and brown; nothing the zip does
not already contain). Read `brand/design-system/readme.md` first; tokens in `tokens/*.css`;
`SKILL.md` makes it a `/chococream-design` skill if copied to `.claude/skills/chococream-design/`.

What is in it:
- **Logo:** `assets/logo.svg` (vector, 783×178 viewBox, 35 paths) is the **"Chococream 20 yoshda"**
  anniversary lockup: white rounded letters with a chocolate-brown outline on a red rounded field,
  "20" plus a small "yoshda" tag. `assets/logo.png` is that render; `assets/logo-on-red.png` is the
  variant for red backgrounds (white letters, brown outline, brown swoosh under the "20", no field).
  ⚠️ **The SVG has lost its colours:** its paths use classes `cls-1`…`cls-8` but the file has no
  `<style>` block, so every path renders black. Restore the fills (map the classes against the PNG)
  before using the SVG on the web; also strip the 8 KB C2PA `<metadata>` block. `uploads/` holds
  byte-identical copies of the four source files.
- **Display font:** `assets/fonts/MochibopBold-Demo.ttf` (internal name "MochibopBold Demo"; the
  brief calls it "Mochipop Bold Demo" and the CSS `@font-face` uses that name). Rounded, soft,
  childlike; this is the typeface of the logo. ⚠️ **Demo cut, 172 glyphs:** Basic Latin, digits,
  most Latin-1, `'` and `’`, `«`; **no Cyrillic, no ʻ (U+02BB) / ʼ (U+02BC), no »**, no em dash. It
  cannot set the Russian page or the current Uzbek headlines (qoʻngʻiroq) without a fallback font
  for those glyphs; a licensed full cut is also a launch question.
- **Body font:** Inter (Google Fonts import in `tokens/typography.css`).
- **Colour tokens** (`tokens/colors.css`): red 700/600/500/100 = `#A31219` / **`#C71920`** /
  `#DA3038` / `#F7DBDC`; brown 900/700/500 = `#2E140D` / `#4A2418` / `#6B3A28`; cream `#F7EDE0`,
  beige `#E3CFAE`, warm gray `#8A7B6E`, white, black `#1A0F0B`. Semantic: page = cream, card = white,
  brand surface = red-600, text = brown-900, muted = warm gray, border = beige, focus = red-500.
- **Type scale:** display xl/lg/md `clamp(48px,6vw,96px)` / `clamp(36px,4.5vw,64px)` /
  `clamp(28px,3vw,40px)`, body 20/16/14, caption 12; leading 1.05 display, 1.5 body.
- **Spacing** 4-px base (4…96); **radii** 8 / 16 / 28 / pill; **shadows** warm brown-tinted
  `--shadow-card`, red-tinted `--shadow-pop`; **motion** `--ease-bounce` (overshoot) for
  interactions, `--ease-soft` for fades, 150 / 250 ms.
- **Components:** React `Button` (pill; primary red, secondary brown, ghost outline; press scales
  to 0.96), `Badge`, `Card` (white, radius 28, eyebrow + display title + muted line).
- **Rules from the brief:** two dominant colours per composition; white headlines on red; sentence
  case, no emoji; voice playful, warm, nostalgic, "a memory, not a command"; logo in a corner or
  free space, never recoloured or reproportioned; flat red fields or warm family photography as
  backgrounds, **no gradients, no textures, no illustrated backgrounds; animation minimal, no
  parallax, no spinning or looping decoration.** The last two rules were written for packaging and
  social, before this site existed; they contradict the scroll-driven illustrated story the user
  approved in §6a. Treat the kit as the source for colour, type, logo and components, and raise the
  motion / background conflict with the user before restyling.

How the kit maps onto the current build (`src/styles/tokens.css`): the site's `--red #E2231A` is
brighter and more orange than brand red-600 `#C71920`; `--choco #3E1F0E` sits between brown-900 and
brown-700; `--cream #FFF6EC` is pinker than cream-100 `#F7EDE0`; radii already match (8/16/28); the
8-pt spacing grid is a subset of the 4-px scale; the CTA is already pill-like (radius 28, 56 px
high). Headlines are Nunito 800/900 everywhere (`layout.css`, `scenes.css`); the header shows a text
wordmark, no logo anywhere yet. The hero eyebrow already reads "Chococream 20 yoshda", the lockup's
own line.

### Background: previous campaign "Yeb qo'ydi"
Insight: kids' Chococream often disappears because a parent / sibling / grandma ate it.
KV: empty red tub, headline "Dadam yeb qo'ydilar" (Dad ate it). Results: 383 000+ organic
views, 10 free media placements.

### The activation: Chocobulance — "Shokolad tez yordami" (chocolate ambulance)
Turn the joke into a real service: when the tub is empty it is an "emergency"; call **105**
(parody of 103, the ambulance number) and a branded ambulance brings a new Chococream.
Tagline: "Xavotir olmang — yetib keldik!" (Don't worry — we've arrived!). Every delivery is
filmed and becomes UGC.

**Mechanic, 105 version (HTML):** 1 tub empty → 2 anyone calls 105 and gives address
("we will also make a separate website for this") → 3 dispatcher confirms address + paid order,
sends nearest Chocobulance → 4 "choco-medic" in red uniform delivers and takes payment →
5 promoters film the handover on Ray-Ban glasses, post to social (optional for the customer).

**Mechanic, Uklon version (PDF):** Chocobulance appears as a tariff in the Uklon app next to
Standard / Comfort / Business, priced 99 000 UZS (was 120 000). User orders like a taxi; order
goes to the ambulance driver on the Uklon driver app; van arrives; chocolate doctor hands over
the product. Uklon provides: the tariff, driver app on 2 cars, payments. Chococream provides:
2 full-time cars, blogger UGC, PR article, co-branded social content. **2 weeks, Tashkent only.**

**Audience:** open line, anyone can call, but core = adults 18–35, parents and young people
(they hold the phone, make the payment decision, and the joke is about them).

**Paid, not free** (to filter demand and keep queues short): product price + small call-out /
delivery fee; two payment methods. Limited to Tashkent, working hours, by district.

**PR channels in priority order:** 1 teaser OOH / LED billboards with empty tubs → 2 bloggers
explain, try and recommend Chocobulance → 3 earned PR article in humorous "parents eat it" style.

### Design references
Curated, verified board: **`brief/references.md`** (screenshots in `brief/references/`). Key picks:
Scout Motors (structure/mood), the open-source GSAP car-scroll hero (exact mechanic: pinned
hero, car drives, wheels rotate), Cyclemon (scene-by-scene parallax), Codrops scroll-driven
SVG map (Tashkent coverage section). Proposed stack: GSAP ScrollTrigger + Lenis, layered
SVG/PNG van with separate wheels, CSS scroll-driven animations as enhancement, static fallback
for reduced motion.

### Scroll-world option (2026-10-20)
`scroll-world` could render the whole story as one continuous AI-generated camera flight through
a miniature Tashkent (clay-diorama or any art direction): flat with empty tub → the call → depot
→ streets → handover. Scroll scrubs a pre-rendered film; copy and CTA are HTML overlays.
Trade-offs vs the GSAP layered-illustration approach (brief/references.md §C):
wow factor and cinematic coherence ↑; cost (≈ $11–27 per desktop chain on Monid, 2× with a
native 9:16 mobile chain, plus Higgsfield credits for stills), page weight (video), seam risk,
and less control over the exact van/wheels ↓. Prerequisites checked 2026-10-20: see session log.

### Implication for the website
The site is the public face of the "emergency line": explain the joke in one screen, make the
order action unmissable (call / order button), show how it works (steps), price, coverage and
hours, and feed the UGC loop (social links, maybe a gallery). Mobile-first: traffic comes from
billboards, blogger stories and the Uklon app on phones.

### What was built (v1, 2026-10-20)

A bilingual (UZ default, RU) scroll-driven landing page, built from the spec and plan in
`docs/superpowers/specs/2026-10-20-chocobulance-landing-design.md` and
`docs/superpowers/plans/2026-10-20-chocobulance-landing.md`. Five pinned story scenes (hero with the
van and the "105" numeral, kitchen with Dad, the call, the road drive with parallax and rolling
wheels, the door) then How it works, coverage with price and hours, FAQ, footer. Hotline only,
Tashkent only, 99 000 UZS on delivery. Reduced motion gets still frames. How to operate it:
`README.md` (change the number, campaign mode, copy, the car, motion, Vercel).

File map:
- `index.html` shell and head tags (title, description, Open Graph, Twitter, hreflang);
  `public/` favicon and `og.png` (1200x630 hero render).
- `src/config.ts` single source for `HOOK` (105, the campaign line), `PHONE` / `PHONE_DISPLAY`
  (dial target, placeholder 105), `PRICE`, `MODE` (teaser / live / ended), `LAUNCH_DATE`.
- `src/i18n.ts` + `src/i18n/uz.json`, `ru.json` copy engine; `src/state.ts` mode and phone hint;
  `src/main.ts` boot.
- `src/scenes/*.svg` + `mount.ts` the art; `src/van/van.svg` + `van.ts` the swappable van.
- `src/scroll/` `timeline.ts` (GSAP story), `reduced.ts`, `motion.ts`, `smooth.ts` (Lenis).
- `src/styles/` tokens, base, layout, scenes, van. `tests/` 11 files, 168 tests, all passing.
- Quality: Lighthouse mobile (Slow 4G, 4x CPU) performance 100 (uz) / 99 (ru), CLS 0, about
  113–131 kB transferred.

Calls made while building: 105 is the hook shown in copy, the dial target is separate and a small
"yoki {phone}" hint shows only when they differ in live mode; apostrophes follow the ʻ / ʼ
convention (README); the call bar (phones) and header pill (desktop) take over from the hero
button as its top edge reaches the header, and step aside while the call under the steps is fully
on screen.

### What was built (v2, 2026-10-25)

Replaces the v1 scenes (still in git history before this commit). One long red page:
`body::before` paints the teaser's radial red (`--poster-bg`, brand red `#C71920` lit to `#DA3038` in
the middle, `#A31219` at the edges) once, fixed. On it, white:

1. Hero: "Yebqoʻydingizmi?" / «Всё съели?» on a gentle arc (SVG `textPath` in `h1`, real words beside it
   visually hidden). 2. "Endi kichkintoyni tezlik bilan ovutish kerak". 3. "Telefoningizni oling,
   [71 209 99 00] raqamiga qoʻngʻiroq qiling" (the number a white pill, `tel:`). 4. "Chocobulance
   uyingiz eshigida" with the car parking under it. 5. Qanday ishlaydi? (3 steps). 6. Chaqirish bepul /
   Shokolad pastasi — 99 000 soʻm / dona. 7. Xizmat faqat Toshkent shahri ichida. Footer: © line only.
   Header: Chococream 20 logo (on-red PNG), call pill (icon only on phones), UZ/RU.

The car: lanes between the blocks (`data-lane`: enter, ltr, arrive, ltr, rtl), one ScrollTrigger each
(`src/scroll/car.ts`), writing only `transform`; wheels spin with the distance. Blocks are at least a
screen tall so only one car is ever on screen. Placeholder art in `public/car/` (the v1 van converted
to standalone SVGs, left and right views). Reduced motion: lanes hidden except the door, car parked.
Removed: `src/scenes/`, `src/van/`, `timeline.ts`, `reduced.ts`, FAQ, coverage map, sticky bar, 105.
Quality: 91 tests, typecheck and build clean; Lighthouse mobile performance 99, accessibility 100,
best practices 100, CLS 0, about 110 kB (uz) / 118 kB (ru); SEO 83 only for relative hreflang
(fixed by `VITE_SITE_URL` at deploy).

### The car (2026-10-25)

Source: the user's `~/Desktop/Hyundai_starix_chococream_20.pdf` (Illustrator, 4 pages: Hyundai Staria
in Chococream livery, page 1 facing left, 2 facing right, 3 rear, 4 front; CMYK photo with a soft
mask). Exported by `tools/car/` (README "The car"): rendered with Quartz for ColorSync colours (red
`#D9242A`; pdftocairo gives `#ED1C24`), enclosed transparent holes (between the spokes) filled with
what they show on white, cropped to one frame for both views, WebP at 1440 and 720 px wide; each rim
cut out as a round disc (r = rim edge + 5 px) laid exactly over the photo's rim and spun by the distance
rolled (`--tyre-share` 0.1403 from the measured tyre). `src/styles/car.css` is generated. Car size on
the page: `clamp(280px, 48vw, 720px)`. On the red page the car gets "some shape" (user, 2026-10-25): a
brown-tinted drop shadow on the body (`.car__body` filter) so the red spoiler and stripes read, and a
contact shadow under the tyres (`.car::before`); rims on their own layers so the filter never redraws. Higgsfield was offered for images; not used (the PDF is the
exact car). Lighthouse after: performance 99, LCP 2.2 s, CLS 0, about 197 kB.

## 8. Session log

- **2026-10-15** — User created private GitHub repo and connected `origin`. Installed Railway CLI
  (Homebrew) and logged in. No Railway project created. Paused for the day.
- **2026-10-19** — User named the brand (Chocoream, Uzbek) and the goal (PR activation landing
  page). Set rules: keep `CLAUDE.md` updated; use Apple design guidelines; more skills on request.
  Installed `apple-design` skill project-level. Created this file. Next: receive the full brief.
- **2026-10-19 (later)** — User asked to install superpowers, andrej-karpathy-skills,
  ui-ux-pro-max, rtk and graphify. All were already installed globally; upgraded superpowers
  6.1.1→7.0.0, ui-ux-pro-max 2.5.0→2.15.0, rtk 0.40.0→1.0.1, graphify 0.8.37→0.9.92. Karpathy
  already latest. Documented in section 5. User restarted Claude Code; new plugin versions
  confirmed active. Still waiting on the brief.
- **2026-10-19 (brief)** — User shared the 605 Agency concept HTML (105 version) and the
  Uklon partnership PDF. Both read; summary, open questions and extracted key visuals recorded
  in sections 6–7 and `brief/`. Next: discuss and brainstorm the website with the user.
- **2026-10-19 (decision)** — User: the website explains the activation and supports both the
  hotline call and ordering through Uklon. Brainstorming the page with the user (superpowers
  brainstorming skill); nothing built until the description is approved.
- **2026-10-19 (decisions)** — User decided: hotline only (placeholder number 105, real one
  later — reminder set), info-only site, Tashkent only, 99 000 UZS paid on completion, scroll-
  driven parallax landing with the van moving and wheels turning. Asked for design references
  first. Next: deliver references, then brainstorm the design.
- **2026-10-20** — Searched and live-verified design references (Scout Motors, GSAP car-scroll
  hero, Cyclemon, Trig.js CSS car, Codrops scroll map, Ford Raptor 3D, Truck'N Roll). Wrote
  `brief/references.md` with what to borrow and a proposed approach. Next: design discussion
  (brainstorm) with the user, then build.
- **2026-10-20 (skills)** — User asked to check scroll-world and 7 design-skill repos
  (emilkowalski, garden-skills, elayadesign, MengTo, jakubkrehel, tastemaker, designer-skills).
  Installed a curated set of 22 skills project-level (table in §5), renamed Emil's
  `apple-design` → `apple-web-motion` to avoid clashing with dickwu's. Story brainstorm in
  progress: user liked the "Dad ate it" angle, wants it funnier and more visual.
- **2026-10-20 (approach)** — User chose the cheap, code-only route: no scroll-world video chain,
  everything drawn in SVG/CSS/JS, van as a swappable component. Two code-only looks under
  discussion: (A) side-scrolling cartoon street with parallax, (B) isometric paper/clay
  diorama built from SVG blocks with a gliding "camera". Offered browser mockups to compare.
- **2026-10-20 (plan)** — Wrote the design spec and the 8-task implementation plan. Builder check
  raised two gaps, resolved as my calls: 105 = campaign hook, dial target a separate constant
  shown in small text when different; `MODE` teaser/live/ended flag. Started building with
  subagents per the user's instruction (Sonnet routine, Opus art/motion), reviewing each task.
- **2026-10-20 (build, in progress)** — Tasks 1–4 done on `main` (scaffold, i18n UZ/RU, markup +
  layout, van component). Progress ledger: `.superpowers/sdd/2026-10-20-chocobulance-landing/progress.md`
  (git-ignored; if missing, `git log` is the record). Next: Task 5 scenes (Opus), Task 6 motion (Opus),
  Task 7 mobile/a11y (Sonnet), Task 8 deploy/docs (Sonnet). Preview: `npm run build && npm start`.
- **2026-10-20 (build complete)** — Tasks 1–8 done on `main`, 13 commits, 168 tests green,
  typecheck and build clean, Lighthouse 100 (uz) / 99 (ru). Task 8 added the deploy config
  (`.nvmrc`, `engines`, `typecheck` script, `railway.json` on Railpack), README, OG image and
  Open Graph / hreflang tags, this file's update, the committed `.claude/launch.json`, and the hero
  hand-off fix (the call bar / header pill now appear as the hero button's top reaches the
  header, so there is no stretch of scroll with no call button). **Not deployed and not pushed**;
  the user decides both. Open items: real phone number (`PHONE`, `PHONE_DISPLAY`), service hours,
  social links (inert), domain (then absolute `og:image` / `og:url` / `hreflang`), final van art,
  launch date, Uzbek ʻ glyph taste (wide in Nunito: keep, ASCII `'`, or a narrower font).
- **2026-10-20 (final review + fix wave)** — Whole-branch review (Opus) found 3 Important: anchor
  links landed mid-story, hero note invisible over the road at laptop heights, no legible real
  number on desktop once `PHONE ≠ HOOK`. One fix wave resolved all three plus 8 minors (Node floor,
  `serve` without `-s`, `%VITE_SITE_URL%` for absolute share tags, hidden inert social pills,
  `?lang` replaceState, breakpoint gap, deploy smoke list, dispatcher-line hint). Re-review clean.
  State: `main` at 15 commits, 190 tests green, typecheck + build clean. **Not pushed, not deployed**
  — user's call. Review reports: `docs/superpowers/reviews/`; task reports + build ledger:
  `docs/superpowers/reports/`. Preview: `npm run build && npm start`.
- **2026-10-21 (handoff)** — User made the GitHub repo **public** so a collaborator can fork it,
  continue, and later merge + deploy. Built the handoff: `HANDOFF.md` (committed, read-first guide
  for the next developer) and the git-ignored `handoff/` bundle + `Chocobulance-handoff.zip`
  (full conversation as Markdown, agency brief sources, key visuals, references, spec, plan,
  reviews, task reports). Scrubbed the Railway login email from this file. ⚠️ The public repo
  contains the campaign concept (`brief/`, spec) — the user accepted that by making it public.
- **2026-10-21 (pushed)** — User said "push main to origin now"; pushed `main` (16 commits, head
  `5a50b3a`) to the public repo and set upstream. Pre-push audit: no PDFs, no brief HTML, no
  handoff bundle, no secrets in the tracked tree. Next: collaborator forks and continues; the
  client sets the real phone number, hours, social links and domain; then deploy on Railway.
- **2026-10-22 (brand kit)** — Fresh session: re-read the whole repo (docs, brief, spec, plan,
  reviews, source, styles, tests layout) for context. User added `Chococream Design System.zip` and
  `Chococream Logo Lockup.html` from their Claude Design brand system. Unpacked the zip to
  `brand/design-system/` (untracked, not committed) and documented it in §7 "Brand kit": official
  "Chococream 20 yoshda" lockup (SVG has lost its colours, PNGs fine), Mochipop Bold **demo** font
  (Latin only: no Cyrillic, no ʻ/ʼ), Inter body, brand red `#C71920`, warm neutrals, 4-px spacing,
  28-px radius, pill buttons, and brand rules that forbid parallax and illustrated backgrounds.
  Site not restyled yet; the conflicts to decide are listed in §6b. claude-mem observer is signed
  out (needs `/login`), so only CLAUDE.md and the native memory file record this session.
- **2026-10-23 (brand mockup)** — User ran `claude auth login` from the terminal tab; claude-mem saves
  again. Then asked for a Design-artifact mockup of the landing restyled to the brand kit:
  https://claude.ai/artifact/KyReJViwrXSeUSkRiG4NqL (six artboards: hero 1440 + 390, kitchen, road,
  how it works, coverage; sources in the session scratchpad, not in the repo). Choices shown there:
  hero and road on flat brand red `#C71920` with white Mochipop headlines and a white call pill;
  kitchen on white, steps and coverage on cream `#F7EDE0` with white radius-28 cards; the existing
  scene SVGs re-coloured through the token map (sky gradients flattened, hazel/skin to beige,
  blue accents to white/beige); van kept white with a **chocolate roof** and red stripe (a red roof
  vanished on red); Mochipop headlines use ‘ / ’ instead of ʻ / ʼ (glyphs missing); Inter for body
  and buttons; secondary text brown-500 because the kit's warm gray is 4.1:1 on white. Next: user
  reviews the canvas, then either apply to code (tokens, fonts, logo in header, flat skies) or revise.
- **2026-10-25 (v2: the red page)** — User sent the campaign teaser (white rounded "Dadam yeb qoʻydilar" on
  a radial red) and the new chronology, with the real number **71 209 99 00**. Decided: arched hero,
  105 dropped everywhere, footer legal = © only. A plan mixing posters with the illustrated scenes was
  rejected: the user wants **one long red background, only their words, nothing else, and their real
  car (Figma) driving right-to-left / left-to-right on scroll**. Built it (§7 "What was built (v2)"):
  Baloo 2 headlines (matched to the teaser in the browser), placeholder car until the Figma file arrives.
  Committed on `main`, not pushed, not deployed. Next: user reviews; swap in the Figma car (README
  "Swap the car"), redo `og.png`.
- **2026-10-25 (pushed + deployed)** — User: "push and deploy, I want to test it myself". Pushed `main`
  (v2 + `public/serve.json`, no directory listing). Created Railway project `chocobulance` in "Haysam AI
  School", service from the GitHub repo (auto-deploy on push), domain
  https://chocobulance-production.up.railway.app, variables `VITE_SITE_URL` and `RAILPACK_NODE_VERSION=22`.
  Smoke check passed: `/` and `/?lang=ru` 200, `/og.png` image/png, `/robots.txt` 200, `/assets/` and
  `/nope` 404, absolute og/hreflang, `tel:+998712099900`, fonts and car load with no failed requests.
  Next: user tests; Figma car; phone-size hero question (split "Yeb qoʻydingizmi?").
- **2026-10-25 (the real car)** — User sent the car design as a PDF (Illustrator, 4 views). Built the
  `tools/car/` pipeline and replaced the placeholder with both side views and spinning rims (§7 "The
  car"). User offered Higgsfield (skill `higgsfield-ai/skills`) for image generation, asked to spend
  credits only when needed; not installed or used. Pushed (auto-deploys).
- **2026-10-25 (car shape)** — User: "give it some shape, push to GitHub, after I see it we will work
  on it". Added the body's drop shadow and a ground shadow (layout.css), new `og.png`. Pushed (Railway
  redeploys). Next: user reviews the live page and iterates.
- **2026-10-25 (Vercel)** — User wanted Vercel as well, since it is free. Through the Vercel connector:
  project `chocobulance` in "recloglobal's projects", linked to the GitHub repo, `VITE_SITE_URL` set,
  first production deploy from `0b63a5a` READY in seconds. Smoke check passed on
  https://chocobulance-omega.vercel.app (pages, ru, og.png, robots.txt, car images, 404s, absolute share
  tags). Railway left running; both deploy on push. Next: user decides whether to keep both.
- **2026-10-26 (Railway removed)** — User: "remove railway". Deleted the Railway project `chocobulance`
  (deletion scheduled by Railway), unlinked the folder, removed `railway.json`, rewrote the README deploy
  section for Vercel only. Live site: https://chocobulance-omega.vercel.app.
- **2026-10-26 (bigger logo)** — User: the Chococream logo in the header should be bigger. Logo now
  sized by width, `clamp(175px, 130px + 10.5vw, 280px)` (64 px tall on wide screens, about 1.8x
  before); header 88 px from 1024 px; on very narrow phones the logo link shrinks so the call and
  language buttons stay on screen. Checked at 2000, 1440, 800, 390, 320 px. Committed, waiting for
  the user's OK to push (a push deploys to Vercel).
- **2026-10-26 (header, wheels, red lines, map, favicon)** — User feedback on the live site:
  (1) phone number centred in the header: the header is a 3-column grid (logo | call | language);
  (2) the rear wheel of the right-facing car was off its circle: the rim finder had counted a hole
  filled white between the spokes as alloy (23 px off). `export.py` now finds rims on the unfilled
  render, fits each centre to the rim's outer edge (spread about 1 px, mirrored wheels agree to
  0.1 px) and fills holes inside wheels with the dark behind the spokes, not white;
  (3) "red lines not accurate": lossy WebP's half-resolution colour smeared the livery's red edges;
  the car is now AVIF 4:4:4 (edge error 34 to 8, files smaller);
  (4) service area map: MapLibre GL 5 + OpenFreeMap (free, no key, commercial OK) with Tashkent city
  (OSM relation 2216724) outlined in red, outside dimmed, cooperative gestures, lazy-loaded near the
  section (about 270 kB gz, never on the first screen);
  (5) favicon still said 105: now the "20 yoshda" of the lockup on brand red (`favicon.ico`,
  `icon-192.png`, `apple-touch-icon.png`), `favicon.svg` removed. Also the bigger logo from the
  previous entry. Lighthouse after: 99 / 100 / 100 / SEO 92 (hreflang, absolute on Vercel), CLS 0.
  Committed; waiting for the user's OK to push.
- **2026-10-26 (feedback round 2, pushed)** — Map: the service area is **inside the big Tashkent Ring
  Road** (4P1, OSM relation 3122331), not the city boundary; traced outline in
  `src/map/service-area.json` (`tashkent.json` removed). Copy: call line in three lines
  ("Telefoningizni oling," / 71 209 99 00 / "raqamiga qoʻngʻiroq qiling!", one line each from 900 px);
  "Chocobulance uyingizga shoshadi" (RU «Chocobulance уже спешит к вам»); "Xizmat bepul!" and
  "Shokolad pastasi — 99 000 soʻm." (RU «Обслуживание бесплатно!», «Шоколадная паста — 99 000 сум.»).
  Spacing after the cars halved (blocks 60svh, the door 70svh); crossings now run while the lane is
  in the middle third of the screen (`START`/`END` in car.ts), one car at a time measured at
  1440x900, 1280x720, 390x844. "Qanday ishlaydi?": three white cards in a row (stacked on phones),
  red number badges, phone / pin / heart icons, dashed connectors. Pushed on the user's instruction.
- **2026-10-26 (feedback round 3)** — Service area = **the line the client drew** in blue over the map
  (their Tashkent: the ring road N/W/E, a cut across the south above Babur and Abad); traced from the
  screenshot, georeferenced against the previous outline (mean error < 1 px), in
  `src/map/service-area.json`. Area heading "Xizmat faqat Toshkent shahrida koʻrsatiladi!" (RU
  «Сервис работает только в Ташкенте!»); heading + map fill exactly one screen with the header
  (`#area` 100svh, map takes the rest). Removed the car between the steps and the price ("card" in the
  client's messages means the car); the last lane now drives left to right (L, R, L-park, R). More space
  above "Chocobulance uyingizga shoshadi". "Endi kichkintoyni tezda ovutish kerak". One car on screen
  at a time re-checked at 1440x900, 1280x720, 390x844. Next: the client will send photos of a boy holding
  an empty Chococream tub (a preview arrived: profile, facing right, yellow T-shirt, white background) to
  be added tastefully.
- **2026-10-26 (the boys)** — Client added two transparent PNGs to `imgs/` (curly-haired boy, boy in a
  yellow T-shirt, both frontal, sad, holding an empty Chococream tub, cut at the waist). Placed either
  side of "Endi kichkintoyni tezda ovutish kerak" (`.beat--boys`): same height (up to 540 px), bottoms
  faded into the page with a mask, rising in after the words; side by side under the words on phones.
  No drop shadow (the mask clipped it into a visible box). Exported with `tools/photos/export.py`
  (body alpha >= 240 made opaque, AVIF 4:4:4 at 900 and 450 px). `imgs/` sources are not committed.
  Committed; waiting for the client's OK to push.
