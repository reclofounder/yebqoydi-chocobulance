# Getting yebqoydi.uz to the top

Goal: someone types "yebqoydi.uz", "yebqoʻydi.uz", "yeb qoʻydi" or "chocobulance" into Google or Yandex and
this site is the first result. For your own domain name that is very achievable, usually within days of the
search engines discovering the site. The site side is done (below); what is left is registering the site with
the search engines and giving them links to follow.

## Already done on the site (2026-10-26)

- One address: `https://yebqoydi.uz`. `www.yebqoydi.uz` and `chocobulance-omega.vercel.app` both redirect
  to it permanently (308), so search engines never see two copies of the site.
- `<link rel="canonical">` on every page view, pointing at the language shown (`/` Uzbek, `/?lang=ru` Russian).
- `hreflang` links for Uzbek, Russian and the default, in the page and in the sitemap.
- `https://yebqoydi.uz/sitemap.xml` and `https://yebqoydi.uz/robots.txt` (everything allowed, sitemap listed).
- The page's words are in the HTML itself, not only added by JavaScript, so Yandex (which often reads pages
  without running scripts) sees the real text.
- Title starts with the domain: "yebqoydi.uz — Chocobulance: Chococream shokolad tez yordami".
- Structured data (JSON-LD): the site named `yebqoydi.uz` with alternate names `Yebqoʻydi.uz`,
  `Yebqo'ydi.uz`, `Yeb qoʻydi`, `Yebqoydi`, `Chocobulance`; the service, its phone, price and city.
- Link preview image (`og.png`) with "Yeb qoʻydingizmi?", absolute address for Telegram, Facebook and X.
- An IndexNow key for Yandex and Bing: `https://yebqoydi.uz/2b633bd7fab7770369e1c2230c7085a5.txt`.
- Lighthouse SEO score: 100.

## What you do now (in this order, about 30 minutes)

### 1. Yandex Webmaster (the most important one in Uzbekistan)

1. Open https://webmaster.yandex.com and sign in with a Yandex account.
2. Add site `https://yebqoydi.uz`.
3. Verify ownership. The easiest way is the **DNS TXT record**: Yandex shows a value like
   `yandex-verification: 1234abcd`. Add it in Vercel: Project → Settings → Domains → yebqoydi.uz → DNS
   records (the domain uses Vercel DNS), type `TXT`, name `@`, value as Yandex shows it. Or send me the
   code and I will add the meta tag to the page instead.
4. Indexing → Sitemap files → add `https://yebqoydi.uz/sitemap.xml`.
5. Indexing → Reindex pages → add `https://yebqoydi.uz/` and `https://yebqoydi.uz/?lang=ru`.
6. Site information → Regional settings → set region **Tashkent**.

### 2. Google Search Console

1. Open https://search.google.com/search-console and add a **Domain** property: `yebqoydi.uz`.
2. Google gives a TXT record (`google-site-verification=...`). Add it in Vercel DNS the same way (`TXT`, `@`).
3. Sitemaps → submit `https://yebqoydi.uz/sitemap.xml`.
4. URL inspection → `https://yebqoydi.uz/` → **Request indexing**.

### 3. Bing Webmaster Tools (also feeds DuckDuckGo, Yahoo, and ChatGPT search)

1. Open https://www.bing.com/webmasters and choose **Import from Google Search Console** (fastest), or add the
   site and verify with a TXT record.
2. Submit the sitemap. Bing and Yandex both accept IndexNow pings; tell me after verifying and I can send one
   after each deploy.

### 4. Links that point to yebqoydi.uz (what makes the jump to #1 fast)

Search engines rank a new domain faster when known sites link to it. Each of these takes minutes:

- **Instagram, Telegram, Facebook bios** of Chococream and 605 Agency: put `yebqoydi.uz` in the bio link.
- **Every campaign post, story and blogger post**: write the address as text, `yebqoydi.uz`, and link it.
- **Chococream's own website** (if any): a link or banner to `https://yebqoydi.uz`.
- **The PR article**: ask the publisher to link `yebqoydi.uz` (a clickable link, not just the text).
- **Yandex Business** (https://yandex.uz/sprav, formerly Yandex Directory) and **Google Business Profile**
  (https://business.google.com): create a "Chocobulance" listing with the website `yebqoydi.uz`, phone
  71 209 99 00, service area Tashkent. These show up on maps and in local results.
- **2GIS** (popular in Tashkent): add the service with the website link.

### 5. Help people type it right

People will type `yebqoydi`, `yebqoʻydi`, `yeb qoydi` or `yebqo'ydi.uz`. A browser cannot open
`yebqo'ydi.uz` (an apostrophe is not allowed in domain names), so it becomes a search, and then the
search engine needs to match it to this site. The alternate names in the structured data and the title help.
To catch typos completely:

- Consider registering `yebqoydi.com` and `chocobulance.uz` and redirecting them to `yebqoydi.uz`
  (Vercel: add the domain to the project and set it to redirect).
- On billboards and in videos, always write the address exactly: **yebqoydi.uz**.

## How to check progress

- In Google and Yandex search: `site:yebqoydi.uz` lists what they have indexed (empty in the first days is
  normal).
- Then search `yebqoydi.uz` and `yebqoʻydi` themselves. With the steps above done, expect the site to show
  for its own name within a few days (Yandex can take 1–2 weeks for a brand-new domain).
- Search Console and Yandex Webmaster show the search words people used and your position for each.

## If you change the domain again

Set `VITE_SITE_URL` in Vercel (Project → Settings → Environment Variables, Production) to the new address,
update the redirect in `vercel.json`, and redeploy: canonical, sitemap, robots, share tags and structured data
all follow it.
