# Task 8 report: deploy config, README, OG image, project docs

Commit: `5bc634f chore: deploy config, README, OG image, docs` (on `main`, 13 commits in total, not pushed, not deployed).
Status: DONE_WITH_CONCERNS (see section 8).

## 1. What changed, per item

**Carried item 1: Node floor and scripts.** `.nvmrc` = `22`; `engines.node` = `>=20.19`; new script `"typecheck": "tsc --noEmit"` (mentioned in the README). `npm start` untouched (`serve -s dist -l ${PORT:-3000}`).

**Carried item 2: hero hand-off gap.** `headerAndSticky` in `src/scroll/timeline.ts`: trigger `start` is now `top top+=<header>` (was `bottom top+=<header>`). `initReduced` in `src/scroll/reduced.ts` mirrors it (`getBoundingClientRect().top <= header height`; local renamed `callGone` to `atHeader`). Comments updated. Tests in `tests/motion.test.ts` updated: the pinned-story test now pins `/^top top\+=\d+$/`, the reduced-motion test mocks `top` instead of `bottom`. See section 4 for the scan.

**Carried item 3.** `.claude/launch.json` is committed.

**OG image and head tags** (`index.html`):
- `og:type website`, `og:site_name`, `og:locale uz_UZ` + `og:locale:alternate ru_RU`, `og:title`, `og:description`, `og:image` (`/og.png`) with `og:image:width/height` 1200/630, `twitter:card summary_large_image`, `twitter:title/description/image`.
- `hreflang` alternates: `uz` (`/?lang=uz`), `ru` (`/?lang=ru`), `x-default` (`/`).
- Title, `description`, `og:*` and `twitter:*` text now ship statically in Uzbek, filled from `uz.json` + `config.ts` (before: `<title>` and description were the placeholder "Chocobulance"). They keep `data-i18n="meta.title|meta.description"`, so the engine's existing `meta` branch (`content`) swaps them per language (verified live: `?lang=ru` gives the Russian title and og:title). Reason: link-preview scrapers (Telegram, WhatsApp, Facebook) do not run scripts. Drift guard: a test compares each static value with `t(key, 'uz')`.
- `applyHreflang` in `src/i18n.ts` skips codes that are not `uz`/`ru` (`isLang` guard), so `x-default` is not touched or broken. Added a characterization test for it. Live: uz and ru become `http://localhost:4180/?lang=…`, `x-default` stays `/`.
- Found while building: Vite processes every `<link href>`, so `<link rel="alternate" href="/">` made `vite build` fail with `EISDIR`. The three alternates carry `vite-ignore` (Vite removes the attribute in the output). Commented in `index.html`. Also `og:image`/`twitter:image` are processed by Vite as assets: `/og.png` is in `public/`, so it stays `/og.png`.
- `og:image` is the relative `/og.png`, as ruled; README says to make `og:image`, `twitter:image`, `hreflang` absolute and add `og:url` once the domain exists.

**`public/og.png`** (1200x630, 102 KB). How it was produced: headless Google Chrome driven over CDP from a scratch script (scratchpad, not in the repo), against the built page served by `npm start` on port 4180: `?lang=uz`, viewport 1600x840 with `deviceScaleFactor` 0.75 (so the png is exactly 1200x630 and the whole hero, van and "105" numeral included, fits), `.header` and `.hero__scroll` hidden before the capture. A plain 1200x630 viewport cut the van off. The method is described in the README (Deploy section).

**`railway.json`** (verified, changed): now `{"build":{"builder":"RAILPACK","buildCommand":"npm run build"},"deploy":{"startCommand":"npm start"}}`. This deviates from the ruling "build `npm ci && npm run build`"; see section 8, concern 1.

**README.md** sections: what this is; Commands (dev, build, preview, start, test, typecheck, format); Project layout; Change the hotline number (HOOK vs PHONE / PHONE_DISPLAY, the "yoki …" hint when they differ in live mode); Campaign mode; Edit copy (JSON, `{hook} {phone} {price} {date}`, the ʻ U+02BB / ʼ U+02BC convention, key parity, the static meta copies); Swap the van; Scenes and motion (ids, tuning constants, reduced motion); Deploy on Railway; Known open items. `src/scenes/README-van-swap.md` is one paragraph pointing at the README section.

**CLAUDE.md** (the controller's uncommitted edit is included as it was): section 3 rewritten (git state, stack decided, Railway config and steps, preview config; the stale "no commits yet" and "stack not decided" are gone), a "What was built (v1)" subsection with the file map added at the end of section 7, a session-log entry appended to section 8. No other section touched.

**Tests:** `tests/markup.test.ts` +4 (og:image, 1200x630 png header bytes, twitter image, og:type and twitter:card, static-vs-`t()` meta values, hreflang uz/ru/x-default), `tests/i18n.test.ts` +1 (x-default untouched), `tests/motion.test.ts` 2 edited.

## 2. TDD evidence

- Markup tests first, run before the tags existed: `4 failed | 16 passed` (og:image, og:type/twitter:card, meta values, hreflang). After the tags: 1 failed, only on the missing `public/og.png` (ENOENT); after the image: `20 passed`.
- Motion tests first: `2 failed | 50 passed` (trigger regex `^top top\+=`, reduced test with `top`). After the two source edits: `52 passed`.
- x-default test: written as a characterization test, green immediately (the engine already skips it); that was the "check it does not choke" item.

## 3. Serve check (`npm run build && PORT=4180 npm start`)

```
 INFO  Accepting connections at http://localhost:4180      (lsof: TCP *:4180 LISTEN, all interfaces)
/                HTTP/1.1 200 OK  Content-Type: text/html; charset=utf-8  Content-Length: 13623
/og.png          HTTP/1.1 200 OK  Content-Type: image/png                  Content-Length: 102240
/favicon.svg     HTTP/1.1 200 OK  Content-Type: image/svg+xml              Content-Length: 284
/?lang=ru        200 (same shell)
/nope            200 (shell: serve -s is SPA mode)
```
Built `dist/index.html` carries the three alternates without `vite-ignore`, `og:image` `/og.png`, `twitter:card`. In the browser (390x844 touch, uz and ru) there were no console errors or exceptions. Server stopped afterwards.

## 4. Hero hand-off scan (headless Chrome, built page, `window.scrollTo` + two rAFs per stop)

"Usable" = a `[data-cta]` whose centre point is hit-testable (`elementFromPoint` returns it). `~` = partly under the header (top above the header's lower edge). Baseline = HEAD `85d5130` built in a temporary worktree (removed afterwards).

| Case | Baseline (before) | After |
| --- | --- | --- |
| 390x844, pinned story, 1 px steps | hero~ 734-761, **NONE 762-792 (31 positions)**, bar from 793 | hero 700-733, hero~ 734-736, **hero~+bar 737-761**, bar from 762. No NONE. |
| 1280x800, pinned story, 10 px steps | hero~ 970-990, **NONE 1000-1020**, pill from 1030 | hero~+pill 970-990 (1 px steps: 970-997), pill from 998. No NONE. |
| 390x844, reduced motion, 2 px steps | **NONE 382-408**, bar from 410 | hero~+bar 354-380, bar from 382. No NONE. |
| 1280x800, reduced motion, 2 px steps | not run | hero~+pill 490-516, pill from 518. No NONE. |

Whole page, 20 px steps: 390x844 559 stops, 1280x800 601 stops: **zero stops with no usable call button** anywhere. Stops with two: the hero hand-off above (25-28 px of scroll, one of the two partly under the header) and the existing hand-off to the call under the steps (`how` + bar/pill, 2-4 stops).

So the gap is closed, but "exactly one" is not literally exact: for about 28 px of scroll the hero button (centre still clear, upper part under the header) and the new bar/pill both count. That is what `top top+=header` gives. If a strict one is wanted, the start would be the button's vertical middle (`center top+=<header>`); not done, outside the ruling.

## 5. Tests and checks run

- `npx vitest run`: **11 files, 168 tests passed** (163 before, +5), no warnings.
- `npm run typecheck`: clean. `npm run build`: clean. `npx prettier --check index.html vite.config.ts src tests README.md`: clean; `npm run format` leaves no diff.

## 6. Files changed

`README.md` (new), `src/scenes/README-van-swap.md` (new), `public/og.png` (new), `.nvmrc` (new), `.claude/launch.json` (added), `index.html`, `package.json`, `railway.json`, `CLAUDE.md`, `src/scroll/timeline.ts`, `src/scroll/reduced.ts`, `tests/markup.test.ts`, `tests/i18n.test.ts`, `tests/motion.test.ts`. 14 files, +336 / -27.

## 7. Self-review

- README commands all run as written (build, start, test, typecheck, format; preview and dev are stock Vite scripts, not started this round).
- CLAUDE.md facts match the repo: 168 tests, 13 commits (12 + this one), Lighthouse 100/99 and 113-131 kB are Task 7's numbers (not re-measured; the head tags add about 2 KB of HTML).
- Static title/description in `index.html` are a scope step beyond the brief ("static UZ text acceptable"): done for the same crawler reason and guarded by a test; revert is the 3 meta blocks.
- The README's hotline example number `'+998901234567'` is a placeholder in prose, not in the code.
- Not done on purpose: no `railway init/up/link`, no push, no new dependency, no `og:url` / canonical (domain unknown).

## 8. Concerns

1. **`railway.json` deviates from the ruling.** Railway's current docs (fetched this session: docs.railway.com/config-as-code/reference and railpack.com/languages/node) list the builders `RAILPACK` and `DOCKERFILE` (Railpack is the default for new services), do not list `NIXPACKS`, and flag config-as-code itself as deprecated: existing files keep working for legacy services until 2026-12-01. Railpack installs dependencies itself and mounts `node_modules/.cache` as a cache, so a build command that starts with `npm ci` reinstalls over it (the known EBUSY failure). I could not test a deploy, so this is from the docs only. One-line revert if the controller disagrees: the old file is in git (`85d5130`). If config-as-code stops applying, the same two commands go into the service settings (CLAUDE.md section 3 says so). Railpack reads `engines.node` before `.nvmrc`, and I could not confirm it resolves the range `>=20.19`; the README suggests the variable `RAILPACK_NODE_VERSION=22` as a safeguard.
2. **Hero note on common laptop viewports (pre-existing, not fixed).** At 1440x790 and 1500x788 the small note under the hero buttons ("Faqat Toshkent shahri · 99 000 soʻm · …") sits on the kerb line where the road art starts, half over the grey/white band. Legible but tangled with the art; at 1600x840 it clears the road. Worth a look before launch (layout.css / scenes.css, hero note position vs the road baseline).
3. Static `hreflang` hrefs and `og:image` are relative until the domain exists; crawlers want absolute ones (README, Deploy step 5, and CLAUDE.md).
4. `serve -s` answers every unknown path with the shell and status 200 (soft 404). Fine for a one-page site; noted, not changed. No cache headers for the hashed `assets/` (a `serve.json` could add them); not in scope.
5. The OG image has the placeholder 105 hotline in it; redo it (README says how) once the real number or copy changes the hero.

## 9. Scratch material (not in the repo)

Scripts and screenshots (`cdp.mjs`, `scan.mjs`, `shot2.mjs`, `og-new.png`, `handoff-390.png`, `hero-1440.png`) are in the session scratchpad: `/private/tmp/claude-501/-Users-draftbek-Movies-Chocobulance/418eb6f0-78c2-4dbf-a4a6-a67e9a057ca1/scratchpad/`.
