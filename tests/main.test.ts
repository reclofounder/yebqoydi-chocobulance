// Boot wiring: copy and campaign mode on load; language buttons afterwards.
vi.doMock('../src/config', () => ({
  HOOK: '105',
  PHONE: '+998901234567',
  PHONE_DISPLAY: '+998901234567',
  PHONE_TEL: 'tel:+998901234567',
  PRICE: '99 000',
  MODE: 'teaser',
  LAUNCH_DATE: '',
}));

test('boot applies copy and state, and [data-lang] buttons switch the language', async () => {
  document.body.innerHTML = `
    <button data-lang="uz">UZ</button>
    <button data-lang="ru"><span>RU</span></button>
    <a class="cta" data-cta data-i18n="hero.cta" href="tel:105"></a>
    <p data-state-note></p>
    <p data-phone-hint hidden></p>`;
  const text = (selector: string) => document.querySelector(selector)!.textContent;

  await import('../src/main');

  expect(document.documentElement.lang).toBe('uz');
  expect(text('[data-cta]')).toBe('Tez orada');
  expect(text('[data-state-note]')).toBe(
    'Liniya tez orada ochiladi. Hozircha Chococreamʼni yashirib qoʻying.',
  );
  expect(document.querySelector('[data-phone-hint]')!.hasAttribute('hidden')).toBe(true);

  document.querySelector<HTMLElement>('[data-lang="ru"] span')!.click();

  expect(document.documentElement.lang).toBe('ru');
  expect(localStorage.getItem('lang')).toBe('ru');
  expect(text('[data-cta]')).toBe('Скоро');
  expect(text('[data-state-note]')).toBe(
    'Линия откроется совсем скоро. А пока спрячьте Chococream.',
  );

  document.querySelector<HTMLElement>('[data-lang="uz"]')!.click();
  expect(text('[data-cta]')).toBe('Tez orada');
});
