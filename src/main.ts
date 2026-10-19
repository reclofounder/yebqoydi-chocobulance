import '@fontsource/nunito/800.css';
import '@fontsource/nunito/900.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/scenes.css';
import './styles/van.css';
import { applyI18n, getLang, isLang, setLang } from './i18n';
import { mountScenes } from './scenes/mount';
import { applyMode, applyPhoneHint } from './state';

// Art first, so the language pass also labels what it mounts (the van's aria-label).
mountScenes(document);
applyI18n(document, getLang());
applyMode(document);
applyPhoneHint(document);

// Delegated, so language buttons rendered after boot work too.
document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const lang = event.target.closest<HTMLElement>('[data-lang]')?.dataset.lang;
  if (!isLang(lang)) return;
  // applyMode/applyPhoneHint tag their copy with data-i18n, so setLang already re-translates it.
  setLang(lang);
});
