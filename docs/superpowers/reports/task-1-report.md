# Task 1 report: Scaffold, config, tokens, skeleton

Status: DONE (with minor notes below)
Commit: bc15771 chore: scaffold Vite + TS project with config and tokens (not pushed)

## What I implemented
- npm project (type module, private): scripts dev, build (vite build), preview, test (vitest run),
  format, start (serve -s dist -l ${PORT:-3000}); engines.node >= 20.
  Deps: gsap, lenis, @fontsource/nunito, serve. Dev: vite, typescript, vitest, prettier, @types/node.
- vite.config.ts (uses `defineConfig` from `vitest/config`): test.environment node, globals true,
  include tests/**/*.test.ts.
- tsconfig.json: strict true, ES2022, bundler resolution, noEmit, isolatedModules,
  types [vite/client, vitest/globals, node], include src, tests, vite.config.ts.
- .prettierrc (singleQuote, printWidth 100), .gitignore, railway.json (same content as the brief,
  prettier-formatted to multiple lines), public/favicon.svg (red circle, white "105").
- src/config.ts: HOOK '105', PHONE '105', PHONE_DISPLAY '105', PHONE_TEL `tel:${PHONE}`,
  PRICE '99 000', MODE 'live' (typed as exported `Mode` union so later comparisons stay
  type-valid), LAUNCH_DATE ''. Carries the required TODO comment.
- src/styles/tokens.css: all colour tokens exactly as given (hex lowercased by prettier, values
  identical), --font-display, --font-body, --s1..--s10 (8px..80px in 8px steps), --r-s 8px,
  --r-m 16px, --r-l 28px.
- src/styles/base.css: box-sizing reset, `html { scroll-behavior: auto }`, body background
  --cream / colour --choco / --font-body, :focus-visible ring 3px --red, .visually-hidden,
  light element resets.
- index.html: `<html lang="uz">`, viewport meta with viewport-fit=cover, `<title data-i18n="meta.title">`
  and `<meta name="description" data-i18n="meta.description">` both with placeholder "Chocobulance",
  favicon link, header#header, main containing section ids hero, scene-kitchen, scene-call,
  scene-road, scene-door, how, coverage, faq, footer#footer, div#sticky-cta, module script
  /src/main.ts. No other visible text.
- src/main.ts: imports tokens.css and base.css only.

## TDD evidence
RED: `npx vitest run tests/config.test.ts`
```
 FAIL  tests/config.test.ts [ tests/config.test.ts ]
Error: Cannot find module '../src/config' imported from .../tests/config.test.ts
 Test Files  1 failed (1)
      Tests  no tests
```
GREEN (after creating src/config.ts): `npx vitest run tests/config.test.ts`
```
 Test Files  1 passed (1)
      Tests  1 passed (1)
```
Full suite before commit: `npm test` -> Test Files 1 passed (1), Tests 1 passed (1).

## Verification
- `npm run build`: success. dist/index.html 1.00 kB, one CSS (1.26 kB), one JS (0.67 kB).
- `npx tsc --noEmit -p .`: no errors. `prettier --check`: clean.
- `npx vite preview --port 4173` served the page; curl: / 200 text/html, /favicon.svg 200
  image/svg+xml, built JS 200 text/javascript, built CSS 200 text/css. Built CSS contains the tokens.
  Preview server stopped afterwards.
- Browser pane navigation to localhost was denied by the environment, so a real console-errors
  check was not possible. Evidence of no errors is limited to: every referenced asset returns 200,
  the JS bundle only imports CSS, tsc is clean.
- Ignore check: the PDF, chocobulance-pr-activation.html and .superpowers/ are ignored; `git ls-files`
  contains no pdf or the HTML brief. Commit has 353 files: CLAUDE.md, docs/, brief/ (md, png, jpg
  only), .claude/ (project skills, no settings files), package-lock.json and the scaffold.

## Files changed (all new)
package.json, package-lock.json, vite.config.ts, tsconfig.json, .prettierrc, .gitignore, railway.json,
index.html, src/main.ts, src/config.ts, src/styles/tokens.css, src/styles/base.css,
public/favicon.svg, tests/config.test.ts; plus pre-existing CLAUDE.md, docs/, brief/, .claude/ added
unmodified.

## Self-review findings
- Completeness vs brief steps 1-9: all done.
- YAGNI: no files beyond the brief and required tooling config. `format` script is scoped to
  index.html, vite.config.ts, src, tests so it can never rewrite CLAUDE.md, docs/, brief/ or .claude/.
- Fixed during review: the brand spelling in the package.json description (Chococream) and a clumsy comment in config.ts.

## Concerns / notes for the controller
1. Versions are newer than the plan text: Vite 8.3.4, TypeScript 7.0.2, Vitest 4.1.12, GSAP 3.15.0,
   Lenis 1.3.27 (plan says Vite 6, TS 5). You asked for latest stable, so I installed latest; build,
   tsc and vitest all work. If a later task hits a Vite 8 / TS 7 incompatibility, pin down to
   vite@6 / typescript@5.
2. T2: `<meta name="description" data-i18n="meta.description" content="Chocobulance">` follows the
   instruction literally. A generic `[data-i18n]` textContent loop would write text into the meta
   element (a harmless no-op) while the real `content` attribute must come from applyI18n's dedicated
   meta-description branch, which the plan already specifies.
3. T3: header, footer and sticky-cta sit outside `<main>` (semantically correct); ids exist as the
   spec requires.
4. T3: Nunito is not imported yet (plan puts `@fontsource/nunito/800.css|900.css` in Task 3).
   --font-display falls back to the system stack until then.
5. T4: tsconfig `types` already includes vite/client, so `*.svg?raw` imports type-check; a
   src/vite-env.d.ts is optional.
6. Commit trailer: used the exact line the controller specified (Claude Fable 5.1), which differs
   from the harness default attribution (Claude Sonnet 5.5).
