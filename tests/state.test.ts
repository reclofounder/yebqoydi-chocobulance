import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { applyI18n, setLang, t } from '../src/i18n';
import { applyMode, applyPhoneHint } from '../src/state';

// Mutable stand-in for src/config so each test can pick its own campaign state.
const { DEFAULTS, cfg } = vi.hoisted(() => {
  const DEFAULTS = {
    HOOK: '105',
    PHONE: '105',
    PHONE_DISPLAY: '105',
    PRICE: '99 000',
    MODE: 'live',
    LAUNCH_DATE: '',
  };
  return { DEFAULTS, cfg: { ...DEFAULTS } };
});

vi.mock('../src/config', () => ({
  get HOOK() {
    return cfg.HOOK;
  },
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
  get LAUNCH_DATE() {
    return cfg.LAUNCH_DATE;
  },
}));

const MARKUP = `
  <a class="cta cta--big" data-cta="hero" data-i18n="hero.cta" href="tel:105">x</a>
  <p data-state-note data-i18n="hero.note">x</p>
  <p data-phone-hint hidden></p>
`;

function render(config: Partial<typeof DEFAULTS>, lang: 'uz' | 'ru' = 'uz') {
  Object.assign(cfg, DEFAULTS, config);
  document.body.innerHTML = MARKUP;
  applyI18n(document, lang);
  applyMode(document);
  applyPhoneHint(document);
}

const cta = () => document.querySelector<HTMLElement>('[data-cta]')!;
const note = () => document.querySelector<HTMLElement>('[data-state-note]')!;
const hint = () => document.querySelector<HTMLElement>('[data-phone-hint]')!;

afterEach(() => {
  localStorage.clear();
  document.body.innerHTML = '';
});

describe('teaser mode', () => {
  test('without a launch date the CTA is a disabled span and the note has no date', () => {
    render({ MODE: 'teaser', LAUNCH_DATE: '' });

    expect(cta().tagName).toBe('SPAN');
    expect(cta().textContent).toBe(t('state.teaser.cta'));
    expect(note().textContent).toBe(t('state.teaser.note.nodate'));
  });

  test('the disabled span keeps its classes and data-cta, drops href, and is aria-disabled', () => {
    render({ MODE: 'teaser' });

    expect(cta().classList.contains('cta')).toBe(true);
    expect(cta().classList.contains('cta--big')).toBe(true);
    expect(cta().classList.contains('cta--disabled')).toBe(true);
    expect(cta().getAttribute('data-cta')).toBe('hero');
    expect(cta().getAttribute('aria-disabled')).toBe('true');
    expect(cta().hasAttribute('href')).toBe(false);
  });

  test('with a launch date the note shows it', () => {
    render({ MODE: 'teaser', LAUNCH_DATE: '1 noyabr' });

    expect(note().textContent).toBe(t('state.teaser.note'));
    expect(note().textContent).toContain('1 noyabr');
  });

  test('applying twice leaves exactly one disabled span', () => {
    render({ MODE: 'teaser' });
    applyMode(document);

    expect(document.querySelectorAll('[data-cta]')).toHaveLength(1);
    expect(cta().tagName).toBe('SPAN');
    expect(cta().textContent).toBe(t('state.teaser.cta'));
  });

  test('state copy follows the language', () => {
    render({ MODE: 'teaser' });

    setLang('ru');
    expect(cta().textContent).toBe('Скоро');
    applyMode(document);
    expect(cta().textContent).toBe('Скоро');
    expect(note().textContent).toBe(t('state.teaser.note.nodate', 'ru'));
  });
});

describe('ended mode', () => {
  test('CTA is a disabled span and the note uses the plain ended note', () => {
    render({ MODE: 'ended', LAUNCH_DATE: '' });

    expect(cta().tagName).toBe('SPAN');
    expect(cta().classList.contains('cta--disabled')).toBe(true);
    expect(cta().textContent).toBe(t('state.ended.cta'));
    expect(note().textContent).toBe(t('state.ended.note'));
  });
});

describe('phone hint outside live mode', () => {
  test.each(['teaser', 'ended'])('stays hidden in %s mode even with a distinct number', (MODE) => {
    render({ MODE, PHONE: '+998901234567', PHONE_DISPLAY: '+998901234567' });

    expect(hint().hasAttribute('hidden')).toBe(true);
  });
});

describe('live mode', () => {
  test('CTA stays a link to the dial number and the hint shows the number', () => {
    render({ MODE: 'live', PHONE: '+998901234567', PHONE_DISPLAY: '+998901234567', HOOK: '105' });

    const link = document.querySelector<HTMLAnchorElement>('a[data-cta]')!;
    expect(link.getAttribute('href')).toBe('tel:+998901234567');
    expect(link.textContent).toContain('105');
    expect(link.classList.contains('cta--disabled')).toBe(false);

    expect(hint().hasAttribute('hidden')).toBe(false);
    expect(hint().textContent).toBe('yoki +998901234567');
  });

  test('hint is hidden when the dial number is the hook itself', () => {
    render({ MODE: 'live', PHONE: '105', HOOK: '105' });

    expect(document.querySelector<HTMLAnchorElement>('a[data-cta]')!.getAttribute('href')).toBe(
      'tel:105',
    );
    expect(hint().hasAttribute('hidden')).toBe(true);
  });

  test('a visible hint follows the language', () => {
    render({ PHONE: '+998901234567', PHONE_DISPLAY: '+998901234567' });

    setLang('ru');
    expect(hint().textContent).toBe('или +998901234567');
  });
});

describe('the real number across the whole page', () => {
  // A desktop visitor cannot tap tel: and the sticky bar is phones-only, so once the dial number
  // differs from the hook it is printed by every call: the hero, the call bar (phones), the header
  // pill (desktop), the call under the steps, and on the dispatcher's desk in the call scene.
  const page = new DOMParser().parseFromString(
    readFileSync(resolve(process.cwd(), 'index.html'), 'utf8'),
    'text/html',
  ).body.innerHTML;
  function boot(config: Partial<typeof DEFAULTS>) {
    Object.assign(cfg, DEFAULTS, config);
    document.body.innerHTML = page;
    applyI18n(document, 'uz');
    applyMode(document);
    applyPhoneHint(document);
  }
  const line = () => document.querySelector<HTMLElement>('#scene-call .dispatcher-line')!;
  const REAL = { PHONE: '+998901234567', PHONE_DISPLAY: '+998 90 123 45 67' };

  test('prints it by every call, the header pill and the call under the steps included', () => {
    boot(REAL);

    for (const where of ['#header', '#hero', '#how', '#sticky-cta']) {
      const hint = document.querySelector<HTMLElement>(`${where} [data-phone-hint]`);
      expect(hint, `${where} has a hint`).not.toBeNull();
      expect(hint!.hidden, `${where} hint shown`).toBe(false);
      expect(hint!.textContent, where).toBe('yoki +998 90 123 45 67');
    }
  });

  test("shows it on the dispatcher's desk, under her translated title", () => {
    boot(REAL);

    expect(line().hidden).toBe(false);
    expect(line().querySelector('[data-phone-number]')!.textContent).toBe('+998 90 123 45 67');
    const label = line().querySelector('[data-i18n="call.phone.label"]')!;
    expect(label.textContent).toBe('Chocobulance dispetcheri');

    setLang('ru');
    expect(label.textContent).toBe('Диспетчер Chocobulance');
    expect(line().querySelector('[data-phone-number]')!.textContent).toBe('+998 90 123 45 67');
  });

  test.each([
    ['live', 'the number is the hook itself', { PHONE: '105', PHONE_DISPLAY: '105' }],
    ['teaser', 'a real number is set', REAL],
    ['ended', 'a real number is set', REAL],
  ] as const)(
    'keeps every hint and the desk line hidden in %s mode when %s',
    (MODE, _why, numbers) => {
      boot({ MODE, ...numbers });

      const all = [
        ...document.querySelectorAll<HTMLElement>('[data-phone-hint], [data-phone-line]'),
      ];
      expect(all).toHaveLength(5);
      for (const el of all) expect(el.hidden).toBe(true);
    },
  );
});
