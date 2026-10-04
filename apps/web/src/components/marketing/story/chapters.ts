/** Shared by the story's text and its 3D scene. */

/** Story position: 0 = hero … 4 = embed; each chapter's text is centred on screen at its number. */
export interface StoryProgress {
  current: number;
}

export const CHAPTERS = ['Meet Twirl', 'Upload', 'Choose parts', 'Colours & price', 'Embed'];

/** The chair's parts, in the order the "Choose parts" chapter highlights them. */
export const PARTS = [
  { node: 'Chair', label: 'Seat fabric' },
  { node: 'iron', label: 'Frame' },
  { node: 'Pillow_01', label: 'Back cushion' },
  { node: 'Pillow_02', label: 'Lumbar cushion' },
] as const;

/** The seat fabrics the "Colours & price" chapter steps through (null hex = the model's own). */
export const FABRICS = [
  { name: 'Lagoon weave', hex: null, price: 0 },
  { name: 'Oat linen', hex: '#d8ccb6', price: 0 },
  { name: 'Sage', hex: '#8fa58a', price: 40 },
  { name: 'Terracotta', hex: '#b5532f', price: 60 },
  { name: 'Teal velvet', hex: '#2f6f6a', price: 60 },
] as const;

export const BASE_PRICE = 899;
export const CUSHION_PRICE = 49;

export function fabricIndex(t: number) {
  if (t < 2.55) return 0;
  return Math.min(FABRICS.length - 1, Math.floor(((t - 2.55) / 0.9) * FABRICS.length));
}

/** Which part is highlighted (-1 = none): each gets a quarter of the "Choose parts" chapter. */
export function partIndex(t: number) {
  if (t < 1.55 || t >= 2.5) return -1;
  return Math.min(PARTS.length - 1, Math.floor(((t - 1.55) / 0.9) * PARTS.length));
}

export const EMBED_CODE = `<div data-twirl-product="Hq8dKs2mPz4A"></div>
<script src="…/embed.js" async></script>`;
