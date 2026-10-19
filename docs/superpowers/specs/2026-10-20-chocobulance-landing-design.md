# Chocobulance landing page — design document

Date: 2026-10-20 · Status: approved to build (user asked to plan, then build; details fixed later)
Owner: user (brand side) · Builder: Claude + subagents · Source of truth for project context: `CLAUDE.md`

---

## 1. Intent and why

Chococream (Uzbek chocolate-hazelnut spread) turns 20. The 605 Agency campaign "Yeb qoʻydi"
(someone ate it — usually Dad) becomes a real service for two weeks in Tashkent: when the tub
is empty, you call **105** (a parody of 103, the ambulance number) and a branded ambulance,
the **Chocobulance**, brings a new tub to your door for **99 000 UZS, paid on delivery**.

This website is the public face of the hotline. It must do three things, in this order:

1. Make people laugh and understand the joke within one screen.
2. Make the call action unmissable (phone number is a placeholder `105` until the real one arrives).
3. Answer the practical questions: how it works, price, where we deliver, hours.

It is **information only**: no order form, no online payment, no Uklon integration.

## 2. Goals, non-goals, anti-goals

**Goals**
- A scroll-driven, cinematic, funny page where the van visibly drives as you scroll, wheels turning.
- Loads fast on a mid-range Android phone over mobile data (budget: ≤ 400 KB transferred, LCP < 2.5 s).
- Uzbek (Latin) default, Russian toggle. Both complete.
- Apple-HIG-level clarity: big legible type, one primary action, calm layout, reduced-motion fallback.
- Van is a swappable component: placeholder art now, final art later, no animation rewrite.

**Non-goals**
- No AI-generated video, no WebGL/Three.js, no CMS, no backend, no analytics in v1.
- No order form, no map API, no chat widget.
- No English version in v1.

**Anti-goals (failure even if it "works")**
- Looks like a generic template or "AI slop" (purple gradients, stock hero cards).
- Scroll hijacking, jank on phones, or motion that keeps playing without scrolling.
- The joke explained in paragraphs instead of shown.
- The phone number buried below the fold or not tappable.

## 3. Constraints

- Static site, deployed on Railway (user's choice), code on GitHub `reclofounder/yebqoydi-chocobulance`.
- **105 is the campaign hook, not necessarily the dial target.** The user said the real hotline
  number comes later. So: `HOOK = '105'` stays in art, headlines, wordmark and the dial-pad scene
  (it is the brand of the service). `PHONE` (dial target, E.164, placeholder `'105'`) and
  `PHONE_DISPLAY` (human format) are separate constants; every `tel:` link uses `PHONE`. When
  `PHONE !== HOOK`, the hero and the sticky bar show the real number in small text under the CTA
  ("yoki {phoneDisplay}") and the dispatcher scene shows it on the dispatcher card. The CTA label
  itself keeps saying "105 ga qoʻngʻiroq", because that is the campaign line. **Must be set before
  launch** (tracked in CLAUDE.md).
- **Campaign window:** `MODE: 'teaser' | 'live' | 'ended'` in config, default `'live'`.
  `teaser`: CTA and sticky bar become a non-link pill "Tez orada" / "Скоро" with the launch date
  from `LAUNCH_DATE` if set; hero note says the line opens soon. `ended`: CTA becomes "Aksiya
  yakunlandi" / "Акция завершена", hero note thanks Tashkent; scenes and info stay. Copy keys for
  both states exist in both languages. No dates are known yet, so `LAUNCH_DATE` is empty.
- Service: Tashkent city only, 99 000 UZS on delivery. Hours unknown → placeholder text, clearly marked.
- Brand assets not received: logo, brand font, packshots. Use code-drawn placeholders with the
  same slots so assets can drop in later.
- Design rules: Apple HIG (project rule 2) with the installed skills; `apple-design` review before
  showing iterations; `landing-page-design`, `better-*`, `animate`, `review-animations` as checks.

## 4. The page

### 4.1 Structure (top to bottom)

| # | Section id | Type | What happens |
| --- | --- | --- | --- |
| 0 | `header` | fixed | Small wordmark "Chocobulance · 105", language toggle UZ / RU. Transparent over hero, frosted after scroll. |
| 1 | `hero` | pinned scene (1.5 vh) | Dawn sky. Big "105". Headline + sub + primary CTA (tel link) + secondary ("How it works" anchor). Van parked at right, siren light slowly pulsing. Scroll hint. |
| 2 | `scene-kitchen` | pinned scene (2 vh) | Kitchen at morning. Empty red tub centre, kid silhouette looking in, Dad's face peeking from behind the door with crumbs, slides away guiltily as you scroll. Headline "Dadam yeb qoʻydilar." Card: "most common emergencies" list (the humor). |
| 3 | `scene-call` | pinned scene (1.5 vh) | Phone with "105" being dialed (digits appear with scroll). Dispatcher bubble "Xavotir olmang — yetib kelamiz!". Headline + 1 line. |
| 4 | `scene-road` | pinned scene (3 vh) — the hero moment | Van drives left → right across Tashkent: three parallax layers (sky + far skyline: TV tower, Hotel Uzbekistan lattice; mid: Chorsu dome, flats, plane trees; near: road, metro "M" sign, lamp posts). Wheels rotate by distance. Sky shifts dawn → day. Siren light blinks. Headline "Shokolad tez yordami yoʻlda." |
| 5 | `scene-door` | pinned scene (1.5 vh) | Apartment door opens, choco-medic hands over a full tub, kid's eyes become hearts, Dad gives a thumbs-up from the back. Headline "Xavotir olmang — yetib keldik!" Price badge "99 000 soʻm · toʻlov yetkazib berilganda". |
| 6 | `how` | static | "Qanday ishlaydi?" — 3 numbered steps. |
| 7 | `coverage` | static | "Qayerga yetib boramiz?" — stylised Tashkent ring (SVG), inside red, outside grey; price card; hours placeholder. |
| 8 | `faq` | static | 5 Q&A in an accordion (native `<details>`). |
| 9 | `footer` | static | 20-years line, social placeholders, © Chococream, tiny "105 is the Chocobulance line, 103 is the real ambulance" note. |
| — | `sticky-cta` | fixed bottom (mobile), inline (desktop) | "105 ga qoʻngʻiroq" tel button, visible after the hero scrolls away. |

Scroll length: roughly 10–11 viewport heights total. Each pinned scene is a GSAP ScrollTrigger
with `scrub`; static sections use simple enter reveals.

### 4.2 Copy — Uzbek (Latin) · key = i18n key

Use `ʻ` (U+02BB) for oʻ / gʻ and `ʼ` (U+02BC) for the apostrophe in Chococreamʼni. **Builder
rule:** verify both glyphs render in the display font on macOS Safari, iOS Safari and Android
Chrome; if either falls back to a different font, replace both with `'` (U+0027) everywhere in
both JSON files and keep that convention.

```
meta.title        Chocobulance · 105 — Chococream shokolad tez yordami
meta.description  Chococream tugadimi? 105 ga qoʻngʻiroq qiling — Chocobulance yangi idishni Toshkent boʻylab uyingizgacha yetkazib beradi. 99 000 soʻm, toʻlov yetkazib berilganda.

header.brand      Chocobulance · 105
header.lang.uz    UZ
header.lang.ru    RU

hero.eyebrow      Chococream 20 yoshda · Shokolad tez yordami
hero.title        Chococream tugadimi?
hero.title2       105 ga qoʻngʻiroq qiling.
hero.body         Idish boʻshab qoldimi? Bu favqulodda holat. Chocobulance yangi Chococreamʼni uyingizgacha yetkazib beradi.
hero.cta          105 ga qoʻngʻiroq qilish
hero.cta2         Qanday ishlaydi?
hero.note         Faqat Toshkent shahri · 99 000 soʻm · Toʻlov yetkazib berilganda
hero.scroll       Pastga aylantiring

kitchen.eyebrow   Muammo
kitchen.title     Dadam yeb qoʻydilar.
kitchen.body      Ertalab hamma narsa tayyor: non, choy, kayfiyat. Faqat Chococream yoʻq. Va bu, odatda, kattalarning ishi.
kitchen.list.title  Eng koʻp uchraydigan favqulodda holatlar
kitchen.list.1    Dadam yeb qoʻydilar
kitchen.list.2    Akam «bir qoshiq» dedi
kitchen.list.3    Buvim shunchaki tatib koʻrdilar
kitchen.list.4    Mushuk? Yoʻq. Yana dadam.

call.eyebrow      Qoʻngʻiroq
call.title        105 ga qoʻngʻiroq qiling.
call.body         Manzilingizni ayting. Dispetcher buyurtmani tasdiqlaydi va eng yaqin Chocobulanceʼni yoʻlga chiqaradi.
call.bubble       Xavotir olmang — yetib kelamiz!
call.phone.label  Chocobulance dispetcheri

road.eyebrow      Yoʻlda
road.title        Shokolad tez yordami yoʻlda.
road.body         Qizil chiroq, oq xalat, toʻla idish. Toshkent koʻchalari boʻylab — toʻgʻri sizning eshigingizgacha.

door.eyebrow      Yetkazib berish
door.title        Xavotir olmang — yetib keldik!
door.body         Shokolad shifokori yangi Chococreamʼni topshiradi. Toʻlov — shu yerda. Favqulodda holat bartaraf etildi.
door.price        99 000 soʻm
door.price.note   toʻlov yetkazib berilganda

how.title         Qanday ishlaydi?
how.1.title       Qoʻngʻiroq qiling
how.1.body        105 raqamini tering va manzilingizni ayting.
how.2.title       Tasdiqlang
how.2.body        Dispetcher buyurtma va narxni tasdiqlaydi.
how.3.title       Qabul qiling
how.3.body        Chocobulance keladi. 99 000 soʻm toʻlaysiz va yangi Chococreamʼni olasiz.

coverage.title    Qayerga yetib boramiz?
coverage.body     Hozircha faqat Toshkent shahri ichida. Shahar tashqarisidagi manzillarga, afsuski, yetib bora olmasligimiz mumkin.
coverage.inside   Toshkent shahri — yetib boramiz
coverage.outside  Shahar tashqarisi — hozircha yoʻq
coverage.price    99 000 soʻm
coverage.price.note  Yangi Chococream + yetkazib berish. Toʻlov yetkazib berilganda.
coverage.hours.label  Ish vaqti
coverage.hours.value  Tez orada eʼlon qilinadi

faq.title         Savollar
faq.1.q           Bu haqiqiy xizmatmi?
faq.1.a           Ha. 105 ga qoʻngʻiroq qilasiz — Chocobulance keladi.
faq.2.q           Kim qoʻngʻiroq qila oladi?
faq.2.a           Istalgan odam: bola ham, kattalar ham. Lekin toʻlovni kattalar qiladi.
faq.3.q           Narxi qancha?
faq.3.a           99 000 soʻm. Toʻlov — Chococream qoʻlingizga tekkanda.
faq.4.q           Men Toshkentdan tashqaridaman.
faq.4.a           Hozircha faqat shahar ichida xizmat koʻrsatamiz.
faq.5.q           Qancha vaqtda kelasiz?
faq.5.a           Tez yordam kabi — iloji boricha tez. Aniq vaqtni dispetcher aytadi.

sticky.cta        105 ga qoʻngʻiroq
cta.or            yoki {phone}
state.teaser.cta  Tez orada
state.teaser.note Liniya {date} kuni ochiladi. Hozircha Chococreamʼni yashirib qoʻying.
state.teaser.note.nodate  Liniya tez orada ochiladi. Hozircha Chococreamʼni yashirib qoʻying.
state.ended.cta   Aksiya yakunlandi
state.ended.note  Rahmat, Toshkent! Chocobulance garajga qaytdi. Chococream esa — doʻkonlarda.

footer.line       Chocobulance — Chococreamʼning 20 yilligiga bagʻishlangan loyiha.
footer.copy       © 2026 Chococream
footer.note       105 — Chocobulance liniyasi. Haqiqiy tez yordam — 103.
footer.social.instagram  Instagram
footer.social.telegram   Telegram

a11y.van          Chocobulance mashinasi
a11y.lang         Tilni tanlang
a11y.menu         Menyu
```

### 4.3 Copy — Russian

```
meta.title        Chocobulance · 105 — шоколадная скорая помощь Chococream
meta.description  Chococream закончился? Звоните 105 — Chocobulance привезёт новую банку по Ташкенту прямо домой. 99 000 сум, оплата при получении.

header.brand      Chocobulance · 105
header.lang.uz    UZ
header.lang.ru    RU

hero.eyebrow      Chococream — 20 лет · Шоколадная скорая помощь
hero.title        Chococream закончился?
hero.title2       Звоните 105.
hero.body         Банка опустела? Это чрезвычайная ситуация. Chocobulance привезёт новый Chococream прямо к вам домой.
hero.cta          Позвонить 105
hero.cta2         Как это работает?
hero.note         Только Ташкент · 99 000 сум · Оплата при получении
hero.scroll       Листайте вниз

kitchen.eyebrow   Проблема
kitchen.title     Папа съел.
kitchen.body      Утром всё готово: хлеб, чай, настроение. Только Chococream нет. И чаще всего это дело рук взрослых.
kitchen.list.title  Самые частые чрезвычайные ситуации
kitchen.list.1    Папа съел
kitchen.list.2    Брат сказал «одну ложечку»
kitchen.list.3    Бабушка просто попробовала
kitchen.list.4    Кот? Нет. Снова папа.

call.eyebrow      Звонок
call.title        Позвоните 105.
call.body         Назовите адрес. Диспетчер подтвердит заказ и отправит ближайший Chocobulance.
call.bubble       Не волнуйтесь — мы едем!
call.phone.label  Диспетчер Chocobulance

road.eyebrow      В пути
road.title        Шоколадная скорая уже в пути.
road.body         Красный маячок, белый халат, полная банка. По улицам Ташкента — прямо к вашей двери.

door.eyebrow      Доставка
door.title        Не волнуйтесь — мы приехали!
door.body         Шоколадный доктор вручает новый Chococream. Оплата здесь же. Чрезвычайная ситуация устранена.
door.price        99 000 сум
door.price.note   оплата при получении

how.title         Как это работает?
how.1.title       Позвоните
how.1.body        Наберите 105 и назовите адрес.
how.2.title       Подтвердите
how.2.body        Диспетчер подтвердит заказ и цену.
how.3.title       Получите
how.3.body        Chocobulance приезжает. Вы платите 99 000 сум и получаете новый Chococream.

coverage.title    Куда мы приезжаем?
coverage.body     Пока только в пределах Ташкента. К адресам за городом, к сожалению, мы можем не доехать.
coverage.inside   Ташкент — приедем
coverage.outside  За городом — пока нет
coverage.price    99 000 сум
coverage.price.note  Новый Chococream + доставка. Оплата при получении.
coverage.hours.label  Часы работы
coverage.hours.value  Скоро объявим

faq.title         Вопросы
faq.1.q           Это настоящая услуга?
faq.1.a           Да. Вы звоните 105 — приезжает Chocobulance.
faq.2.q           Кто может позвонить?
faq.2.a           Кто угодно: и дети, и взрослые. Но платят взрослые.
faq.3.q           Сколько стоит?
faq.3.a           99 000 сум. Оплата — когда Chococream у вас в руках.
faq.4.q           Я за пределами Ташкента.
faq.4.a           Пока мы работаем только в городе.
faq.5.q           Как быстро приедете?
faq.5.a           Как скорая — как можно быстрее. Точное время скажет диспетчер.

sticky.cta        Позвонить 105
cta.or            или {phone}
state.teaser.cta  Скоро
state.teaser.note Линия откроется {date}. А пока спрячьте Chococream.
state.teaser.note.nodate  Линия откроется совсем скоро. А пока спрячьте Chococream.
state.ended.cta   Акция завершена
state.ended.note  Спасибо, Ташкент! Chocobulance вернулся в гараж. А Chococream — в магазинах.

footer.line       Chocobulance — проект к 20-летию Chococream.
footer.copy       © 2026 Chococream
footer.note       105 — линия Chocobulance. Настоящая скорая — 103.
footer.social.instagram  Instagram
footer.social.telegram   Telegram

a11y.van          Машина Chocobulance
a11y.lang         Выберите язык
a11y.menu         Меню
```

Every `105` inside copy strings is written as `{hook}` in the JSON files and filled from config at
render time; `{phone}` is the dial number in display form, `{price}` the price, `{date}` the
launch date. The copy above shows the rendered form for readability.

## 5. Visual design

### 5.1 Art direction
"Paper-cut Tashkent at sunrise." Flat vector shapes with soft two-stop gradients, rounded
corners, subtle grain-free shadows, limited palette. Warm, edible, a little bit toy-like. Not
3D, not photoreal, not neon. Humor comes from staging and faces, not from wacky type.

### 5.2 Color tokens (CSS custom properties, light mode is the art-directed default)

| Token | Value | Use |
| --- | --- | --- |
| `--red` | `#E2231A` | Chococream red: tub, van stripe, CTA, siren |
| `--red-deep` | `#B5120B` | pressed states, shadows on red |
| `--cream` | `#FFF6EC` | page background, cards |
| `--choco` | `#3E1F0E` | primary text, dark shapes |
| `--choco-soft` | `#6B4328` | secondary text |
| `--hazel` | `#C98A4B` | accents, hazelnuts, warm highlights |
| `--white` | `#FFFFFF` | van body, cards on red |
| `--sky-dawn-top` / `--sky-dawn-bottom` | `#FFB86B` / `#FFE2B8` | hero sky |
| `--sky-day-top` / `--sky-day-bottom` | `#8FD3FF` / `#E6F6FF` | road scene end |
| `--night` | `#1E1B2E` | footer background, dark-mode chrome |
| `--grey-out` | `#D9D4CC` | "outside the city" |

Contrast: all text ≥ 4.5:1 (choco on cream = 12:1; white on red 4.6:1 — use `--red-deep` for
small text on red). Dark mode (`prefers-color-scheme: dark`): scenes keep their art-directed
colors; static sections (how, coverage, faq, footer) switch to `--night` background with cream
text. Tokens in `src/styles/tokens.css`.

### 5.3 Type
- Display: **Nunito** 800/900 (Google Fonts, Latin Ext + Cyrillic), self-hosted subset in
  `public/fonts/` (woff2), `font-display: swap`. Rounded, friendly, close to the agency decks.
- Body/UI: system stack `-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, "Segoe UI", Roboto, sans-serif`.
- Scale (fluid, `clamp()`): display 44–96 px (hero "105" up to 200 px), h2 32–56, body 17–20,
  small 14–15. Line-height 1.1 display, 1.5 body. Max measure 60 ch.
- Numbers (105, 99 000) use tabular figures.

### 5.4 Layout and spacing
8-pt grid, section padding 64–120 px, content max-width 1120 px, safe-area insets respected.
Mobile first; pinned scenes keep text in the top third and art in the bottom two thirds so the
sticky CTA never covers a headline.

### 5.5 The van (swappable component)
`src/van/van.svg` as inline SVG, `viewBox="0 0 480 240"`, drawn facing right:
- `g#van-shadow` ellipse under the van
- `g#van-body` white body, red stripe, "Chocobulance" lettering on the side (text as path later;
  `<text>` now), red cross-like chocolate-drop emblem, windows, headlight, siren block
  `g#van-siren` with `rect#siren-light`
- `g#van-wheel-rear` and `g#van-wheel-front`: circles with 5 spokes so rotation is visible,
  `transform-origin` at each wheel centre, radius `r = 26`
- Data contract exported from `src/van/van.ts`: `{ wheelRadius: 26, wheelCenters: [{x,y},{x,y}], width: 480 }`
Wheel rotation in degrees = `translateX / (2 * π * r) * 360` — same formula whatever the art.
Swapping art = replace the SVG keeping the group ids and updating the constants.

### 5.6 Scenes (all inline SVG or layered divs, code-drawn)
- **Hero:** sky gradient, low skyline silhouette, road, van parked right, siren pulsing (CSS
  keyframe, 2 s, stops under reduced motion), big "105" numeral.
- **Kitchen:** window with dawn light, table, empty red tub (open lid, chocolate smears), kid
  silhouette (back view) leaning in, Dad's head peeking from behind door frame with a crumb,
  which slides out of frame as scroll progresses. Card with the four "emergencies".
- **Call:** phone frame with dial pad; digits 1-0-5 light up in sequence; a line travels from
  the phone to a dispatcher avatar (white coat, chocolate badge); speech bubble pops.
- **Road:** three parallax layers; landmarks as simplified silhouettes: Tashkent TV tower, Hotel
  Uzbekistan lattice facade, Chorsu dome, a metro "M" sign, plane trees, lamp posts, a bus stop.
  Van travels from x = −20 % to 110 % of the stage over the pinned distance; wheels rotate;
  sky interpolates dawn → day; small motion lines behind the van at speed.
- **Door:** apartment door opens (rotateY), choco-medic (white coat, red bag) hands a full tub to
  the kid; two heart "eyes" pop; Dad thumbs-up in the background; price badge drops in.
- **Coverage:** stylised Tashkent outline (ring road as a rounded shape), inside red tint,
  outside grey, van icon with "yetib boramiz" and a grey van outside with a crossed circle.

### 5.7 Motion rules
- Library: GSAP 3 + ScrollTrigger (free). Smooth scrolling: Lenis (optional, enabled on
  pointer: fine devices only).
- Pinned scenes use `scrub: 0.8`; property animations limited to `transform` and `opacity`;
  `will-change` only on moving layers.
- Easing: scroll-scrubbed motion is linear with the scroll; entrance reveals use `power2.out`,
  200–400 ms; pops (bubble, hearts) use a small spring (`back.out(1.4)`).
- `prefers-reduced-motion: reduce` → no pinning, no scrub, scenes render as static illustrated
  sections with the van in its final position; siren static.
- Nothing autoplays except the siren pulse and a slow idle bob of the parked van (±2 px).
- Mobile: pinned distances ×0.75; parallax factors reduced; frame budget verified at 60 fps on
  a mid-range Android in Chrome DevTools CPU 4× throttle.

## 6. Tech stack and project layout (builder may adjust tooling versions)

- **Vite 6 + vanilla TypeScript**, no framework. Single `index.html`.
- **GSAP 3.13+** (`gsap`, `gsap/ScrollTrigger`), **Lenis** (`lenis`) optional.
- **i18n:** `src/i18n/uz.json`, `src/i18n/ru.json` (flat keys above). `data-i18n="key"` attributes;
  `src/i18n.ts` applies strings, sets `<html lang>`, stores choice in `localStorage` (`lang`),
  honours `?lang=ru`. Default `uz`. `{phone}` placeholders replaced from config.
- **Config:** `src/config.ts` →
  `HOOK = '105'`, `PHONE = '105'` (// TODO replace before launch), `PHONE_DISPLAY = '105'`,
  `PHONE_TEL = \`tel:${PHONE}\``, `PRICE = '99 000'`, `MODE: 'teaser' | 'live' | 'ended' = 'live'`,
  `LAUNCH_DATE = ''`. Templates in JSON: `{hook}`, `{phone}`, `{price}`, `{date}`.
- **Styles:** `src/styles/tokens.css`, `base.css`, `layout.css`, `scenes.css`; no Tailwind.
- **Fonts:** self-hosted Nunito subset (Latin, Latin-ext, Cyrillic) in `public/fonts/`.
- **Tests:** Vitest. (1) every key in `uz.json` exists in `ru.json` and vice versa, no empty
  strings; (2) `wheelRotation(distance, r)` math; (3) i18n apply function sets `lang` and text.
- **Lint/format:** Prettier only.
- **SEO:** `<title>`, description, `og:*`, `hreflang` uz/ru via `?lang`, favicon, `og.png` placeholder
  rendered from the hero (static file, can be replaced).
- **Deploy (Railway):** `npm run build` → `dist/`; start command `npx serve -s dist -l $PORT`
  (`serve` as a dependency), `railway.json` with build/start; `engines.node >= 20`.
  Create a NEW Railway project; never touch "Haysam Landing Page Live".
- **Repo hygiene:** `.gitignore` (node_modules, dist, .DS_Store, `brief/*.html` and `*.pdf` are
  kept out of git by ignoring `*.pdf` and `chocobulance-pr-activation.html`), `README.md` with
  run/build/deploy and "how to swap the van" and "how to change the phone number".

```
/
├─ index.html
├─ public/ (fonts/, favicon.svg, og.png)
├─ src/
│  ├─ main.ts            boot: i18n, scroll, components
│  ├─ config.ts          PHONE, PRICE
│  ├─ i18n.ts, i18n/uz.json, i18n/ru.json
│  ├─ scroll/timeline.ts scenes' ScrollTriggers, parallax, wheels, sky
│  ├─ scroll/reduced.ts  reduced-motion branch
│  ├─ van/van.svg, van/van.ts (constants + wheelRotation)
│  ├─ scenes/{hero,kitchen,call,road,door,coverage}.svg  (inline via ?raw import)
│  └─ styles/{tokens,base,layout,scenes}.css
├─ tests/ (vitest)
├─ railway.json, package.json, tsconfig.json, vite.config.ts, README.md
└─ docs/superpowers/{specs,plans}/
```

## 7. Decisions made in this document (the user can overturn any of them)

- Look: **side-scrolling paper-cut street**, not the isometric diorama. Reason: the user's core
  ask is "van moves with scroll, wheels animated"; side view makes the wheels readable, keeps
  the van swappable, and is cheaper to draw well. (My call.)
- Display font Nunito; system stack for body. (My call; swap when the brand font arrives.)
- Russian via runtime toggle on one URL (`?lang=ru`), not separate pages. (My call: simpler
  for a two-week campaign; hreflang still set.)
- FAQ uses native `<details>`; no JS accordion. (My call.)
- Static hosting with `serve` on Railway. (My call; Docker/nginx not needed.)
- Dark mode only affects static sections. (My call; scenes are art-directed.)
- 105 is the hook, the dial target is a separate constant shown in small text when it differs.
  (My call after the builder check; the user said the real number comes later.)
- Campaign `MODE` flag with teaser/live/ended copy, default live, no dates. (My call after the
  builder check; cheap to add now, painful to add on launch day.)

## 8. Left to the builder

- Exact SVG shapes, stroke weights, shadow softness within the art direction.
- Exact scroll distances and parallax factors (tune to feel, then record in the timeline file).
- Font subsetting tool and the `og.png` rendering method.
- How Dad "peeks" (mask vs transform), how the door opens, bubble pop timing.
- Whether Lenis stays after testing on Android (drop it if it hurts scroll feel).

## 9. Open items for the user (not blocking the build)

- Final phone number (placeholder 105). Hours of service. Social links. Brand logo/font/packshots.
- Final van art (we keep the slot ready).
- Domain name for Railway custom domain.
