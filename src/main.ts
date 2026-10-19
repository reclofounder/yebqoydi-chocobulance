import './styles/tokens.css';
import './styles/base.css';
import { applyI18n, getLang, isLang, setLang } from './i18n';
import { applyMode, applyPhoneHint } from './state';

applyI18n(document, getLang());
applyMode(document);
applyPhoneHint(document);

// Delegated, so language buttons rendered after boot work too.
document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const lang = event.target.closest<HTMLElement>('[data-lang]')?.dataset.lang;
  if (!isLang(lang)) return;
  setLang(lang);
  // State copy (CTA label, note, phone hint) must follow the new language.
  applyMode(document);
  applyPhoneHint(document);
});
