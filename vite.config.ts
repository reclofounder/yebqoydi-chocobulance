import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/**
 * Fills `%VITE_SITE_URL%` in index.html (og:image, twitter:image, og:url, the hreflang links)
 * with the site's public origin, a build variable set on Railway (README, Deploy). Link previews
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

export default defineConfig({
  plugins: [siteUrl()],
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
