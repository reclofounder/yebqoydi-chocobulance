// Boot wiring: copy and campaign mode on load; the motion once fonts are in; language buttons
// afterwards (they also re-measure the lanes, since the copy's length moves them).
const story = vi.hoisted(() => ({ init: vi.fn(), refresh: vi.fn() }));

vi.doMock('../src/config', () => ({
  PHONE: '+998712099900',
  PHONE_DISPLAY: '71 209 99 00',
  PHONE_TEL: 'tel:+998712099900',
  PRICE: '99 000',
  MODE: 'teaser',
}));
vi.doMock('../src/scroll/motion', () => ({
  initScroll: story.init,
  refreshScroll: story.refresh,
}));

test('boot applies copy and state, and [data-lang] buttons switch the language', async () => {
  document.body.innerHTML = `
    <button data-lang="uz">UZ</button>
    <button data-lang="ru"><span>RU</span></button>
    <a class="call" data-cta href="tel:+998712099900"></a>
    <a class="tel" data-tel data-i18n="call.number" href="tel:+998712099900"></a>
    <h2 data-i18n="hero.title"></h2>`;
  const text = (selector: string) => document.querySelector(selector)!.textContent;
  let fontsReady!: () => void;
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: { ready: new Promise<void>((resolve) => (fontsReady = resolve)) },
  });
  // index.html ships hidden (base.css): the shell is revealed once its copy is in.
  document.documentElement.setAttribute('data-booting', '');

  await import('../src/main');

  expect(document.documentElement.hasAttribute('data-booting')).toBe(false);
  expect(document.documentElement.lang).toBe('uz');
  expect(text('[data-cta]')).toBe('Tez orada');
  expect(text('h2')).toBe('Yebqoʻydingizmi?');
  // Teaser: the number in the copy stays readable, but is not a link yet.
  expect(text('[data-tel]')).toBe('71 209 99 00');
  expect(document.querySelector('[data-tel]')!.hasAttribute('href')).toBe(false);

  // The lanes are measured with the final fonts, so the motion starts only once they are in.
  expect(story.init).not.toHaveBeenCalled();
  fontsReady();
  await Promise.resolve();
  await Promise.resolve();
  expect(story.init).toHaveBeenCalledTimes(1);

  document.querySelector<HTMLElement>('[data-lang="ru"] span')!.click();

  expect(document.documentElement.lang).toBe('ru');
  expect(localStorage.getItem('lang')).toBe('ru');
  expect(text('[data-cta]')).toBe('Скоро');
  expect(text('h2')).toBe('Всё съели?');
  // Re-measured at once, and again once the new script's font subset (Cyrillic) is in.
  expect(story.refresh).toHaveBeenCalledTimes(1);
  await Promise.resolve();
  await Promise.resolve();
  expect(story.refresh).toHaveBeenCalledTimes(2);

  document.querySelector<HTMLElement>('[data-lang="uz"]')!.click();
  expect(text('[data-cta]')).toBe('Tez orada');
  await Promise.resolve();
  await Promise.resolve();
  expect(story.refresh).toHaveBeenCalledTimes(4);
});

test('the page is revealed even if a boot step throws, never left blank', async () => {
  vi.resetModules();
  vi.doMock('../src/state', () => ({
    applyMode: () => {
      throw new Error('boom');
    },
  }));
  document.documentElement.setAttribute('data-booting', '');

  await expect(import('../src/main')).rejects.toThrow('boom');

  expect(document.documentElement.hasAttribute('data-booting')).toBe(false);
  vi.doUnmock('../src/state');
});
