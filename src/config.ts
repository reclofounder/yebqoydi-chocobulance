// Single source of truth for hotline, price and launch state.
// TODO: replace PHONE / PHONE_DISPLAY with the real hotline before launch

/** The campaign hook shown in copy ("105", parody of 103). */
export const HOOK = '105';

/** Dial number used in every `tel:` link. May differ from HOOK (e.g. '+998901234567'). */
export const PHONE = '105';

/** Human-readable form of PHONE shown in "yoki {phone}" hints. */
export const PHONE_DISPLAY = '105';

export const PHONE_TEL = `tel:${PHONE}`;

/** Price in UZS as displayed (digit groups separated by a plain space). */
export const PRICE = '99 000';

/** teaser = pre-launch, live = accepting calls, ended = campaign over. */
export type Mode = 'teaser' | 'live' | 'ended';
export const MODE: Mode = 'live';

/** Launch date shown in teaser mode; empty string means "date not announced yet". */
export const LAUNCH_DATE = '';
