import { defineConfig } from 'vitest/config';

export default defineConfig({
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
