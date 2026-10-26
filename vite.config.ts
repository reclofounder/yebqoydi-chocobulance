import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import uz from './src/i18n/uz.json';
import { fillTemplate } from './src/i18n';

/**
 * Fills `%VITE_SITE_URL%` in index.html (canonical, og:image, twitter:image, og:url, the hreflang
 * links, the structured data) with the site's public origin, a build variable set on Vercel
 * (https://yebqoydi.uz; README, Deploy). Link previews
 * need those tags absolute. Unset, it becomes '' and the tags stay relative, never the literal
 * placeholder (Vite's own %ENV% pass would leave an unknown name as it is). A trailing slash is
 * dropped, so '%VITE_SITE_URL%/og.png' never turns into '//og.png'. Runs before Vite's own HTML
 * passes, which then see a plain public path or an external URL.
 */
export function siteUrl(): Plugin {
  let origin = '';
  return {
    name: 'chocobulance:site-url',
    configResolved(config) {
      origin = String(config.env.VITE_SITE_URL ?? '').replace(/\/+$/, '');
    },
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replaceAll('%VITE_SITE_URL%', origin),
    },
  };
}

const escapeHtml = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

/**
 * Writes the Uzbek copy into index.html: every empty `data-i18n` element gets its text, and every
 * `data-i18n-attr` its attributes, as src/i18n.ts would set them. Search engines that do not run
 * scripts (Yandex often does not) then read the real words, and so does a visitor without
 * JavaScript. The page still switches language at runtime as before.
 */
export function prerenderCopy(dict: Record<string, string> = uz): Plugin {
  const text = (key: string) => escapeHtml(fillTemplate(dict[key] ?? ''));
  return {
    name: 'chocobulance:prerender-copy',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html
          .replace(
            /(<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\sdata-i18n="([^"]+)"[^>]*>)\s*(<\/\2\s*>)/g,
            (_, open: string, _tag: string, key: string, close: string) =>
              `${open}${text(key)}${close}`,
          )
          .replace(
            /<[a-zA-Z][a-zA-Z0-9]*\b[^>]*\sdata-i18n-attr="([^"]+)"[^>]*>/g,
            (tag: string, pairs: string) => {
              let out = tag;
              for (const pair of pairs.split(',')) {
                const [attr, key] = pair.split(':').map((part) => part.trim());
                if (!attr || !key || new RegExp(`\\s${attr}="`).test(out)) continue;
                out = out.replace(/\s*\/?>$/, (end) => ` ${attr}="${text(key)}"${end}`);
              }
              return out;
            },
          ),
    },
  };
}

/**
 * The files search engines ask for, written for the site's public origin (VITE_SITE_URL):
 * robots.txt (everything allowed, and where the sitemap is) and sitemap.xml (the Uzbek page, the
 * canonical one, and the Russian one, each with its language alternates). Without an origin only
 * robots.txt is written: a sitemap needs absolute addresses.
 */
export function seoFiles(): Plugin {
  let origin = '';
  return {
    name: 'chocobulance:seo-files',
    apply: 'build',
    configResolved(config) {
      origin = String(config.env.VITE_SITE_URL ?? '').replace(/\/+$/, '');
    },
    generateBundle() {
      const robots = ['User-agent: *', 'Allow: /'];
      if (origin) robots.push('', `Sitemap: ${origin}/sitemap.xml`);
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `${robots.join('\n')}\n` });
      if (!origin) return;

      const day = new Date().toISOString().slice(0, 10);
      const pages = { uz: `${origin}/`, ru: `${origin}/?lang=ru` };
      const alternates = [
        `    <xhtml:link rel="alternate" hreflang="uz" href="${pages.uz}"/>`,
        `    <xhtml:link rel="alternate" hreflang="ru" href="${pages.ru}"/>`,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${pages.uz}"/>`,
      ].join('\n');
      const urls = Object.values(pages)
        .map(
          (loc) =>
            `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${day}</lastmod>\n${alternates}\n  </url>`,
        )
        .join('\n');
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source:
          '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
          `${urls}\n</urlset>\n`,
      });
    },
  };
}

export default defineConfig({
  plugins: [siteUrl(), prerenderCopy(), seoFiles()],
  build: {
    // Script syntax is lowered to ES2020 (Chrome 80, Safari 14, Firefox 74 and newer), no further.
    target: 'es2020',
    // The stylesheet already needs more than that (100svh, color-mix(), the individual transform
    // properties), so lowering it to ES2020's browsers only adds fallbacks nobody could use:
    // keep Vite's own CSS floor (its default before the script target was set).
    cssTarget: ['chrome111', 'edge111', 'firefox114', 'safari16.4', 'ios16.4'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
  },
});
