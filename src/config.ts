// Single source of truth for the hotline, the price and the campaign state.

/** Dial number used in every `tel:` link, in international form. */
export const PHONE = '+998712099900';

/** The number as people read it. Its groups are joined by no-break spaces (U+00A0) so it never wraps. */
export const PHONE_DISPLAY = '71 209 99 00';

export const PHONE_TEL = `tel:${PHONE}`;

/** Price of one tub in UZS as displayed. Digit groups are joined by a no-break space. */
export const PRICE = '99 000';

/** teaser = pre-launch, live = accepting calls, ended = campaign over. */
export type Mode = 'teaser' | 'live' | 'ended';
export const MODE: Mode = 'live';
