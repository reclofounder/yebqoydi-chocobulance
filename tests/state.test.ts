import { applyI18n, setLang, t } from '../src/i18n';
import { applyMode } from '../src/state';

// Mutable stand-in for src/config so each test can pick its own campaign state.
const { DEFAULTS, cfg } = vi.hoisted(() => {
  const DEFAULTS = {
    PHONE: '+998712099900',
    PHONE_DISPLAY: '71\u00a0209\u00a099\u00a000',
    PRICE: '45\u00a0000',
    MODE: 'live',
  };
  return { DEFAULTS, cfg: { ...DEFAULTS } };
});

vi.mock('../src/config', () => ({
  get PHONE() {
    return cfg.PHONE;
  },
  get PHONE_DISPLAY() {
    return cfg.PHONE_DISPLAY;
  },
  get PHONE_TEL() {
    return `tel:${cfg.PHONE}`;
  },
  get PRICE() {
    return cfg.PRICE;
  },
  get MODE() {
    return cfg.MODE;
  },
}));

// The two kinds of call on the page: the header button, and the number inside the call line.
const MARKUP = `
  <a class="call" data-cta href="tel:old" data-i18n-attr="aria-label:a11y.call"
    ><span class="call__label" data-i18n="header.call">x</span></a>
  <h2><span data-i18n="call.before"></span>
    <a class="tel" data-tel href="tel:old" data-i18n="call.number">x</a>
    <span data-i18n="call.after"></span></h2>
`;

function render(config: Partial<typeof DEFAULTS>, lang: 'uz' | 'ru' = 'uz') {
  Object.assign(cfg, DEFAULTS, config);
  document.body.innerHTML = MARKUP;
  applyI18n(document, lang);
  applyMode(document);
}

const cta = () => document.querySelector<HTMLElement>('[data-cta]')!;
const tel = () => document.querySelector<HTMLElement>('[data-tel]')!;

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('live mode', () => {
  test('the header button and the number in the copy both dial PHONE', () => {
    render({ MODE: 'live' });

    expect(cta().getAttribute('href')).toBe('tel:+998712099900');
    expect(tel().getAttribute('href')).toBe('tel:+998712099900');
    expect(tel().textContent).toBe('71\u00a0209\u00a099\u00a000');
    expect(cta().getAttribute('aria-label')).toBe(
      '71\u00a0209\u00a099\u00a000 raqamiga qoʻngʻiroq qilish',
    );
  });

  test('follows a new PHONE without touching the markup', () => {
    render({ MODE: 'live', PHONE: '+998901234567', PHONE_DISPLAY: '90 123 45 67' });

    expect(cta().getAttribute('href')).toBe('tel:+998901234567');
    expect(tel().getAttribute('href')).toBe('tel:+998901234567');
    expect(tel().textContent).toBe('90 123 45 67');
  });
});

describe.each(['teaser', 'ended'] as const)('%s mode', (mode) => {
  test('the header button becomes an inert, labelled pill', () => {
    render({ MODE: mode });

    expect(cta().localName).toBe('span');
    expect(cta().hasAttribute('href')).toBe(false);
    expect(cta().classList.contains('call')).toBe(true);
    expect(cta().classList.contains('cta--disabled')).toBe(true);
    expect(cta().getAttribute('aria-disabled')).toBe('true');
    expect(cta().textContent).toBe(t(`state.${mode}.cta`, 'uz'));
  });

  test('the number in the copy stays as text but no longer dials', () => {
    render({ MODE: mode });

    expect(tel().hasAttribute('href')).toBe(false);
    expect(tel().textContent).toBe('71\u00a0209\u00a099\u00a000');
  });

  test('the pill follows a language switch, since it carries its own data-i18n', () => {
    render({ MODE: mode });

    setLang('ru');
    expect(cta().textContent).toBe(t(`state.${mode}.cta`, 'ru'));
  });

  test('running it twice changes nothing more', () => {
    render({ MODE: mode });
    const once = document.body.innerHTML;

    applyMode(document);
    expect(document.body.innerHTML).toBe(once);
  });
});
