# Chocobulance — Chocoream PR Activation Landing Page

> **Read this file first in every session.** It is the single source of truth for this project.
> Rule set by the user on 2026-10-19: Claude must keep this file updated after every meaningful
> step so a brand-new session can resume without re-asking. If this file and any memory note
> disagree, this file wins.

## 1. What this project is

- **Brand:** Chococream (official spelling; user sometimes types "Chocoream") — Uzbek chocolate-hazelnut spread, 20th anniversary.
- **Purpose:** a landing page for a **new PR activation**. "Chocobulance" is the project/campaign
  codename (folder name and GitHub repo name).
- **Status (2026-10-19):** brief received, key decisions made (section 6a), design references
  being gathered. No page code exists yet.

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
| Git | Repo initialized, branch `main`, **no commits yet**. |
| GitHub | `origin` → `https://github.com/reclofounder/yebqoydi-chocobulance.git` (private). |
| Railway | CLI installed via Homebrew, logged in as `reclofounder@gmail.com`, workspace **"Haysam AI School"**. **No Railway project yet** — create a NEW one for this site. Do **not** touch the existing project "Haysam Landing Page Live". |
| Deploy target | Railway (user's choice). Vercel plugin hooks appear in sessions; ignore them unless the user asks. |
| Stack | Not decided — depends on brief. Default proposal: lightweight static site (plain HTML/CSS/JS, or Astro if content needs structure), mobile-first. |

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
| Phone number | Real number is not ready. **Use `105` as a placeholder everywhere.** ⚠️ **REMINDER: ask the user for the final working number before launch**, then replace every `105` (tel: links, copy, OG tags). |
| Site purpose | **Information only, for end users:** what Chocobulance is and how to call. No order form, no payment online. |
| Coverage | **Tashkent city only.** Say clearly that addresses outside the city may not be served. |
| Price | **99 000 UZS**, paid by the customer **when the service is completed** (on delivery). |
| Design direction | "Super cool" animated **parallax** landing page: the **Chocobulance van moves with scroll, wheels animate**. Scroll-driven storytelling. Still must respect Apple HIG rules (clarity, restraint, reduced-motion fallback). |
| Process | User wants **design references first**, then a design discussion, then build. |
| Production approach (2026-10-20) | **Code only, no AI-generated video.** scroll-world is installed but rejected for this project (cost, and the final van visual is not ready so renders would be redone). Build the world in SVG/CSS/JS with scroll-driven motion. **The van must be a swappable component** (placeholder now, final art later, same anchor points for body/wheels/shadow). Creative but cheap. |

### 6b. Still open

- Languages: Uzbek (Latin) is the base. Russian version? (Tashkent audience is bilingual.)
- Brand assets: real logo, brand font, product packshots, and a **usable van image** (cut-out
  or illustrated van with separable wheels is needed for the scroll animation). Current van
  visuals are AI renders in `brief/key-visuals/`.
- Service hours and days.
- Social links (Instagram / Telegram) for the UGC loop.
- Domain name.
- Final phone number (see reminder above).

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
