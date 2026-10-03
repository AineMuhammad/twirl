/**
 * Messages between the embedded configurator (`/embed/[id]`, inside an iframe) and the host
 * page's `embed.js`. Keep in sync with `public/embed.js`, which can't import this file.
 */

export const EMBED_SOURCE = 'twirl';

export type EmbedMessage =
  | { source: typeof EMBED_SOURCE; type: 'ready'; productId: string }
  | { source: typeof EMBED_SOURCE; type: 'resize'; productId: string; height: number }
  | {
      source: typeof EMBED_SOURCE;
      type: 'change';
      productId: string;
      selections: Record<string, unknown>;
      price: { total: number; currency: string };
    };

/** Whether `data` is a well-formed message from the embed. */
export function isEmbedMessage(data: unknown): data is EmbedMessage {
  if (typeof data !== 'object' || data === null) return false;
  const m = data as Record<string, unknown>;
  if (m.source !== EMBED_SOURCE || typeof m.productId !== 'string') return false;
  if (m.type === 'ready') return true;
  if (m.type === 'resize') return typeof m.height === 'number' && Number.isFinite(m.height);
  if (m.type === 'change') {
    const price = m.price as Record<string, unknown> | undefined;
    return (
      typeof m.selections === 'object' &&
      m.selections !== null &&
      typeof price?.total === 'number' &&
      typeof price.currency === 'string'
    );
  }
  return false;
}

/**
 * The frame height the embed asks for at a given width: landscape on wide screens, portrait on
 * phones (where options sit below the model), within sensible bounds.
 */
export function preferredHeight(width: number): number {
  const ratio = width < 640 ? 1.5 : 0.62;
  return Math.round(Math.min(900, Math.max(480, width * ratio)));
}

/** The snippet merchants paste into their site. */
export function embedSnippet(appUrl: string, publicId: string): string {
  const base = appUrl.replace(/\/+$/, '');
  return `<div data-twirl-product="${publicId}"></div>\n<script src="${base}/embed.js" async></script>`;
}
