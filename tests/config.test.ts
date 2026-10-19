import { HOOK, PHONE, PHONE_TEL, PRICE, MODE } from '../src/config';
test('config defaults', () => {
  expect(HOOK).toBe('105');
  expect(PHONE_TEL).toBe(`tel:${PHONE}`);
  expect(PRICE).toBe('99 000');
  expect(['teaser', 'live', 'ended']).toContain(MODE);
});
