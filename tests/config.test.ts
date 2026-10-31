import { PHONE, PHONE_DISPLAY, PHONE_TEL, PRICE, MODE } from '../src/config';
test('config defaults', () => {
  expect(PHONE).toBe('+998712099900');
  expect(PHONE_TEL).toBe('tel:+998712099900');
  // No-break spaces: neither the number nor the price ever wraps between its groups.
  expect(PHONE_DISPLAY).toBe('71\u00a0209\u00a099\u00a000');
  expect(PRICE).toBe('45\u00a0000');
  expect(['teaser', 'live', 'ended']).toContain(MODE);
});
