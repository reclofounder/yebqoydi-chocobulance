import '@fontsource/baloo-2/latin-800.css';
import '@fontsource/nunito/cyrillic-900.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/car.css';
import { applyI18n, getLang, isLang, setLang } from './i18n';
import { initScroll, refreshScroll } from './scroll/motion';
import { applyMode } from './state';

try {
  applyI18n(document, getLang());
  applyMode(document);
} finally {
  // The shell is hidden until it is complete (base.css): painted empty, its words would jump in
  // when the copy arrives, and that is layout shift. Revealed even if a step above threw.
  document.documentElement.removeAttribute('data-booting');
}

// Delegated, so language buttons rendered after boot work too.
document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const lang = event.target.closest<HTMLElement>('[data-lang]')?.dataset.lang;
  if (!isLang(lang)) return;
  // applyMode tags its copy with data-i18n, so setLang already re-translates it.
  setLang(lang);
});

// A new language changes the copy's length, so the lanes move down or up the page: re-measure
// now (which also starts loading the new script's font), and again once it is in.
document.addEventListener('langchange', () => {
  refreshScroll();
  void document.fonts?.ready.then(refreshScroll);
});

// The motion last: the lanes are measured against the page, and the fonts set its heights.
void (document.fonts?.ready ?? Promise.resolve()).then(initScroll);
